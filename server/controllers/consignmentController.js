const Consignment = require('../models/Consignment');
const Payment = require('../models/Payment');
const Partner = require('../models/Partner');

// ──────────────────────────────────────────────────────
// POST /api/consignments
// Creates a consignment AND the two Payment records (advance/final) that
// come with it, in one call — the split % is snapshotted from the
// partner's current defaultAdvancePercent unless explicitly overridden.
// ──────────────────────────────────────────────────────
exports.createConsignment = async (req, res, next) => {
  try {
    const { partnerId, items, notes, advancePercent } = req.body;

    if (!partnerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'partnerId and at least one item are required',
      });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner || !partner.active) {
      return res.status(404).json({ success: false, message: 'Partner not found or inactive' });
    }

    // Validate + normalize line items, compute the total server-side
    // (never trust a client-sent total).
    const normalizedItems = items.map((item) => {
      const qty = Number(item.qty);
      const unitPrice = Number(item.unitPrice);
      if (!item.name || !qty || qty < 1 || unitPrice < 0 || Number.isNaN(unitPrice)) {
        throw Object.assign(new Error('Each item needs a name, qty >= 1, and a valid unitPrice'), {
          statusCode: 400,
        });
      }
      return {
        product: item.product || undefined,
        name: item.name,
        size: item.size || undefined,
        qty,
        unitPrice,
      };
    });

    const totalAmount = normalizedItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    const splitPercent =
      advancePercent !== undefined ? Number(advancePercent) : partner.defaultAdvancePercent;

    if (splitPercent < 0 || splitPercent > 100) {
      return res.status(400).json({ success: false, message: 'advancePercent must be 0-100' });
    }

    const consignment = await Consignment.create({
      partner: partner._id,
      items: normalizedItems,
      totalAmount,
      advancePercent: splitPercent,
      notes,
    });

    const advanceAmount = Math.round((totalAmount * splitPercent) / 100);
    const finalAmount = totalAmount - advanceAmount;

    const payments = await Payment.insertMany([
      {
        consignment: consignment._id,
        partner: partner._id,
        installment: 'advance',
        amountDue: advanceAmount,
        dueDate: consignment.dispatchDate,
      },
      {
        consignment: consignment._id,
        partner: partner._id,
        installment: 'final',
        amountDue: finalAmount,
        // No fixed due date — it's due whenever the partner sells the stock.
        // The Phase 3 reminder job just watches status: 'pending' regardless.
        dueDate: null,
      },
    ]);

    res.status(201).json({ success: true, consignment, payments });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/consignments
// Lists all consignments with partner info and their payments attached.
// ──────────────────────────────────────────────────────
exports.getConsignments = async (req, res, next) => {
  try {
    const consignments = await Consignment.find()
      .populate('partner', 'businessName type phone')
      .sort({ dispatchDate: -1 });

    const consignmentIds = consignments.map((c) => c._id);
    const payments = await Payment.find({ consignment: { $in: consignmentIds } });

    const paymentsByConsignment = payments.reduce((acc, p) => {
      const key = p.consignment.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    const result = consignments.map((c) => ({
      ...c.toObject(),
      payments: paymentsByConsignment[c._id.toString()] || [],
    }));

    res.json({ success: true, consignments: result });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/consignments/dues
// Outstanding-balance summary per partner — powers the Phase 4 dashboard,
// but useful in Phase 1 too as a quick "who owes what" check.
// Registered BEFORE /:id in routes so it isn't swallowed by the param route.
// ──────────────────────────────────────────────────────
exports.getDuesSummary = async (req, res, next) => {
  try {
    const pending = await Payment.find({ status: 'pending' }).populate(
      'partner',
      'businessName type phone'
    );

    const byPartner = pending.reduce((acc, p) => {
      if (!p.partner) return acc;
      const key = p.partner._id.toString();
      if (!acc[key]) {
        acc[key] = { partner: p.partner, totalOutstanding: 0, pendingPayments: 0 };
      }
      acc[key].totalOutstanding += p.amountDue;
      acc[key].pendingPayments += 1;
      return acc;
    }, {});

    res.json({ success: true, dues: Object.values(byPartner) });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/consignments/:id
// ──────────────────────────────────────────────────────
exports.getConsignment = async (req, res, next) => {
  try {
    const consignment = await Consignment.findById(req.params.id).populate('partner');
    if (!consignment) {
      return res.status(404).json({ success: false, message: 'Consignment not found' });
    }
    const payments = await Payment.find({ consignment: consignment._id });
    res.json({ success: true, consignment, payments });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/consignments/reminders/run
// Manually triggers the same reminder check the daily cron job runs —
// lets the admin test Phase 3 immediately instead of waiting for 9 AM.
// ──────────────────────────────────────────────────────
exports.runRemindersNow = async (req, res, next) => {
  try {
    const { checkAndSendReminders } = require('../jobs/reminderJob');
    const result = await checkAndSendReminders();
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// PUT /api/consignments/payments/:paymentId/mark-paid
// Manually mark one installment as paid. Once both are paid, the parent
// Consignment status flips to 'settled'.
// ──────────────────────────────────────────────────────
exports.markPaymentPaid = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Payment already marked paid' });
    }

    payment.status = 'paid';
    payment.paidDate = new Date();
    await payment.save();

    const siblings = await Payment.find({ consignment: payment.consignment });
    const allPaid = siblings.every((p) => p.status === 'paid');
    const anyPaid = siblings.some((p) => p.status === 'paid');

    await Consignment.findByIdAndUpdate(payment.consignment, {
      status: allPaid ? 'settled' : anyPaid ? 'partially_settled' : 'dispatched',
    });

    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};
