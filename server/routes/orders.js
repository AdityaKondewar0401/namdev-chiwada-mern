const express = require('express');
const router = express.Router();
const { placeOrder, getUserOrders, getOrder, getAllOrders, updateOrderStatus, validatePromo } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);
router.post('/', placeOrder);
router.get('/', getUserOrders);
router.post('/validate-promo', validatePromo);
router.get('/admin', admin, getAllOrders);
// routes/orders.js — add this line (protected by admin middleware)
router.post('/validate-promo', protect, orderController.validatePromo);
router.post('/admin/promos', protect, admin, orderController.addPromo); // ← add this
router.get('/:id', getOrder);
router.put('/:id/status', admin, updateOrderStatus);

module.exports = router;
