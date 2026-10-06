const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const invoiceController = require('../controllers/invoiceController');
const { protect, admin } = require('../middleware/auth');
const { userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const orderValidators = require('../validators/orderValidators');
const invoiceValidators = require('../validators/invoiceValidators');

// Every route below requires a valid JWT — Tier 3 (loose, per-user).
router.use(protect, userActionLimiter);

/* =========================================
   USER ORDER ROUTES
========================================= */
router.post('/', orderValidators.placeOrder, validate, orderController.placeOrder);
router.get('/', orderController.getUserOrders);
router.post('/validate-promo', orderValidators.validatePromo, validate, orderController.validatePromo);

/* =========================================
   ADMIN PROMO ROUTES
   (must come before /:id routes so 'admin'
   is never mistaken for an order id)
========================================= */
router.get('/admin/promos', admin, orderController.getPromos);
router.post('/admin/promos', admin, orderValidators.addPromo, validate, orderController.addPromo);
router.put('/admin/promos/:code/toggle', admin, orderValidators.promoCodeParam, validate, orderController.togglePromo);
router.delete('/admin/promos/:code', admin, orderValidators.promoCodeParam, validate, orderController.deletePromo);

/* =========================================
   ADMIN ORDER ROUTES
========================================= */
router.get('/admin', admin, orderController.getAllOrders);
router.put('/:id/status', admin, orderValidators.updateOrderStatus, validate, orderController.updateOrderStatus);

/* =========================================
   ORDER INVOICE (PDF: owner or admin; email: admin)
========================================= */
router.get('/:id/invoice/pdf', orderValidators.getOrder, validate, invoiceController.downloadOrderInvoice);
router.post('/:id/invoice/send', admin, invoiceValidators.sendInvoice, validate, invoiceController.sendOrderInvoice);

/* =========================================
   SINGLE ORDER (owner or admin)
   Must be last — generic :id catch-all
========================================= */
router.get('/:id', orderValidators.getOrder, validate, orderController.getOrder);

module.exports = router;
