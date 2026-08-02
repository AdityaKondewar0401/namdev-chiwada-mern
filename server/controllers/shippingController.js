// server/controllers/shippingController.js
//
// HTTP layer for the Shadowfax integration: pincode serviceability check
// (used at checkout), the Push Callback webhook (order status updates),
// and a few admin-only actions (manual tracking resync, cancellation,
// escalation, POD lookup) that reuse the same service module.

const Order = require('../models/Order');
const Consignment = require('../models/Consignment');
const Partner = require('../models/Partner');
const shadowfaxService = require('../services/shadowfaxService');
const { getShadowfaxConfig } = require('../config/shadowfax');
const { calcTotalWeightGrams } = require('../utils/weight');
const { createShadowfaxShipmentForConsignment } = require('../services/consignmentShipping');

/* =========================================
   POST/GET check pincode serviceability
   Public — used at checkout before an order is allowed to be placed,
   and can also be reused elsewhere (e.g. a PDP "check delivery" widget)
   without requiring login.
========================================= */
exports.checkPincode = async (req, res, next) => {
  try {
    const pincode = req.query.pincode || req.body?.pincode;

    if (!pincode || !/^\d{6}$/.test(String(pincode))) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit pincode is required',
      });
    }

    const { serviceable, services } = await shadowfaxService.checkPincodeServiceability(pincode);

    res.json({
      success: true,
      pincode,
      serviceable,
      services,
    });
  } catch (err) {
    console.error('Pincode serviceability check failed:', err.message);
    // Fail "open" here — a Shadowfax outage shouldn't make checkout look
    // broken to every customer. serviceable:null tells the frontend to
    // skip blocking on the check but not claim a false positive either.
    res.json({
      success: false,
      serviceable: null,
      message: 'Could not verify delivery availability right now.',
    });
  }
};

/* =========================================
   POST Shadowfax Push Callback webhook
   Public endpoint (Shadowfax calls this directly, no user session), but
   verified against SHADOWFAX_WEBHOOK_TOKEN if one is configured — see
   the Authorization header note in the API doc's "Push Callback API"
   section. `order_id` in the payload is the client_order_id we sent when
   creating the shipment — for a customer Order that's the Mongo
   Order._id, for a partner Consignment it's the Mongo Consignment._id
   (see shadowfaxService.createWarehouseOrder / consignmentShipping.js),
   so this looks up BOTH collections since the same webhook URL covers
   both shipment types.
========================================= */
exports.handlePushCallback = async (req, res) => {
  try {
    const cfg = getShadowfaxConfig();

    if (cfg.webhookToken) {
      const authHeader = req.headers.authorization || '';
      const provided = authHeader.replace(/^Token\s+/i, '').trim();
      if (provided !== cfg.webhookToken) {
        return res.status(401).json({ success: false, message: 'Invalid webhook token' });
      }
    }

    const {
      awb_number,
      order_id,
      event_timestamp,
      current_location,
      comments,
      status,
      event,
    } = req.body || {};

    if (!awb_number && !order_id) {
      return res.status(400).json({ success: false, message: 'Missing awb_number/order_id' });
    }

    // order_id is client_order_id from creation time — try the customer
    // Order collection first (the far more common case), then fall back
    // to Consignment, then to an AWB lookup across both if the id lookup
    // ever misses (e.g. a client_order_id that changed on Shadowfax's side).
    let order = null;
    let consignment = null;

    if (order_id) {
      order = await Order.findById(order_id).catch(() => null);
      if (!order) {
        consignment = await Consignment.findById(order_id).catch(() => null);
      }
    }
    if (!order && !consignment && awb_number) {
      order = await Order.findOne({ 'courier.awbNumber': awb_number });
      if (!order) {
        consignment = await Consignment.findOne({ 'courier.awbNumber': awb_number });
      }
    }

    const target = order || consignment;
    if (!target) {
      // Still 200 — Shadowfax doesn't need to retry for a shipment we
      // simply don't recognize (e.g. stale test data).
      console.warn(`Shadowfax webhook: no matching order/consignment for order_id=${order_id} awb=${awb_number}`);
      return res.status(200).json({ success: true, ignored: true });
    }

    target.courier.awbNumber = target.courier.awbNumber || awb_number;
    target.courier.status = event;
    target.courier.statusDisplay = status;
    target.courier.lastSyncedAt = new Date();
    target.courier.history.push({
      statusId: event,
      status,
      location: current_location,
      remarks: comments,
      eventTimestamp: event_timestamp ? new Date(event_timestamp) : new Date(),
    });

    // Only forward-progress the ORDER's own status — never let a stray
    // out-of-order webhook regress an order that's already delivered or
    // cancelled back to something earlier.
    //
    // Consignment.status means something entirely different (payment
    // settlement: dispatched / partially_settled / settled) — it must
    // NEVER be overwritten with a shipping status here. For a Consignment
    // this webhook only ever updates the courier.* fields above.
    if (order) {
      const mapped = shadowfaxService.mapShadowfaxStatusToOrderStatus(event);
      const terminal = ['delivered', 'cancelled'];
      if (mapped && !terminal.includes(order.status)) {
        order.status = mapped;
      }
    }

    await target.save();

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Shadowfax webhook handling failed:', err.message);
    // Still respond 200 so Shadowfax doesn't hammer retries for a bug on
    // our side that a retry won't fix; the error is logged for follow-up.
    res.status(200).json({ success: false, message: 'Webhook processing error (logged)' });
  }
};

