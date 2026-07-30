const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

/* =========================================
   USER ORDER ROUTES
========================================= */
router.post('/', protect, orderController.placeOrder);
router.get('/', protect, orderController.getUserOrders);
router.post('/validate-promo', protect, orderController.validatePromo);

/* =========================================
   ADMIN PROMO ROUTES
   (must come before /:id routes so 'admin'
   is never mistaken for an order id)
========================================= */
router.get('/admin/promos', protect, admin, orderController.getPromos);
router.post('/admin/promos', protect, admin, orderController.addPromo);
router.put('/admin/promos/:code/toggle', protect, admin, orderController.togglePromo);
router.delete('/admin/promos/:code', protect, admin, orderController.deletePromo);

/* =========================================
   ADMIN ORDER ROUTES
========================================= */
router.get('/admin', protect, admin, orderController.getAllOrders);
router.put('/:id/status', protect, admin, orderController.updateOrderStatus);

/* =========================================
   SINGLE ORDER (owner or admin)
   Must be last — generic :id catch-all
========================================= */
router.get('/:id', protect, orderController.getOrder);

module.exports = router;