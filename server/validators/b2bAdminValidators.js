// server/validators/b2bAdminValidators.js
//
// Admin-facing B2B validator chains: account lifecycle + price tiers.

const { body, query } = require('express-validator');
const { mongoIdParam, paginationQuery } = require('./common');
const { validateGstin } = require('../utils/gstin');

const BUSINESS_TYPES = ['retailer', 'sweet_shop', 'distributor', 'supermarket', 'caterer', 'other'];
const PAYMENT_TERMS = ['prepaid', 'net7', 'net15', 'net30'];
const ACCOUNT_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

const gstinOptional = (chain) =>
  chain
    .optional({ values: 'falsy' })
    .isString().withMessage('GSTIN must be a string')
    .bail()
    .custom((value) => {
      const result = validateGstin(value);
      if (!result.valid) throw new Error(result.reason || 'Invalid GSTIN');
      return true;
    });

exports.accountIdParam = [mongoIdParam('id')];

exports.listAccountsQuery = [
  ...paginationQuery,
  query('status').optional().isIn(ACCOUNT_STATUSES).withMessage('Invalid status'),
  query('search').optional().isString().trim().isLength({ max: 100 }),
];

exports.createAccount = [
  body('email').exists({ checkFalsy: true }).withMessage('Email is required').bail()
    .isEmail().withMessage('Invalid email').bail().normalizeEmail(),
  body('businessName').exists({ checkFalsy: true }).withMessage('Business name is required').bail()
    .isString().trim().isLength({ min: 2, max: 150 }),
  body('businessType').exists({ checkFalsy: true }).withMessage('Business type is required').bail()
    .isIn(BUSINESS_TYPES).withMessage('Invalid business type'),
  gstinOptional(body('gstin')),
  body('tier').optional({ values: 'falsy' }).isMongoId().withMessage('tier must be a valid id'),
  body('paymentTerms').optional({ values: 'falsy' }).isIn(PAYMENT_TERMS).withMessage('Invalid payment terms'),
  body('creditLimit').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Credit limit must be >= 0'),
];

exports.updateAccount = [
  body('businessName').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 150 }),
  body('legalName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 150 }),
  body('businessType').optional({ values: 'falsy' }).isIn(BUSINESS_TYPES).withMessage('Invalid business type'),
  gstinOptional(body('gstin')),
  body('fssaiLicenseNo').optional({ values: 'falsy' }).isString().trim().isLength({ max: 50 }),
  body('contactName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('phone').optional({ values: 'falsy' }).isString().trim(),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email').bail().normalizeEmail(),
  body('tier').optional({ values: 'falsy' }).isMongoId().withMessage('tier must be a valid id'),
  body('paymentTerms').optional({ values: 'falsy' }).isIn(PAYMENT_TERMS).withMessage('Invalid payment terms'),
  body('creditLimit').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Credit limit must be >= 0'),
  body('adminNotes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 }),
];

exports.approveAccount = [
  body('tier').exists({ checkFalsy: true }).withMessage('tier is required').bail().isMongoId().withMessage('tier must be a valid id'),
  body('paymentTerms').exists({ checkFalsy: true }).withMessage('paymentTerms is required').bail().isIn(PAYMENT_TERMS).withMessage('Invalid payment terms'),
  body('creditLimit').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Credit limit must be >= 0'),
  body('note').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
];

exports.rejectAccount = [
  body('reason').exists({ checkFalsy: true }).withMessage('Reason is required').bail().isString().trim().isLength({ min: 3, max: 500 }),
];

exports.suspendAccount = [
  body('note').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
];

exports.reactivateAccount = [
  body('note').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
];

exports.tierIdParam = [mongoIdParam('id')];

exports.createTier = [
  body('name').exists({ checkFalsy: true }).withMessage('Name is required').bail().isString().trim().isLength({ min: 2, max: 100 }),
  body('code').exists({ checkFalsy: true }).withMessage('Code is required').bail().isString().trim().isLength({ min: 2, max: 30 }),
  body('description').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }),
  body('discountPercent').exists().withMessage('Discount percent is required').bail().isFloat({ min: 0, max: 100 }).withMessage('Discount percent must be between 0 and 100'),
  body('isDefault').optional().isBoolean(),
  body('active').optional().isBoolean(),
];

exports.updateTier = [
  body('name').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 100 }),
  body('code').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 30 }),
  body('description').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }),
  body('discountPercent').optional({ values: 'falsy' }).isFloat({ min: 0, max: 100 }).withMessage('Discount percent must be between 0 and 100'),
  body('isDefault').optional().isBoolean(),
  body('active').optional().isBoolean(),
];
