// server/services/consignmentShipping.js
//
// Extends the Shadowfax integration to partner Consignments (bulk stock
// dispatched to a distributor/retailer/corporate), mirroring exactly what
// orderController.createShadowfaxShipmentForOrder does for customer Orders
// — same shadowfaxService.createWarehouseOrder() call, same courier.*
// fields populated, same "never block the business action, just record
// the error" philosophy.
//
// Consignment.js has a different shape than Order.js (partner delivery
// address lives on the Partner document, not on the consignment itself;
// item price field is `unitPrice`, not `price`), so this module adapts a
// {consignment, partner} pair into the same shape createWarehouseOrder()
// already expects from an Order, rather than duplicating/forking the
// Shadowfax payload-building logic in shadowfaxService.js.
//
// IMPORTANT — two deliberate differences from the customer-Order flow:
//
// 1. No 7kg weight cap is enforced here. That cap exists in
//    orderController/shippingController specifically because a single
//    customer parcel = a single Shadowfax pickup bag. A partner
//    consignment is a bulk wholesale dispatch and will routinely exceed
//    7kg — blocking on that would break the core partner business flow.
//    If a real shipment genuinely is too heavy for Shadowfax's warehouse
//    service, Shadowfax's own API will reject it and that failure is
//    recorded on consignment.courier.error exactly like any other
//    creation failure, surfaced in the admin Consignments panel with a
//    manual "Create Shadowfax shipment" retry button.
//
// 2. Always sent as payment_mode "Prepaid" (paymentMethod: 'ONLINE' in
//    the adapter below), never COD — Shadowfax must never attempt to
//    collect cash from the partner on delivery. The partner's own
//    advance/final payment split is handled entirely outside Shadowfax,
//    via Razorpay (see partnerPortalController.createPaymentOrder).

const shadowfaxService = require('./shadowfaxService');
const { getShadowfaxConfig } = require('../config/shadowfax');
const { calcTotalWeightGrams } = require('../utils/weight');

/**
 * Adapts a {consignment, partner} pair into the plain-object shape
 * shadowfaxService.createWarehouseOrder() expects from an Order document
 * (`_id`, `shippingAddress`, `items[{name,size,qty,price}]`, `subtotal`,
 * `total`, `paymentMethod`).
 */
function buildShadowfaxInputFromConsignment(consignment, partner) {
  const addr = partner?.address || {};

  return {
    _id: consignment._id,
    shippingAddress: {
      fullName: partner?.contactPerson || partner?.businessName || 'Partner',
      phone: partner?.phone || '',
      line1: addr.street || '',
      line2: '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    },
    items: (consignment.items || []).map((item) => ({
      name: item.name,
      size: item.size,
      qty: item.qty,
      price: item.unitPrice,
    })),
    subtotal: consignment.totalAmount,
    total: consignment.totalAmount,
    // Force Prepaid — see module note #2 above.
    paymentMethod: 'ONLINE',
  };
}

/**
 * Creates the Shadowfax warehouse shipment for a just-dispatched
 * Consignment and stores the result on consignment.courier.
 *
 * Never throws — a Shadowfax outage or misconfiguration must not stop a
 * consignment (and its Payment records) from being created. Any failure
 * is recorded on consignment.courier.error so the admin panel can show a
 * manual retry ("Create Shadowfax shipment" button — see
 * shippingController.createConsignmentShipment).
 */
async function createShadowfaxShipmentForConsignment(consignment, partner) {
  try {
    const cfg = getShadowfaxConfig();
    if (!cfg.authToken) {
      consignment.courier.error = 'SHADOWFAX_AUTH_TOKEN not configured — shipment not created.';
      await consignment.save();
      return;
    }

    if (!partner?.address?.pincode) {
      consignment.courier.error = 'This partner has no delivery pincode on file — add one on the Partners tab, then use "Create Shadowfax shipment" to retry.';
      await consignment.save();
      return;
    }

    const adapted = buildShadowfaxInputFromConsignment(consignment, partner);
    const result = await shadowfaxService.createWarehouseOrder(adapted);

    consignment.courier.awbNumber = result.awbNumber;
    consignment.courier.shadowfaxOrderId = result.shadowfaxOrderId;
    consignment.courier.status = result.status;
    consignment.courier.statusDisplay = result.statusDisplay;
    consignment.courier.actualWeightGrams = calcTotalWeightGrams(consignment.items, cfg.defaultItemWeightGrams);
    consignment.courier.error = undefined;
    consignment.courier.lastSyncedAt = new Date();

    // Same as orderController — the creation response never includes a
    // tracking URL, only the separate tracking endpoint does. Fetch it
    // once right away so it's visible immediately.
    try {
      const { trackingUrl } = await shadowfaxService.trackOrder(result.awbNumber);
      if (trackingUrl) consignment.courier.trackingUrl = trackingUrl;
    } catch (trackErr) {
      console.warn(`Could not fetch tracking URL for consignment ${consignment._id} (AWB ${result.awbNumber}):`, trackErr.message);
    }

    await consignment.save();
  } catch (err) {
    console.error(`Shadowfax shipment creation failed for consignment ${consignment._id}:`, err.message);
    consignment.courier.error = err.message;
    await consignment.save().catch(() => {});
  }
}

module.exports = {
  buildShadowfaxInputFromConsignment,
  createShadowfaxShipmentForConsignment,
};
