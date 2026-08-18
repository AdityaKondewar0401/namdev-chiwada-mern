const express = require('express');
const router = express.Router();

const shippingController = require('../controllers/shippingController');
const { protect, admin } = require('../middleware/auth');
const { publicLimiter, webhookLimiter, userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const shippingValidators = require('../validators/shippingValidators');

/* =========================================
   PUBLIC
========================================= */
// Checkout-time pincode serviceability check (no login required so it
// can also be reused on product pages later if needed). Tier 2.
router.get('/check-pincode', publicLimiter, shippingValidators.checkPincode, validate, shippingController.checkPincode);

// Shadowfax Push Callback webhook. Deliberately NOT behind `protect` —
// Shadowfax calls this server-to-server, not as a logged-in user. It is
// instead verified via SHADOWFAX_WEBHOOK_TOKEN inside the controller
// (configure the same value in the Shadowfax Client Portal webhook tab).
// Rate-limited separately from browser traffic (webhookLimiter) since
// this is legitimate server-to-server volume, not abuse to throttle down
// to Tier 2 levels.
router.post('/webhook/shadowfax', webhookLimiter, shippingValidators.handlePushCallback, validate, shippingController.handlePushCallback);

/* =========================================
   ADMIN — customer Orders (Tier 3, loose per-user)
========================================= */
router.post('/orders/:id/resync', protect, admin, userActionLimiter, shippingValidators.orderIdParam, validate, shippingController.resyncTracking);
router.post('/orders/:id/create-shipment', protect, admin, userActionLimiter, shippingValidators.orderIdParam, validate, shippingController.createShipment);
router.post('/orders/:id/cancel-shipment', protect, admin, userActionLimiter, shippingValidators.cancelShipment, validate, shippingController.cancelShipment);
router.post('/orders/:id/escalate', protect, admin, userActionLimiter, shippingValidators.escalateOrder, validate, shippingController.escalateOrder);
router.get('/orders/:id/pod', protect, admin, userActionLimiter, shippingValidators.orderIdParam, validate, shippingController.getProofOfDelivery);

module.exports = router;
