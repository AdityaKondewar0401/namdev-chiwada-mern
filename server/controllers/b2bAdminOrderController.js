// server/controllers/b2bAdminOrderController.js
//
// Admin B2B order management: list, detail, quantity edit while placed,
// status transitions via the state machine, credit-hold override,
// manual + auto invoice issuance (Phase 4).

const mongoose = require('mongoose');
const B2BOrder = require('../models/B2BOrder');
const Invoice = require('../models/Invoice');
const PriceTier = require('../models/PriceTier');
const { priceB2BOrder } = require('../utils/b2bPricing');
const { shouldHold } = require('../utils/b2bCredit');
const { round2 } = require('../utils/money');
const {
  isTransitionAllowed, getAllowedNextStatuses, REASON_REQUIRED_FOR, CANCEL_REQUIRES_CREDIT_NOTE_IF_INVOICED,
} = require('../utils/b2bOrderStatus');
const { issueInvoiceForOrder } = require('../utils/b2bInvoicing');
const { applyCreditNoteToInvoice } = require('../utils/b2bCreditNote');
const { sendB2BOrderEdited, sendB2BOrderStatusUpdate, sendB2BInvoiceIssued } = require('../services/emailService');

// ──────────────────────────────────────────────────────
// GET /api/b2b/admin/orders?status&business&from&to&page
// ──────────────────────────────────────────────────────
exports.listOrders = async (req, res, next) => {
  try {
    const { status, business, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (business) filter.business = business;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [orders, total] = await Promise.all([
      B2BOrder.find(filter)
        .populate('business', 'businessName isTest')
        .sort('-createdAt')
        .skip((page - 1) * Number(limit))
        .limit(Number(limit)),
      B2BOrder.countDocuments(filter),
    ]);

    res.json({ success: true, orders, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/b2b/admin/orders/:id
// ──────────────────────────────────────────────────────
exports.getOrderDetail = async (req, res, next) => {
  try {
    const order = await B2BOrder.findById(req.params.id)
      .populate('business', 'businessName isTest phone email user')
      .populate('placedBy', 'name email')
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
// PUT /api/b2b/admin/orders/:id/items  (only while placed, reason required)
// ──────────────────────────────────────────────────────
exports.updateOrderItems = async (req, res, next) => {
  try {
    const order = await B2BOrder.findById(req.params.id).populate('business');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'placed') {
      return res.status(400).json({ success: false, message: 'Quantities can only be edited while the order is "placed".' });
    }

    const { items, reason } = req.body;
    const account = order.business;
    const before = order.toObject();

    const tier = account.tier ? await PriceTier.findById(account.tier) : null;
    const result = await priceB2BOrder({
      items,
      account: { _id: account._id, tier },
      shippingAddress: order.shippingAddress,
    });
    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.errors });
    }

    order.items = result.lines.map((l) => ({
      catalogItem: l.catalogItem, product: l.product, name: l.name, size: l.size,
      unitsPerCase: l.unitsPerCase, cases: l.cases, units: l.units, unitPrice: l.unitPrice, lineTotal: l.lineTotal,
    }));
    order.totals = {
      subtotal: result.subtotal, taxTotal: result.taxTotal, grandTotal: result.grandTotal,
      roundOff: result.roundOff, payable: result.payable,
    };
    // advanceAmount was already collected via Razorpay at placement and
    // never changes here - only what's still owed does. If the edit
    // drops payable below what's already been paid, nothing further is
    // due (the resulting credit is still fully visible in the Ledger's
    // own derived balance, not lost - just not shown as a negative
    // "remaining" here).
    order.remainingAmount = Math.max(0, round2(result.payable - order.advanceAmount));
    order.creditHold = await shouldHold(account, order.remainingAmount);
    order.editHistory.push({ by: req.user._id, reason, before, after: order.toObject() });

    await order.save();

    try {
      await sendB2BOrderEdited(order, account, before, order.toObject());
    } catch (emailErr) {
      console.error('B2B order-edited email failed to send:', emailErr.message);
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/admin/orders/:id/invoice  (manual issuance)
// Spec §6.9: "Invoice may be issued manually from confirmed onward;
// exactly one per order." Same underlying transaction dispatch uses to
// auto-issue.
// ──────────────────────────────────────────────────────
exports.issueInvoice = async (req, res, next) => {
  try {
    const order = await B2BOrder.findById(req.params.id).populate('business');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status === 'placed') {
      return res.status(400).json({ success: false, message: 'An invoice can only be issued once the order is confirmed.' });
    }

    const invoice = await issueInvoiceForOrder(order._id, req.user._id);

    try {
      await sendB2BInvoiceIssued(invoice, order.business);
    } catch (emailErr) {
      console.error('B2B invoice-issued email failed to send:', emailErr.message);
    }

    res.status(201).json({ success: true, invoice });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/admin/orders/:id/status
// Body: { status, note, reason, dispatch }
//
// dispatched: auto-issues an invoice if none exists yet.
//
// cancelled from confirmed/packed with an existing invoice: the order
// status change and the credit note (+ its ledger credit) commit in one
// transaction, per spec §6.9 — handled as its own branch below rather
// than falling through to the generic single-document save.
// ──────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await B2BOrder.findById(req.params.id).populate('business');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const { status, note, reason, dispatch } = req.body;

    if (!isTransitionAllowed(order.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move from "${order.status}" to "${status}". Allowed next: ${getAllowedNextStatuses(order.status).join(', ') || 'none (terminal status)'}.`,
      });
    }

    if (REASON_REQUIRED_FOR.includes(status) && !reason) {
      return res.status(400).json({ success: false, message: `A reason is required to set status to "${status}".` });
    }

    if (status === 'confirmed' && order.creditHold) {
      return res.status(400).json({
        success: false,
        message: 'This order is on credit hold. Override the hold before confirming.',
      });
    }

    // ── cancelled, from an already-invoiced confirmed/packed order:
    // combined transaction, separate response path ──
    if (status === 'cancelled' && CANCEL_REQUIRES_CREDIT_NOTE_IF_INVOICED.includes(order.status) && order.invoice) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const invoice = await Invoice.findById(order.invoice).session(session);
          if (invoice) await applyCreditNoteToInvoice(invoice, reason, req.user._id, session);

          order.status = status;
          order.cancelReason = reason;
          order.statusHistory.push({ status, by: req.user._id, note: note || reason });
          await order.save({ session });
        });
      } catch (txErr) {
        if (txErr.statusCode) return res.status(txErr.statusCode).json({ success: false, message: txErr.message });
        throw txErr;
      } finally {
        session.endSession();
      }

      try {
        await sendB2BOrderStatusUpdate(order, order.business);
      } catch (emailErr) {
        console.error('B2B order-status email failed to send:', emailErr.message);
      }
      return res.json({ success: true, order });
    }

    if (status === 'dispatched') {
      if (!dispatch || !dispatch.mode) {
        return res.status(400).json({ success: false, message: 'Dispatch details (at least a mode) are required.' });
      }

      if (!order.invoice) {
        const invoice = await issueInvoiceForOrder(order._id, req.user._id);
        order.invoice = invoice._id;

        try {
          await sendB2BInvoiceIssued(invoice, order.business);
        } catch (emailErr) {
          console.error('B2B invoice-issued email failed to send:', emailErr.message);
        }
      }

      order.dispatch = { ...order.dispatch, ...dispatch, dispatchedAt: new Date() };
    }

    if (status === 'cancelled') order.cancelReason = reason;
    if (status === 'rejected') order.rejectReason = reason;

    order.status = status;
    order.statusHistory.push({ status, by: req.user._id, note: note || reason });
    await order.save();

    try {
      await sendB2BOrderStatusUpdate(order, order.business);
    } catch (emailErr) {
      console.error('B2B order-status email failed to send:', emailErr.message);
    }

    res.json({ success: true, order });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/admin/orders/:id/override-credit-hold
// ──────────────────────────────────────────────────────
exports.overrideCreditHold = async (req, res, next) => {
  try {
    const order = await B2BOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!order.creditHold) {
      return res.status(400).json({ success: false, message: 'This order is not on credit hold.' });
    }

    order.creditHold = false;
    order.creditHoldOverride = { by: req.user._id, at: new Date(), note: req.body.note };
    order.statusHistory.push({ status: order.status, by: req.user._id, note: `Credit hold overridden${req.body.note ? `: ${req.body.note}` : ''}` });
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
