// server/validators/paymentValidators.js

const { body } = require('express-validator');

const PROMO_CODE_RE = /^[A-Za-z0-9]{3,20}$/;

const createPaymentOrder = [
  body('promoCode')
    .optional({ values: 'falsy' })
    .isString().matches(PROMO_CODE_RE).withMessage('promoCode must be 3-20 alphanumeric characters'),
];

const verifyPayment = [
  body('razorpay_order_id')
    .exists({ checkFalsy: true }).withMessage('razorpay_order_id is required')
    .bail()
    .isString()
    .matches(/^order_[A-Za-z0-9]+$/).withMessage('razorpay_order_id is not a valid Razorpay order id'),
  body('razorpay_payment_id')
    .exists({ checkFalsy: true }).withMessage('razorpay_payment_id is required')
    .bail()
    .isString()
    .matches(/^pay_[A-Za-z0-9]+$/).withMessage('razorpay_payment_id is not a valid Razorpay payment id'),
  body('razorpay_signature')
    .exists({ checkFalsy: true }).withMessage('razorpay_signature is required')
    .bail()
    .isString()
    // HMAC-SHA256 hex digest = exactly 64 hex characters.
    .matches(/^[a-f0-9]{64}$/).withMessage('razorpay_signature is not a valid signature'),
];

module.exports = { createPaymentOrder, verifyPayment };
