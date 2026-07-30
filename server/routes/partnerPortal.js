// server/routes/partnerPortal.js
// Mounted at /api/partner (singular) — distinct from /api/partners
// (plural, admin-only management routes in partners.js).
const express = require('express');
const router = express.Router();
const {
  setPassword,
  getMyProfile,
  getMyConsignments,
  createPaymentOrder,
  verifyPartnerPayment,
  getPartnerProducts,
  createOrderRequest,
  getMyOrderRequests,
} = require('../controllers/partnerPortalController');
const { protect, partnerOnly } = require('../middleware/auth');

/*
  ROUTE STRUCTURE:
  POST /api/partner/set-password                        → public, validated by invite token
  GET  /api/partner/me                                   → protected, partner's own profile
  GET  /api/partner/consignments                         → protected, partner's own consignments+payments
  POST /api/partner/payments/:paymentId/create-order     → protected, starts a Razorpay payment for one installment
  POST /api/partner/payments/:paymentId/verify           → protected, verifies + settles that installment
  GET  /api/partner/products                             → protected, products at this partner's wholesale price
  POST /api/partner/orders                                → protected, submits an order request (pending admin approval)
  GET  /api/partner/orders                                → protected, this partner's own order requests
*/

router.post('/set-password', setPassword);
router.get('/me', protect, partnerOnly, getMyProfile);
router.get('/consignments', protect, partnerOnly, getMyConsignments);
router.post('/payments/:paymentId/create-order', protect, partnerOnly, createPaymentOrder);
router.post('/payments/:paymentId/verify', protect, partnerOnly, verifyPartnerPayment);
router.get('/products', protect, partnerOnly, getPartnerProducts);
router.post('/orders', protect, partnerOnly, createOrderRequest);
router.get('/orders', protect, partnerOnly, getMyOrderRequests);

module.exports = router;
