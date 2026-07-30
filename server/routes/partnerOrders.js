// server/routes/partnerOrders.js
// Admin-only review queue for orders partners place themselves through
// their portal — distinct from /api/consignments (admin-dispatched stock).
const express = require('express');
const router = express.Router();
const {
  getOrderRequests,
  approveOrderRequest,
  rejectOrderRequest,
} = require('../controllers/partnerOrderController');
const { protect, admin } = require('../middleware/auth');

/*
  ROUTE STRUCTURE (all admin-only):
  GET  /api/partner-orders             → list all partner order requests
  POST /api/partner-orders/:id/approve → turn a pending request into a real Consignment
  POST /api/partner-orders/:id/reject  → decline a pending request
*/

router.use(protect, admin);

router.get('/', getOrderRequests);
router.post('/:id/approve', approveOrderRequest);
router.post('/:id/reject', rejectOrderRequest);

module.exports = router;
