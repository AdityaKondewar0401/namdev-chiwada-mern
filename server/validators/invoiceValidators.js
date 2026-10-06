const { body, query } = require('express-validator');
const { mongoIdParam, paginationQuery } = require('./common');
const { getFinancialYearStart, istDateKey } = require('../utils/invoiceUtils');

const PAYMENT_METHODS = ['cash', 'upi', 'bank', 'card', 'credit'];
const PAID_METHODS = ['cash', 'upi', 'bank', 'card'];

// `.local` is the placeholder domain given to WhatsApp-bot customers.
const deliverableEmail = (chain) =>
  chain
    .isString().withMessage('Email must be text')
    .bail()
    .isEmail().withMessage('Enter a valid email address')
    .bail()
    .not().matches(/\.local$/i).withMessage('Enter a real email address');

const sendChain = [
  deliverableEmail(body('to').exists({ checkFalsy: true }).withMessage('Email address is required').bail()),
  body('message').optional({ values: 'falsy' }).isString().isLength({ max: 1000 }).withMessage('Message must be at most 1000 characters'),
];

exports.invoiceIdParam = [mongoIdParam('id')];

exports.listInvoices = [
  ...paginationQuery,
  query('q').optional().isString().isLength({ max: 100 }).withMessage('Search must be at most 100 characters'),
  query('source').optional().isIn(['website', 'offline']).withMessage('Invalid source'),
  query('state').optional().isIn(['paid', 'due', 'cancelled']).withMessage('Invalid status'),
];

exports.customerSearch = [
  query('q').exists({ checkFalsy: true }).withMessage('Search text is required').bail()
    .isString().isLength({ max: 60 }).withMessage('Search must be at most 60 characters'),
];

exports.createInvoice = [
  body('customer.name').exists({ checkFalsy: true }).withMessage('Customer name is required').bail()
    .isString().isLength({ max: 100 }).withMessage('Customer name must be at most 100 characters'),
  body('customer.phone').optional({ values: 'falsy' }).isString()
    .matches(/^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/).withMessage('Phone number must be a valid 10-digit Indian mobile number'),
  deliverableEmail(body('customer.email').optional({ values: 'falsy' })),
  body('customer.address').optional({ values: 'falsy' }).isString().isLength({ max: 300 }).withMessage('Address must be at most 300 characters'),

  body('items').isArray({ min: 1, max: 100 }).withMessage('Add between 1 and 100 items'),
  body('items.*.product').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid product'),
  body('items.*.name').exists({ checkFalsy: true }).withMessage('Every item needs a name').bail()
    .isString().isLength({ max: 120 }).withMessage('Item names must be at most 120 characters'),
  body('items.*.size').optional({ values: 'falsy' }).isString().isLength({ max: 30 }).withMessage('Pack size must be at most 30 characters'),
  body('items.*.price').isFloat({ min: 0, max: 1000000 }).withMessage('Each price must be between ₹0 and ₹10,00,000'),
  body('items.*.qty').isInt({ min: 1, max: 100000 }).withMessage('Each quantity must be a whole number from 1 to 1,00,000'),

  body('discountType').optional().isIn(['flat', 'percent']).withMessage('Invalid discount type'),
  body('discountValue').optional({ values: 'falsy' }).isFloat({ min: 0, max: 1000000 }).withMessage('Discount must be a positive amount')
    .bail()
    .custom((value, { req }) => {
      if (req.body.discountType === 'percent' && Number(value) > 100) throw new Error('A percentage discount can be at most 100%');
      return true;
    }),
  body('shipping').optional({ values: 'falsy' }).isFloat({ min: 0, max: 100000 }).withMessage('Delivery charge must be between ₹0 and ₹1,00,000'),

  body('paymentMethod').isIn(PAYMENT_METHODS).withMessage('Choose a payment method'),
  body('paymentReference').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('Reference must be at most 100 characters'),
  body('notes').optional({ values: 'falsy' }).isString().isLength({ max: 500 }).withMessage('Notes must be at most 500 characters'),
  body('issuedOn').optional({ values: 'falsy' })
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid invoice date')
    .bail()
    .isISO8601({ strict: true }).withMessage('Invalid invoice date')
    .bail()
    .custom((value) => {
      if (value > istDateKey()) throw new Error("The invoice date can't be in the future");
      if (value < istDateKey(getFinancialYearStart())) throw new Error('The invoice date must be in the current financial year');
      return true;
    }),
];

exports.sendInvoice = [mongoIdParam('id'), ...sendChain];

exports.markPaid = [
  mongoIdParam('id'),
  body('method').isIn(PAID_METHODS).withMessage('Choose how it was paid'),
  body('reference').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('Reference must be at most 100 characters'),
];

exports.cancelInvoice = [
  mongoIdParam('id'),
  body('reason').exists({ checkFalsy: true }).withMessage('A reason is required').bail()
    .isString().isLength({ min: 3, max: 300 }).withMessage('Reason must be 3 to 300 characters'),
];
