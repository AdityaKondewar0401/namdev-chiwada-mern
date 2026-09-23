// server/controllers/b2bShippingController.js
//
// Admin-only B2B shipment actions — mirrors controllers/shippingController.js's
// createShipment/cancelShipment exactly (same guard order, same
// persist-the-real-error-on-failure pattern), reusing
// services/shadowfaxService.js completely unmodified aside from the
// additive `locationType` option. B2BOrder's field names differ from
// retail Order's, so toShadowfaxOrderShape() below builds a throwaway
// plain-object view in the shape the service already expects, rather
// than duplicating any of its logic.
//
// Shipment creation is always admin-triggered (the "Create Shipment"
// button, shown once an order is dispatched) — never automatic on order
// placement, same as retail.

const B2BOrder = require('../models/B2BOrder');
const shadowfaxService = require('../services/shadowfaxService');

function toShadowfaxOrderShape(order) {
  const addr = order.shippingAddress || {};
  return {
    _id: order._id,
    shippingAddress: {
      name: addr.contactName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    },
    items: (order.items || []).map((item) => ({
      name: item.name,
      price: item.unitPrice,
      qty: item.units,
      size: item.size,
    })),
    subtotal: order.totals.subtotal,
    total: order.totals.payable,
    // B2B never uses Shadowfax's own COD cash-collection - the
    // remainder is invoiced/collected by us directly, not by the
    // courier. Anything other than the literal string 'COD' makes
    // createWarehouseOrder treat this as Prepaid/cod_amount:0.
    paymentMethod: 'ONLINE',
  };
}

// ──────────────────────────────────────────────────────
// POST /api/b2b/admin/orders/:id/create-shipment
// ──────────────────────────────────────────────────────
exports.createB2BShipment = async (req, res, next) => {
  try {
    const order = await B2BOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.courier?.awbNumber) {
      return res.status(400).json({ success: false, message: 'This order already has an AWB' });
    }
    if (['cancelled', 'rejected'].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot create a shipment for a ${order.status} order` });
    }

    let result;
    try {
      result = await shadowfaxService.createWarehouseOrder(toShadowfaxOrderShape(order), { locationType: 'commercial' });
    } catch (sfxErr) {
      // Persist the failure so it survives a refresh - admin-only
      // endpoint, so the real Shadowfax error text is safe to surface.
      order.courier.error = `Shipment creation failed: ${sfxErr.message}`;
      order.courier.lastSyncedAt = new Date();
      await order.save().catch(() => {});
      return res.status(502).json({ success: false, message: order.courier.error, order });
    }

    order.courier.awbNumber = result.awbNumber;
    order.courier.shadowfaxOrderId = result.shadowfaxOrderId;
    order.courier.status = result.status;
    order.courier.statusDisplay = result.statusDisplay;
    order.courier.error = undefined;
    order.courier.lastSyncedAt = new Date();

    // Same as retail: the customer tracking URL only comes from the
    // tracking endpoint, not the creation response, so fetch it now
    // rather than waiting for a separate manual resync.
    try {
      const { trackingUrl } = await shadowfaxService.trackOrder(result.awbNumber);
      if (trackingUrl) order.courier.trackingUrl = trackingUrl;
    } catch (trackErr) {
      console.warn(`Could not fetch tracking URL for B2B order ${order._id} (AWB ${result.awbNumber}):`, trackErr.message);
    }

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/admin/orders/:id/cancel-shipment
// ──────────────────────────────────────────────────────
exports.cancelB2BShipment = async (req, res, next) => {
  try {
    const order = await B2BOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!order.courier?.awbNumber) {
      return res.status(400).json({ success: false, message: 'This order has no Shadowfax shipment' });
    }

    const { remarks } = req.body || {};
    let result;
    try {
      result = await shadowfaxService.cancelOrder(order.courier.awbNumber, remarks || 'Cancelled by admin');
    } catch (sfxErr) {
      order.courier.error = `Shipment cancellation failed: ${sfxErr.message}`;
      order.courier.lastSyncedAt = new Date();
      await order.save().catch(() => {});
      return res.status(502).json({ success: false, message: order.courier.error, order });
    }

    order.courier.status = 'cancelled_by_customer';
    order.courier.statusDisplay = result.responseMsg || 'Cancelled';
    order.courier.cancelReason = remarks || 'Cancelled by admin';
    order.courier.error = undefined;
    order.courier.lastSyncedAt = new Date();
    await order.save();

    res.json({ success: true, order, shadowfax: result });
  } catch (err) {
    next(err);
  }
};
