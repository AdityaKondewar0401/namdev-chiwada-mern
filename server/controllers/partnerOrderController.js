const PartnerOrderRequest = require('../models/PartnerOrderRequest');
const Consignment = require('../models/Consignment');
const Payment = require('../models/Payment');
const Partner = require('../models/Partner');
const { sendOrderApprovedEmail, sendOrderRejectedEmail } = require('../services/emailService');
const { sendWhatsApp } = require('../services/whatsappService');
const { createShadowfaxShipmentForConsignment } = require('../services/consignmentShipping');

// ──────────────────────────────────────────────────────
// GET /api/partner-orders
// Admin-only. Lists all partner order requests, newest first.
// ──────────────────────────────────────────────────────
exports.getOrderRequests = async (req, res, next) => {
  try {
    const orderRequests = await PartnerOrderRequest.find()
      .populate('partner', 'businessName type phone email defaultAdvancePercent')
      .sort({ createdAt: -1 });
    res.json({ success: true, orderRequests });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/partner-orders/:id/approve
// Admin-only. Turns a pending request into a real Consignment (+ its
// Payment records), using the same math as a manually-dispatched
// consignment. The admin can override quantities/prices from what the
// partner originally requested — those values, not the partner's
// estimates, become the binding total.
// Body: { items: [{ name, size, qty, unitPrice }], advancePercent }
// ──────────────────────────────────────────────────────
exports.approveOrderRequest = async (req, res, next) => {
  try {
    const orderRequest = await PartnerOrderRequest.findById(req.params.id);
    if (!orderRequest) {
      return res.status(404).json({ success: false, message: 'Order request not found' });
    }
    if (orderRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been reviewed' });
    }

    const partner = await Partner.findById(orderRequest.partner);
    if (!partner || !partner.active) {
      return res.status(404).json({ success: false, message: 'Partner not found or inactive' });
    }

    const { items, advancePercent } = req.body;
    const sourceItems = Array.isArray(items) && items.length > 0 ? items : orderRequest.items.map((i) => ({
      name: i.name,
      size: i.size,
      qty: i.qty,
      unitPrice: i.estimatedUnitPrice,
    }));

    // Preserve the original product reference by name so a future "reorder"
    // from this consignment can re-add the same catalog product — even
    // when the admin edited qty/price during review, or supplied items
    // fresh via the review form (which has no productId of its own).
    const productByName = {};
    orderRequest.items.forEach((i) => {
      if (i.product) productByName[i.name] = i.product;
    });

    const normalizedItems = sourceItems.map((item) => {
      const qty = Number(item.qty);
      const unitPrice = Number(item.unitPrice);
      if (!item.name || !qty || qty < 1 || unitPrice < 0 || Number.isNaN(unitPrice)) {
        throw Object.assign(new Error('Each item needs a name, qty >= 1, and a valid unitPrice'), {
          statusCode: 400,
        });
      }
      return {
        product: item.product || productByName[item.name] || undefined,
        name: item.name,
        size: item.size || undefined,
        qty,
        unitPrice,
      };
    });

    const totalAmount = normalizedItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    const splitPercent = advancePercent !== undefined ? Number(advancePercent) : partner.defaultAdvancePercent;

    if (splitPercent < 0 || splitPercent > 100) {
      return res.status(400).json({ success: false, message: 'advancePercent must be 0-100' });
    }

    const consignment = await Consignment.create({
      partner: partner._id,
      items: normalizedItems,
      totalAmount,
      advancePercent: splitPercent,
      notes: orderRequest.notes,
    });

    const advanceAmount = Math.round((totalAmount * splitPercent) / 100);
    const finalAmount = totalAmount - advanceAmount;

    await Payment.insertMany([
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
        dueDate: null,
      },
    ]);

    orderRequest.status = 'approved';
    orderRequest.consignment = consignment._id;
    await orderRequest.save();

    // Fire the Shadowfax shipment now that the consignment (and its
    // Payment records) exist — same hook as the manual-dispatch path in
    // consignmentController.createConsignment. Never blocks the approval;
    // failures land on consignment.courier.error for a manual retry.
    await createShadowfaxShipmentForConsignment(consignment, partner);

    // Best-effort — a notification failure must never fail the approval
    // itself, same philosophy as every other notification in this app.
    if (partner.email) {
      sendOrderApprovedEmail(partner.email, partner.businessName, consignment).catch(() => {});
    }
    if (partner.phone) {
      sendWhatsApp({
        to: partner.phone,
        body: `Hi ${partner.businessName}, your order has been approved and dispatched. Total: ₹${totalAmount.toLocaleString('en-IN')}. Check your dashboard for payment details.`,
      }).catch(() => {});
    }

    res.json({ success: true, orderRequest, consignment });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/partner-orders/:id/reject
// Admin-only. Body: { reason }
// ──────────────────────────────────────────────────────
exports.rejectOrderRequest = async (req, res, next) => {
  try {
    const orderRequest = await PartnerOrderRequest.findById(req.params.id);
    if (!orderRequest) {
      return res.status(404).json({ success: false, message: 'Order request not found' });
    }
    if (orderRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been reviewed' });
    }

    orderRequest.status = 'rejected';
    orderRequest.rejectionReason = req.body.reason || '';
    await orderRequest.save();

    const partner = await Partner.findById(orderRequest.partner);
    if (partner?.email) {
      sendOrderRejectedEmail(partner.email, partner.businessName, orderRequest, orderRequest.rejectionReason).catch(() => {});
    }
    if (partner?.phone) {
      sendWhatsApp({
        to: partner.phone,
        body: `Hi ${partner.businessName}, your recent order request could not be fulfilled this time.${orderRequest.rejectionReason ? ` Reason: ${orderRequest.rejectionReason}` : ''}`,
      }).catch(() => {});
    }

    res.json({ success: true, orderRequest });
  } catch (err) {
    next(err);
  }
};
