// server/validators/b2bAdminOrderValidators.js

const { body, query } = require('express-validator');
const { mongoIdParam } = require('./common');

const ALL_STATUSES = ['placed', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled', 'rejected'];
const DISPATCH_MODES = ['own_vehicle', 'transporter', 'courier', 'pickup'];

exports.orderIdParam = [mongoIdParam('id')];

exports.listOrdersQuery = [
  query('status').optional().isIn(ALL_STATUSES).withMessage('Invalid status'),
  query('business').optional().isMongoId().withMessage('business must be a valid id'),
  query('from').optional().isISO8601().withMessage('from must be a valid date'),
  query('to').optional().isISO8601().withMessage('to must be a valid date'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

exports.updateOrderItems = [
  body('items').exists({ checkFalsy: true }).withMessage('At least one item is required').bail()
    .isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.catalogItemId').isMongoId().withMessage('catalogItemId must be a valid id'),
  body('items.*.cases').isInt({ min: 1 }).withMessage('cases must be a positive integer'),
  body('reason').exists({ checkFalsy: true }).withMessage('A reason is required').bail()
    .isString().trim().isLength({ min: 3, max: 500 }),
];

exports.updateOrderStatus = [
  body('status').exists({ checkFalsy: true }).withMessage('status is required').bail()
    .isIn(ALL_STATUSES).withMessage('Invalid status'),
  body('note').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
  body('reason').optional({ values: 'falsy' }).isString().trim().isLength({ min: 3, max: 500 }),
  body('dispatch').optional().isObject().withMessage('dispatch must be an object'),
  body('dispatch.mode').if(body('dispatch').exists()).optional({ values: 'falsy' }).isIn(DISPATCH_MODES).withMessage('Invalid dispatch mode'),
  body('dispatch.transporterName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 150 }),
  body('dispatch.lrNumber').optional({ values: 'falsy' }).isString().trim().isLength({ max: 60 }),
  body('dispatch.vehicleNumber').optional({ values: 'falsy' }).isString().trim().isLength({ max: 30 }),
  body('dispatch.trackingUrl').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
  body('dispatch.expectedDeliveryDate').optional({ values: 'falsy' }).isISO8601().withMessage('expectedDeliveryDate must be a valid date'),
  body('dispatch.notes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
  body('force').optional().isBoolean(),
];

exports.overrideCreditHold = [
  body('note').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
];
