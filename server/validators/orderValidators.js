// server/validators/orderValidators.js

const { body, param } = require('express-validator');
const { mongoIdParam } = require('./common');

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_METHODS = ['COD', 'ONLINE'];
const PROMO_TYPES = ['percent', 'flat', 'shipping'];
// Promo codes are always upper-cased before storage/lookup — validate the
// raw shape (letters/digits only, sane length) rather than the cased form.
const PROMO_CODE_RE = /^[A-Za-z0-9]{3,20}$/;

const shippingAddressValidators = [
  body('shippingAddress')
    .exists().withMessage('Shipping address is required')
    .bail()
    .isObject().withMessage('Shipping address must be an object'),

  // fullName/name is a fallback pair in the schema — require at least
  // one, and validate whichever is present.
  body('shippingAddress.fullName')
    .optional({ values: 'falsy' })
    .isString().isLength({ min: 2, max: 100 }).withMessage('fullName must be between 2 and 100 characters'),
  body('shippingAddress.name')
    .optional({ values: 'falsy' })
    .isString().isLength({ min: 2, max: 100 }).withMessage('name must be between 2 and 100 characters'),
  body('shippingAddress').custom((addr) => {
    if (!addr?.fullName && !addr?.name) {
      throw new Error('shippingAddress.fullName (or .name) is required');
    }
    return true;
  }),

  body('shippingAddress.phone').custom((value) => {
    if (!/^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/.test(String(value || ''))) {
      throw new Error('shippingAddress.phone must be a valid 10-digit Indian mobile number');
    }
    return true;
  }),

  // line1/street fallback pair, same pattern as fullName/name.
  body('shippingAddress.line1')
    .optional({ values: 'falsy' })
    .isString().isLength({ min: 1, max: 200 }).withMessage('line1 must be at most 200 characters'),
  body('shippingAddress.street')
    .optional({ values: 'falsy' })
    .isString().isLength({ min: 1, max: 200 }).withMessage('street must be at most 200 characters'),
  body('shippingAddress').custom((addr) => {
    if (!addr?.line1 && !addr?.street) {
      throw new Error('shippingAddress.line1 (or .street) is required');
    }
    return true;
  }),

  body('shippingAddress.line2').optional({ values: 'falsy' }).isString().isLength({ max: 200 }).withMessage('line2 must be at most 200 characters'),
  body('shippingAddress.city')
    .exists({ checkFalsy: true }).withMessage('shippingAddress.city is required')
    .bail()
    .isString().isLength({ min: 1, max: 100 }).withMessage('city must be at most 100 characters'),
  body('shippingAddress.state')
    .exists({ checkFalsy: true }).withMessage('shippingAddress.state is required')
    .bail()
    .isString().isLength({ min: 1, max: 100 }).withMessage('state must be at most 100 characters'),

  // pincode/zip fallback pair.
  body('shippingAddress.pincode').optional({ values: 'falsy' }).isString().matches(/^[1-9][0-9]{5}$/).withMessage('pincode must be a valid 6-digit Indian PIN code'),
  body('shippingAddress.zip').optional({ values: 'falsy' }).isString().matches(/^[1-9][0-9]{5}$/).withMessage('zip must be a valid 6-digit Indian PIN code'),
  body('shippingAddress').custom((addr) => {
    if (!addr?.pincode && !addr?.zip) {
      throw new Error('shippingAddress.pincode (or .zip) is required');
    }
    return true;
  }),
];

const placeOrder = [
  ...shippingAddressValidators,
  body('paymentMethod')
    .optional({ values: 'falsy' })
    .isIn(PAYMENT_METHODS).withMessage(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`),
  // Required only when paymentMethod is ONLINE — checked with a custom
  // validator since express-validator's per-field rules can't see
  // sibling fields directly in a declarative chain.
  body('razorpayOrderId').custom((value, { req }) => {
    if (req.body.paymentMethod === 'ONLINE') {
      if (typeof value !== 'string' || !/^order_[A-Za-z0-9]+$/.test(value)) {
        throw new Error('razorpayOrderId is required and must be a valid Razorpay order id for ONLINE payments');
      }
    }
    return true;
  }),
  body('promoCode')
    .optional({ values: 'falsy' })
    .isString().matches(PROMO_CODE_RE).withMessage('promoCode must be 3-20 alphanumeric characters'),
  body('notes')
    .optional({ values: 'falsy' })
    .isString().isLength({ max: 500 }).withMessage('notes must be at most 500 characters'),
  body('marketingConsent')
    .optional()
    .isBoolean().withMessage('marketingConsent must be true or false')
    .toBoolean(),
];

const getOrder = [mongoIdParam('id')];

const updateOrderStatus = [
  mongoIdParam('id'),
  body('status')
    .exists({ checkFalsy: true }).withMessage('status is required')
    .bail()
    .isIn(ORDER_STATUSES).withMessage(`status must be one of: ${ORDER_STATUSES.join(', ')}`),
];

const validatePromo = [
  body('code')
    .exists({ checkFalsy: true }).withMessage('code is required')
    .bail()
    .isString().matches(PROMO_CODE_RE).withMessage('code must be 3-20 alphanumeric characters'),
  body('subtotal')
    .exists().withMessage('subtotal is required')
    .bail()
    .isFloat({ min: 0, max: 1000000 }).withMessage('subtotal must be a non-negative number')
    .toFloat(),
];

const addPromo = [
  body('code')
    .exists({ checkFalsy: true }).withMessage('code is required')
    .bail()
    .isString().matches(PROMO_CODE_RE).withMessage('code must be 3-20 alphanumeric characters'),
  body('type')
    .exists({ checkFalsy: true }).withMessage('type is required')
    .bail()
    .isIn(PROMO_TYPES).withMessage(`type must be one of: ${PROMO_TYPES.join(', ')}`),
  body('value')
    .optional()
    .isFloat({ min: 0, max: 100000 }).withMessage('value must be a non-negative number')
    .toFloat(),
];

const promoCodeParam = [
  param('code')
    .exists({ checkFalsy: true }).withMessage('code is required')
    .bail()
    .isString().matches(PROMO_CODE_RE).withMessage('code must be 3-20 alphanumeric characters'),
];

module.exports = {
  placeOrder,
  getOrder,
  updateOrderStatus,
  validatePromo,
  addPromo,
  promoCodeParam,
};
