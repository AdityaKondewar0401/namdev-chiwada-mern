// server/validators/b2bOrderValidators.js
//
// Business-facing quote/place/cancel validator chains. Deliberately
// shallow — `utils/b2bPricing.js` re-validates every real business rule
// (MOQ, integer cases, delivery state, stock, min order value) against
// the database; these chains only guard the request SHAPE so a
// malformed body never reaches that logic.

const { body, query } = require('express-validator');
const { mongoIdParam } = require('./common');

const itemsChain = [
  body('items').exists({ checkFalsy: true }).withMessage('At least one item is required').bail()
    .isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.catalogItemId').isMongoId().withMessage('catalogItemId must be a valid id'),
  body('items.*.cases').isInt({ min: 1 }).withMessage('cases must be a positive integer'),
  body('shippingAddressId').optional({ values: 'falsy' }).isMongoId().withMessage('shippingAddressId must be a valid id'),
];

exports.quoteOrder = itemsChain;

exports.placeOrder = [
  ...itemsChain,
  body('buyerNotes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 1000 }),
];

exports.orderIdParam = [mongoIdParam('id')];

exports.listMyOrdersQuery = [
  query('status').optional().isIn(['placed', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled', 'rejected']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

exports.cancelOrder = [
  body('reason').exists({ checkFalsy: true }).withMessage('A reason is required').bail()
    .isString().trim().isLength({ min: 3, max: 500 }),
];
