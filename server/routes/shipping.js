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
   ADMIN
========================================= */
router.post('/orders/:id/resync', protect, admin, shippingController.resyncTracking);
router.post('/orders/:id/create-shipment', protect, admin, shippingController.createShipment);
router.post('/orders/:id/cancel-shipment', protect, admin, shippingController.cancelShipment);
router.post('/orders/:id/escalate', protect, admin, shippingController.escalateOrder);
router.get('/orders/:id/pod', protect, admin, shippingController.getProofOfDelivery);

module.exports = router;
