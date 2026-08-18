// server/validators/shippingValidators.js

const { body, query } = require('express-validator');
const { mongoIdParam, indianPincode } = require('./common');

const checkPincode = [indianPincode(query('pincode'))];

// Shadowfax's push-callback payload — fields per the API doc (see
// shippingController.handlePushCallback). Everything here is optional at
// the schema level EXCEPT that at least one of awb_number/order_id must
// be present (checked below), matching the controller's own logic —
// this validator's job is to make sure whatever IS present is the right
// shape before it's used to look up/mutate an Order document.
const handlePushCallback = [
  body('awb_number').optional({ values: 'falsy' }).isString().isLength({ max: 64 }).withMessage('awb_number must be at most 64 characters'),
  body('order_id').optional({ values: 'falsy' }).isMongoId().withMessage('order_id must be a valid id'),
  body('event_timestamp').optional({ values: 'falsy' }).isISO8601().withMessage('event_timestamp must be a valid ISO 8601 date'),
  body('current_location').optional({ values: 'falsy' }).isString().isLength({ max: 200 }).withMessage('current_location must be at most 200 characters'),
  body('comments').optional({ values: 'falsy' }).isString().isLength({ max: 500 }).withMessage('comments must be at most 500 characters'),
  body('status').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('status must be at most 100 characters'),
  body('event').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('event must be at most 100 characters'),
  body().custom((value) => {
    if (!value?.awb_number && !value?.order_id) {
      throw new Error('At least one of awb_number or order_id is required');
    }
    return true;
  }),
];

const orderIdParam = [mongoIdParam('id')];

const cancelShipment = [
  mongoIdParam('id'),
  body('remarks').optional({ values: 'falsy' }).isString().isLength({ max: 500 }).withMessage('remarks must be at most 500 characters'),
];

// Issue category codes per the Shadowfax API doc: 1 Delayed Delivery,
// 2 Expedite Pickup - Customer, 3 Expedite Pickup - Seller,
// 4 Status Mismatch, 5 Delivery Dispute.
const escalateOrder = [
  mongoIdParam('id'),
  body('issueCategory')
    .exists().withMessage('issueCategory is required')
    .bail()
    .isInt({ min: 1, max: 5 }).withMessage('issueCategory must be an integer between 1 and 5')
    .toInt(),
];

module.exports = { checkPincode, handlePushCallback, orderIdParam, cancelShipment, escalateOrder };
