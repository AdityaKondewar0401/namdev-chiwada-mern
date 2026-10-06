const express = require('express');
const router = express.Router();

const invoiceController = require('../controllers/invoiceController');
const { protect, admin } = require('../middleware/auth');
const { userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const invoiceValidators = require('../validators/invoiceValidators');

// Admin only. Website-order invoice download/send routes live in routes/orders.js.
router.use(protect, userActionLimiter, admin);

router.get('/', invoiceValidators.listInvoices, validate, invoiceController.listInvoices);
router.get('/summary', invoiceController.getSummary);
router.get('/customers', invoiceValidators.customerSearch, validate, invoiceController.searchCustomers);
router.post('/', invoiceValidators.createInvoice, validate, invoiceController.createInvoice);

router.get('/:id', invoiceValidators.invoiceIdParam, validate, invoiceController.getInvoice);
router.get('/:id/pdf', invoiceValidators.invoiceIdParam, validate, invoiceController.downloadInvoicePdf);
router.post('/:id/send', invoiceValidators.sendInvoice, validate, invoiceController.sendInvoice);
router.patch('/:id/payment', invoiceValidators.markPaid, validate, invoiceController.markPaid);
router.post('/:id/cancel', invoiceValidators.cancelInvoice, validate, invoiceController.cancelInvoice);

module.exports = router;
