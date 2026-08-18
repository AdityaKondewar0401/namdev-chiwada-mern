const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const paymentValidators = require('../validators/paymentValidators');

router.post('/create-order', protect, userActionLimiter, paymentValidators.createPaymentOrder, validate, createPaymentOrder);
router.post('/verify', protect, userActionLimiter, paymentValidators.verifyPayment, validate, verifyPayment);

module.exports = router;