/* =========================================
   ADMIN: manually re-sync tracking for one order from Shadowfax
   (useful if a webhook was ever missed)
========================================= */
exports.resyncTracking = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!order.courier?.awbNumber) {
      return res.status(400).json({ success: false, message: 'This order has no Shadowfax shipment yet' });
    }

    const { order: sfxOrder, history, trackingUrl } = await shadowfaxService.trackOrder(order.courier.awbNumber);

    order.courier.status = sfxOrder?.status;
    order.courier.statusDisplay = sfxOrder?.status_display;
    order.courier.trackingUrl = trackingUrl || order.courier.trackingUrl;
    order.courier.lastSyncedAt = new Date();
    order.courier.history = (history || []).map((h) => ({
      statusId: h.status_id,
      status: h.status,
      location: h.location,
      remarks: h.remarks,
      eventTimestamp: h.created ? new Date(h.created) : undefined,
    }));

    const mapped = shadowfaxService.mapShadowfaxStatusToOrderStatus(sfxOrder?.status);
    const terminal = ['delivered', 'cancelled'];
    if (mapped && !terminal.includes(order.status)) {
      order.status = mapped;
    }

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   ADMIN: manually create the Shadowfax shipment for an order that
   doesn't have one yet (e.g. it failed at placeOrder time — see
   order.courier.error).
========================================= */
exports.createShipment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.courier?.awbNumber) {
      return res.status(400).json({ success: false, message: 'This order already has an AWB' });
    }

    const cfg = getShadowfaxConfig();
    const totalWeightGrams = calcTotalWeightGrams(order.items, cfg.defaultItemWeightGrams);
    if (totalWeightGrams > cfg.maxOrderWeightGrams) {
      return res.status(400).json({
        success: false,
        message: `Order weighs ${(totalWeightGrams / 1000).toFixed(2)}kg, over the ${(cfg.maxOrderWeightGrams / 1000).toFixed(1)}kg single-shipment limit.`,
      });
    }

    const result = await shadowfaxService.createWarehouseOrder(order);
    order.courier.awbNumber = result.awbNumber;
    order.courier.shadowfaxOrderId = result.shadowfaxOrderId;
    order.courier.status = result.status;
    order.courier.statusDisplay = result.statusDisplay;
    order.courier.actualWeightGrams = totalWeightGrams;
    order.courier.error = undefined;
    order.courier.lastSyncedAt = new Date();

    // Same as orderController.createShadowfaxShipmentForOrder — the
    // customer tracking URL only comes from the tracking endpoint, not
    // the creation response, so fetch it now rather than waiting for a
    // separate manual resync.
    try {
      const { trackingUrl } = await shadowfaxService.trackOrder(result.awbNumber);
      if (trackingUrl) order.courier.trackingUrl = trackingUrl;
    } catch (trackErr) {
      console.warn(`Could not fetch tracking URL for order ${order._id} (AWB ${result.awbNumber}):`, trackErr.message);
    }

    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   ADMIN: cancel the Shadowfax shipment for an order directly (without
   necessarily changing the order's own status — e.g. re-routing to a
   different courier later).
========================================= */
exports.cancelShipment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!order.courier?.awbNumber) {
      return res.status(400).json({ success: false, message: 'This order has no Shadowfax shipment' });
    }

    const { remarks } = req.body || {};
    const result = await shadowfaxService.cancelOrder(
      order.courier.awbNumber,
      remarks || 'Cancelled by admin'
    );

    order.courier.status = 'cancelled_by_customer';
    order.courier.statusDisplay = result.responseMsg || 'Cancelled';
    order.courier.cancelReason = remarks || 'Cancelled by admin';
    order.courier.lastSyncedAt = new Date();
    await order.save();

    res.json({ success: true, order, shadowfax: result });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   ADMIN: raise an escalation with Shadowfax for an order
