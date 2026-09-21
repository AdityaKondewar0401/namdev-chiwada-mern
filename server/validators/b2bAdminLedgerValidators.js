// server/validators/b2bAdminLedgerValidators.js

const { body, query } = require('express-validator');
const { mongoIdParam } = require('./common');

const METHODS = ['upi', 'neft_rtgs', 'cash', 'cheque', 'razorpay', 'other'];

exports.accountIdParam = [mongoIdParam('id')];

exports.ledgerQuery = [
  query('from').optional().isISO8601().withMessage('from must be a valid date'),
  query('to').optional().isISO8601().withMessage('to must be a valid date'),
];

exports.recordPayment = [
  body('amount').exists().withMessage('amount is required').bail()
    .isFloat({ gt: 0 }).withMessage('amount must be greater than 0'),
  body('date').optional({ values: 'falsy' }).isISO8601().withMessage('date must be valid'),
  body('method').exists({ checkFalsy: true }).withMessage('method is required').bail()
    .isIn(METHODS).withMessage('Invalid payment method'),
  body('reference').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('note').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
];

exports.recordAdjustment = [
  body('type').exists({ checkFalsy: true }).withMessage('type is required').bail()
    .isIn(['debit', 'credit']).withMessage('type must be "debit" or "credit"'),
  body('amount').exists().withMessage('amount is required').bail()
    .isFloat({ gt: 0 }).withMessage('amount must be greater than 0'),
  body('note').exists({ checkFalsy: true }).withMessage('A note is required for every adjustment').bail()
    .isString().trim().isLength({ min: 3, max: 500 }),
];

exports.recordOpeningBalance = [
  body('amount').exists().withMessage('amount is required').bail()
    .isFloat().withMessage('amount must be a number').bail()
    .custom((value) => {
      if (Number(value) === 0) throw new Error('amount must not be zero');
      return true;
    }),
  body('note').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
];
