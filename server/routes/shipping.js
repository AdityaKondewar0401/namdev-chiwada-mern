const express = require('express');
const router = express.Router();

const shippingController = require('../controllers/shippingController');
const { protect, admin } = require('../middleware/auth');

/* =========================================
   PUBLIC
========================================= */
// Checkout-time pincode serviceability check (no login required so it
// can also be reused on product pages later if needed).
router.get('/check-pincode', shippingController.checkPincode);

// Shadowfax Push Callback webhook. Deliberately NOT behind `protect` —
// Shadowfax calls this server-to-server, not as a logged-in user. It is
// instead verified via SHADOWFAX_WEBHOOK_TOKEN inside the controller
// (configure the same value in the Shadowfax Client Portal webhook tab).
router.post('/webhook/shadowfax', shippingController.handlePushCallback);

/* =========================================
   ADMIN — customer Orders
========================================= */
router.post('/orders/:id/resync', protect, admin, shippingController.resyncTracking);
router.post('/orders/:id/create-shipment', protect, admin, shippingController.createShipment);
router.post('/orders/:id/cancel-shipment', protect, admin, shippingController.cancelShipment);
router.post('/orders/:id/escalate', protect, admin, shippingController.escalateOrder);
router.get('/orders/:id/pod', protect, admin, shippingController.getProofOfDelivery);

/* =========================================
   ADMIN — partner Consignments (same three actions; escalate/POD weren't
   requested for consignments and aren't wired up in the admin UI, so
   they're left out here to match what's actually exposed).
========================================= */
router.post('/consignments/:id/resync', protect, admin, shippingController.resyncConsignmentTracking);
router.post('/consignments/:id/create-shipment', protect, admin, shippingController.createConsignmentShipment);
router.post('/consignments/:id/cancel-shipment', protect, admin, shippingController.cancelConsignmentShipment);

module.exports = router;