========================================= */
exports.escalateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order?.courier?.awbNumber) {
      return res.status(400).json({ success: false, message: 'This order has no Shadowfax shipment' });
    }

    const { issueCategory } = req.body || {};
    const result = await shadowfaxService.raiseEscalation(order.courier.awbNumber, issueCategory);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   ADMIN: get Proof of Delivery details for an order
========================================= */
exports.getProofOfDelivery = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order?.courier?.awbNumber) {
      return res.status(400).json({ success: false, message: 'This order has no Shadowfax shipment' });
    }

    const podDetails = await shadowfaxService.getPodDetails([order.courier.awbNumber]);
    res.json({ success: true, pod: podDetails[order.courier.awbNumber] || null });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   CONSIGNMENTS (partner bulk dispatches) — same three admin actions as
   the customer-Order ones above, reusing the same shadowfaxService calls
   via consignmentShipping.js's adapter. See that file's header comment
   for why there's no weight cap here and why payment_mode is always
   forced to Prepaid.
========================================= */

/* ADMIN: manually re-sync tracking for one consignment from Shadowfax */
exports.resyncConsignmentTracking = async (req, res, next) => {
  try {
    const consignment = await Consignment.findById(req.params.id);
    if (!consignment) {
      return res.status(404).json({ success: false, message: 'Consignment not found' });
    }
    if (!consignment.courier?.awbNumber) {
      return res.status(400).json({ success: false, message: 'This consignment has no Shadowfax shipment yet' });
    }

    const { order: sfxOrder, history, trackingUrl } = await shadowfaxService.trackOrder(consignment.courier.awbNumber);

    consignment.courier.status = sfxOrder?.status;
    consignment.courier.statusDisplay = sfxOrder?.status_display;
    consignment.courier.trackingUrl = trackingUrl || consignment.courier.trackingUrl;
    consignment.courier.lastSyncedAt = new Date();
    consignment.courier.history = (history || []).map((h) => ({
      statusId: h.status_id,
      status: h.status,
      location: h.location,
      remarks: h.remarks,
      eventTimestamp: h.created ? new Date(h.created) : undefined,
    }));
    // Deliberately NOT touching consignment.status here — see the
    // courierSchema comment in models/Consignment.js.

    await consignment.save();
    res.json({ success: true, consignment });
  } catch (err) {
    next(err);
  }
};

/* ADMIN: manually create the Shadowfax shipment for a consignment that
   doesn't have one yet (e.g. it failed at dispatch time — see
   consignment.courier.error). */
exports.createConsignmentShipment = async (req, res, next) => {
  try {
    const consignment = await Consignment.findById(req.params.id);
    if (!consignment) {
      return res.status(404).json({ success: false, message: 'Consignment not found' });
    }
    if (consignment.courier?.awbNumber) {
      return res.status(400).json({ success: false, message: 'This consignment already has an AWB' });
    }

    const partner = await Partner.findById(consignment.partner);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found for this consignment' });
    }

    await createShadowfaxShipmentForConsignment(consignment, partner);

    if (!consignment.courier?.awbNumber) {
      // createShadowfaxShipmentForConsignment never throws — it records
      // failures on consignment.courier.error instead. Surface that here
      // as a proper error response so the admin sees why it didn't work.
      return res.status(400).json({
        success: false,
        message: consignment.courier?.error || 'Shipment creation failed',
        consignment,
      });
    }

    res.json({ success: true, consignment });
  } catch (err) {
    next(err);
  }
};

/* ADMIN: cancel the Shadowfax shipment for a consignment */
exports.cancelConsignmentShipment = async (req, res, next) => {
  try {
    const consignment = await Consignment.findById(req.params.id);
    if (!consignment) {
      return res.status(404).json({ success: false, message: 'Consignment not found' });
    }
    if (!consignment.courier?.awbNumber) {
      return res.status(400).json({ success: false, message: 'This consignment has no Shadowfax shipment' });
    }

    const { remarks } = req.body || {};
    const result = await shadowfaxService.cancelOrder(
      consignment.courier.awbNumber,
      remarks || 'Cancelled by admin'
    );

    consignment.courier.status = 'cancelled_by_customer';
    consignment.courier.statusDisplay = result.responseMsg || 'Cancelled';
    consignment.courier.cancelReason = remarks || 'Cancelled by admin';
    consignment.courier.lastSyncedAt = new Date();
    // Again, deliberately not touching consignment.status (payment
    // settlement) — cancelling the shipment says nothing about whether
    // the partner still owes money for it.
    await consignment.save();

    res.json({ success: true, consignment, shadowfax: result });
  } catch (err) {
    next(err);
  }
};
