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
const { round2 } = require('../utils/money');
const { createB2BOrderForUser } = require('../utils/b2bOrderCreation');
const { sendB2BOrderStatusUpdate } = require('../services/emailService');

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

    const advanceAmount = round2(result.payable * account.advancePercent / 100);
    const remainingAmount = round2(result.payable - advanceAmount);
    const wouldHold = await shouldHold(account, remainingAmount);

    res.json({
      success: true,
      quote: { ...result, wouldHold, shippingAddress, advancePercent: account.advancePercent, advanceAmount, remainingAmount },
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/orders  (approved only)
//
// Thin wrapper around utils/b2bOrderCreation.js, which does the actual
// re-pricing, advance-payment verification, and transactional write -
// see that file for the security invariants (same shape as
// orderController.placeOrder -> utils/orderCreation.js for retail).
// ──────────────────────────────────────────────────────
exports.placeOrder = async (req, res, next) => {
  try {
    const result = await createB2BOrderForUser({
      businessId: req.business._id,
      userId: req.user._id,
      items: req.body.items,
      shippingAddressId: req.body.shippingAddressId,
      razorpayOrderId: req.body.razorpayOrderId,
      buyerNotes: req.body.buyerNotes,
    });

    if (!result.success) {
      return res.status(result.statusCode).json(
        result.errors ? { success: false, errors: result.errors } : { success: false, message: result.message }
      );
    }

    res.status(201).json({ success: true, order: result.order });
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
