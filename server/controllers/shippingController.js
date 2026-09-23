// server/controllers/shippingController.js
//
// HTTP layer for the Shadowfax integration: pincode serviceability check
// (used at checkout), the Push Callback webhook (order status updates),
// and a few admin-only actions (manual tracking resync, cancellation,
// escalation, POD lookup) that reuse the same service module.

const crypto = require('crypto');
const Order = require('../models/Order');
const B2BOrder = require('../models/B2BOrder');
const shadowfaxService = require('../services/shadowfaxService');
const { getShadowfaxConfig } = require('../config/shadowfax');
const { calcTotalWeightGrams } = require('../utils/weight');

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
   Public endpoint (Shadowfax calls this directly, no user session),
   verified against SHADOWFAX_WEBHOOK_TOKEN — see the Authorization header
   note in the API doc's "Push Callback API" section. `order_id` in the
   payload is the client_order_id we sent when creating the shipment,
   which is either a retail Order._id or a B2BOrder._id (B2B shipments
   are created by b2bShippingController.createB2BShipment, but land on
   this SAME webhook URL — Shadowfax's client portal only has one
   configurable Push Callback URL per account, so rather than needing a
   second one, this handler tries Order first, then falls back to
   B2BOrder). The two order types' STATUS EFFECTS differ (see below),
   but courier tracking state/history is written identically either way.

   SECURITY: fails CLOSED if no token is configured. Without this,
   anyone could POST fake status updates for any order (e.g. force-mark
   a random order "delivered"). Set SHADOWFAX_WEBHOOK_TOKEN in .env AND
   in the same value in the Shadowfax Client Portal's webhook tab before
   relying on this in production.
