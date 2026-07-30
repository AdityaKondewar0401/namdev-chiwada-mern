// server/routes/consignments.js
const express = require('express');
const router = express.Router();
const {
  getConsignments,
  getConsignment,
  createConsignment,
  getDuesSummary,
  markPaymentPaid,
  runRemindersNow,
} = require('../controllers/consignmentController');
const { protect, admin } = require('../middleware/auth');

/*
  ROUTE STRUCTURE (all admin-only in Phase 1):
  GET  /api/consignments                              → list all
  POST /api/consignments                               → create (also creates 2 Payment records)
  GET  /api/consignments/dues                           → outstanding-balance summary per partner
  POST /api/consignments/reminders/run                  → manually trigger the reminder job (Phase 3 testing)
  PUT  /api/consignments/payments/:paymentId/mark-paid  → mark one installment paid
  GET  /api/consignments/:id                            → single consignment + its payments

  NOTE: '/dues', '/reminders/run', and '/payments/:paymentId/mark-paid' are
  static-ish routes and must stay ABOVE '/:id', same rule as products.js —
  otherwise Express would try to treat "dues" as a consignment id.
*/

router.use(protect, admin);

router.get('/', getConsignments);
router.post('/', createConsignment);
router.get('/dues', getDuesSummary);
router.post('/reminders/run', runRemindersNow);
router.put('/payments/:paymentId/mark-paid', markPaymentPaid);
router.get('/:id', getConsignment);

module.exports = router;
