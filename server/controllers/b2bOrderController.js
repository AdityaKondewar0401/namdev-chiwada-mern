// server/controllers/b2bOrderController.js
//
// Business-facing B2B order endpoints (Phase 3): quote, place, list,
// detail, cancel. Every query is scoped to req.business._id (the
// requester's own account) — there is no route that takes an arbitrary
// business id, so IDOR is structurally impossible here, not just
// checked for. Server re-prices everything via utils/b2bPricing.js;
// client-sent prices/totals are never trusted.

const B2BOrder = require('../models/B2BOrder');
const PriceTier = require('../models/PriceTier');
const { priceB2BOrder } = require('../utils/b2bPricing');
const { shouldHold } = require('../utils/b2bCredit');
const { nextB2BOrderNumber } = require('../utils/b2bNumbering');
const { getTaxMode } = require('../utils/taxMode');
const { sendB2BOrderPlaced, sendB2BOrderStatusUpdate } = require('../services/emailService');

// Picks the shipping address for an order: by id if given and found,
// else the account's default, else its first, else billing address as
// a last resort (an approved account should always have at least one
// real address by the time it orders, but this never throws either way).
function resolveShippingAddress(account, shippingAddressId) {
  const addresses = account.shippingAddresses || [];
  if (shippingAddressId) {
    const found = addresses.find((a) => String(a._id) === String(shippingAddressId));
    if (found) return found;
  }
  return addresses.find((a) => a.isDefault) || addresses[0] || account.billingAddress;
}

// ──────────────────────────────────────────────────────
// POST /api/b2b/orders/quote  (approved only)
// ──────────────────────────────────────────────────────
exports.quoteOrder = async (req, res, next) => {
  try {
    const account = req.business;
    const tier = account.tier ? await PriceTier.findById(account.tier) : null;
    const shippingAddress = resolveShippingAddress(account, req.body.shippingAddressId);

    const result = await priceB2BOrder({
      items: req.body.items,
      account: { _id: account._id, tier },
      shippingAddress,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.errors });
    }

    const wouldHold = await shouldHold(account, result.payable);

    res.json({ success: true, quote: { ...result, wouldHold, shippingAddress } });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/orders  (approved only)
// ──────────────────────────────────────────────────────
exports.placeOrder = async (req, res, next) => {
  try {
    const account = req.business;
    const tier = account.tier ? await PriceTier.findById(account.tier) : null;
    const shippingAddress = resolveShippingAddress(account, req.body.shippingAddressId);

    const result = await priceB2BOrder({
      items: req.body.items,
      account: { _id: account._id, tier },
      shippingAddress,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.errors });
    }

    const creditHold = await shouldHold(account, result.payable);
    const orderNumber = await nextB2BOrderNumber(account.isTest);

    const order = await B2BOrder.create({
      orderNumber,
      business: account._id,
      placedBy: req.user._id,
      items: result.lines.map((l) => ({
        catalogItem: l.catalogItem, product: l.product, name: l.name, size: l.size,
        unitsPerCase: l.unitsPerCase, cases: l.cases, units: l.units, unitPrice: l.unitPrice, lineTotal: l.lineTotal,
      })),
      billing: {
        businessName: account.businessName,
        gstin: account.gstin,
        address: account.billingAddress,
      },
      shippingAddress,
      taxMode: getTaxMode(),
      totals: {
        subtotal: result.subtotal, taxTotal: result.taxTotal, grandTotal: result.grandTotal,
        roundOff: result.roundOff, payable: result.payable,
      },
      status: 'placed',
      statusHistory: [{ status: 'placed', by: req.user._id }],
      creditHold,
      paymentTermsSnapshot: account.paymentTerms,
      buyerNotes: req.body.buyerNotes,
    });

    try {
      await sendB2BOrderPlaced(order, account, req.user);
    } catch (emailErr) {
      console.error('B2B order-placed email failed to send:', emailErr.message);
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/b2b/orders?status&page&limit  (loadBusiness — any status)
// ──────────────────────────────────────────────────────
exports.getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { business: req.business._id };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      B2BOrder.find(filter).sort('-createdAt').skip((page - 1) * Number(limit)).limit(Number(limit)),
      B2BOrder.countDocuments(filter),
    ]);

    res.json({ success: true, orders, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/b2b/orders/:id  (loadBusiness — own order only)
// ──────────────────────────────────────────────────────
exports.getMyOrder = async (req, res, next) => {
  try {
    const order = await B2BOrder.findOne({ _id: req.params.id, business: req.business._id })
      .populate('invoice', 'invoiceNumber status');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/orders/:id/cancel  (loadBusiness — only while placed)
// ──────────────────────────────────────────────────────
exports.cancelMyOrder = async (req, res, next) => {
  try {
    const order = await B2BOrder.findOne({ _id: req.params.id, business: req.business._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'placed') {
      return res.status(400).json({
        success: false,
        message: 'Only orders that are still "placed" can be cancelled. Contact us for an order already being processed.',
      });
    }

    order.status = 'cancelled';
    order.cancelReason = req.body.reason;
    order.statusHistory.push({ status: 'cancelled', by: req.user._id, note: req.body.reason });
    await order.save();

    try {
      await sendB2BOrderStatusUpdate(order, req.business);
    } catch (emailErr) {
      console.error('B2B order-cancelled email failed to send:', emailErr.message);
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
