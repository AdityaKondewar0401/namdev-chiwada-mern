const express = require('express');
const router = express.Router();

const {
  placeOrder,
  getUserOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  validatePromo,
  addPromo
} = require('../controllers/orderController');

const { protect, admin } = require('../middleware/auth');

router.use(protect);

router.post('/', placeOrder);
router.get('/', getUserOrders);

router.post('/validate-promo', validatePromo);

router.get('/admin', admin, getAllOrders);

router.post('/admin/promos', admin, addPromo);

router.get('/:id', getOrder);

router.put('/:id/status', admin, updateOrderStatus);

module.exports = router;