========================================= */
exports.handlePushCallback = async (req, res) => {
  try {
    const cfg = getShadowfaxConfig();

    if (!cfg.webhookToken) {
      console.error('Shadowfax webhook rejected: SHADOWFAX_WEBHOOK_TOKEN is not configured');
      return res.status(401).json({ success: false, message: 'Webhook not configured' });
    }

    const authHeader = req.headers.authorization || '';
    const provided = Buffer.from(authHeader.replace(/^Token\s+/i, '').trim());
    const expected = Buffer.from(cfg.webhookToken);
    // Constant-time comparison — a plain `!==` leaks a timing signal an
    // attacker could use to guess the webhook token byte-by-byte and then
    // push fake courier-status updates for any order.
    const tokenValid = provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
    if (!tokenValid) {
      return res.status(401).json({ success: false, message: 'Invalid webhook token' });
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

    // order_id is client_order_id from creation time — try the retail
    // Order collection by id first, then by AWB, then the same two
    // lookups against B2BOrder before giving up.
    let order = null;
    let isB2B = false;

    if (order_id) {
      order = await Order.findById(order_id).catch(() => null);
    }
    if (!order && awb_number) {
      order = await Order.findOne({ 'courier.awbNumber': awb_number });
    }
    if (!order && order_id) {
      order = await B2BOrder.findById(order_id).catch(() => null);
      if (order) isB2B = true;
    }
    if (!order && awb_number) {
      order = await B2BOrder.findOne({ 'courier.awbNumber': awb_number });
      if (order) isB2B = true;
    }

    if (!order) {
      // Still 200 — Shadowfax doesn't need to retry for a shipment we
      // simply don't recognize (e.g. stale test data).
      console.warn(`Shadowfax webhook: no matching order for order_id=${order_id} awb=${awb_number}`);
      return res.status(200).json({ success: true, ignored: true });
    }

    order.courier.awbNumber = order.courier.awbNumber || awb_number;
    order.courier.status = event;
    order.courier.statusDisplay = status;
    order.courier.lastSyncedAt = new Date();

    // Shadowfax retries push callbacks, so the same event can arrive more
    // than once — dedup on (statusId, eventTimestamp) so a retry doesn't
    // duplicate the history entry indefinitely.
    const eventTimestamp = event_timestamp ? new Date(event_timestamp) : new Date();
    const alreadyRecorded = order.courier.history.some(
      (h) => h.statusId === event && h.eventTimestamp?.getTime() === eventTimestamp.getTime()
    );
    if (!alreadyRecorded) {
      order.courier.history.push({
        statusId: event,
        status,
        location: current_location,
        remarks: comments,
        eventTimestamp,
      });
    }

    if (isB2B) {
      // B2B's own status enum/workflow (utils/b2bOrderStatus.js) doesn't
      // map onto retail's placed/confirmed/processing/shipped states,
      // and B2B is admin-driven rather than auto-progressing through
      // dispatch — only a real "delivered" auto-advances it, and only
      // from its one legitimate predecessor (dispatched). Every other
      // event still updates courier.status/history above, just doesn't
      // move B2BOrder.status.
      if (event === 'delivered' && order.status === 'dispatched') {
        order.status = 'delivered';
        order.statusHistory.push({ status: 'delivered', note: 'Auto-updated from Shadowfax tracking' });
      }
    } else {
      // Only forward-progress the ORDER's own status — never let a stray
      // out-of-order webhook regress an order that's already delivered
      // or cancelled back to something earlier.
      const mapped = shadowfaxService.mapShadowfaxStatusToOrderStatus(event);
      const terminal = ['delivered', 'cancelled'];
      if (mapped && !terminal.includes(order.status)) {
        order.status = mapped;
      }
    }

    await order.save();

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

    // BUG FIX: a Shadowfax failure here used to fall through to the outer
    // catch's `next(err)` — errorHandler.js only surfaces a raw error's
    // real message via `err.expose`, which ShadowfaxApiError never sets,
    // so every failure (missing SHADOWFAX_AUTH_TOKEN, a rejected AWB,
    // a network error, ...) showed the admin the same generic "Something
    // went wrong. Please try again." in production, with zero indication
    // of what actually happened or how to fix it. Same admin-only-so-
    // safe-to-expose reasoning as createShipment's existing catch below.
    let sfxOrder, history, trackingUrl;
    try {
      ({ order: sfxOrder, history, trackingUrl } = await shadowfaxService.trackOrder(order.courier.awbNumber));
    } catch (sfxErr) {
      order.courier.error = `Tracking sync failed: ${sfxErr.message}`;
      order.courier.lastSyncedAt = new Date();
      await order.save().catch(() => {});
      await order.populate('user', 'name email');
      return res.status(502).json({ success: false, message: order.courier.error, order });
    }

    order.courier.status = sfxOrder?.status;
    order.courier.statusDisplay = sfxOrder?.status_display;
    order.courier.trackingUrl = trackingUrl || order.courier.trackingUrl;
    order.courier.error = undefined;
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
    // Same reason as orderController.updateOrderStatus: without this, the
    // admin Orders list replaces its in-memory order with this response and
    // the customer's name/email collapse to "Guest" until a full reload.
    await order.populate('user', 'name email');
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
    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot create a shipment for a cancelled order' });
    }

    const cfg = getShadowfaxConfig();
    const totalWeightGrams = calcTotalWeightGrams(order.items, cfg.defaultItemWeightGrams);
    if (totalWeightGrams > cfg.maxOrderWeightGrams) {
      return res.status(400).json({
        success: false,
        message: `Order weighs ${(totalWeightGrams / 1000).toFixed(2)}kg, over the ${(cfg.maxOrderWeightGrams / 1000).toFixed(1)}kg single-shipment limit.`,
      });
    }

    let result;
    try {
      result = await shadowfaxService.createWarehouseOrder(order);
    } catch (sfxErr) {
      // Persist the failure so it survives a refresh — otherwise a failed
      // attempt looks identical to "never tried" (no awbNumber, no error)
      // once the toast disappears. Admin-only endpoint, so the real
      // Shadowfax error text is safe to surface directly.
      order.courier.error = `Shipment creation failed: ${sfxErr.message}`;
      order.courier.lastSyncedAt = new Date();
      await order.save().catch(() => {});
      return res.status(502).json({ success: false, message: order.courier.error, order });
    }

    order.courier.awbNumber = result.awbNumber;
    order.courier.shadowfaxOrderId = result.shadowfaxOrderId;
    order.courier.status = result.status;
    order.courier.statusDisplay = result.statusDisplay;
    order.courier.actualWeightGrams = totalWeightGrams;
    order.courier.error = undefined;
    order.courier.lastSyncedAt = new Date();

    // The customer tracking URL only comes from the tracking endpoint,
    // not the creation response, so fetch it now rather than waiting for
    // a separate manual resync — this way it's visible to the customer
    // and admin immediately after this action.
    try {
      const { trackingUrl } = await shadowfaxService.trackOrder(result.awbNumber);
      if (trackingUrl) order.courier.trackingUrl = trackingUrl;
    } catch (trackErr) {
      console.warn(`Could not fetch tracking URL for order ${order._id} (AWB ${result.awbNumber}):`, trackErr.message);
    }

    await order.save();
    await order.populate('user', 'name email');

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

    // Same bug fix as resyncTracking above — surface the real Shadowfax
    // failure reason instead of letting it fall through to the generic
    // errorHandler.js message.
    let result;
    try {
      result = await shadowfaxService.cancelOrder(
        order.courier.awbNumber,
        remarks || 'Cancelled by admin'
      );
    } catch (sfxErr) {
      order.courier.error = `Shipment cancellation failed: ${sfxErr.message}`;
      order.courier.lastSyncedAt = new Date();
      await order.save().catch(() => {});
      await order.populate('user', 'name email');
      return res.status(502).json({ success: false, message: order.courier.error, order });
    }

    order.courier.status = 'cancelled_by_customer';
    order.courier.statusDisplay = result.responseMsg || 'Cancelled';
    order.courier.cancelReason = remarks || 'Cancelled by admin';
    order.courier.error = undefined;
    order.courier.lastSyncedAt = new Date();
    await order.save();
    await order.populate('user', 'name email');

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
    try {
      const result = await shadowfaxService.raiseEscalation(order.courier.awbNumber, issueCategory);
      res.json({ success: true, result });
    } catch (sfxErr) {
      // Same bug fix as resyncTracking/cancelShipment — nothing to persist
      // here (this doesn't change the order's own courier state), but the
      // real Shadowfax message still needs to reach the admin instead of
      // errorHandler.js's generic fallback.
      res.status(502).json({ success: false, message: sfxErr.message });
    }
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

    try {
      const podDetails = await shadowfaxService.getPodDetails([order.courier.awbNumber]);
      res.json({ success: true, pod: podDetails[order.courier.awbNumber] || null });
    } catch (sfxErr) {
      res.status(502).json({ success: false, message: sfxErr.message });
    }
  } catch (err) {
    next(err);
  }
};


