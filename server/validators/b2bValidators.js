// server/validators/b2bValidators.js
//
// Business-facing B2B validator chains (apply, update own profile).
// Every optional field is genuinely optional — only businessName and
// businessType are required, matching BusinessAccount's own schema.

const { body } = require('express-validator');
const { validateGstin } = require('../utils/gstin');

const BUSINESS_TYPES = ['retailer', 'sweet_shop', 'distributor', 'supermarket', 'caterer', 'other'];

// Mirrors common.js's indianPhone regex, but as a genuinely optional
// field — common.js's own helper always calls .exists(), which would
// force phone to be required here.
const INDIAN_PHONE_RE = /^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/;

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

const addressFields = (prefix) => ([
  body(`${prefix}.line1`).optional({ values: 'falsy' }).isString().trim().isLength({ max: 200 }),
  body(`${prefix}.line2`).optional({ values: 'falsy' }).isString().trim().isLength({ max: 200 }),
  body(`${prefix}.city`).optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body(`${prefix}.district`).optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body(`${prefix}.state`).optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body(`${prefix}.stateCode`).optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 2 }),
  body(`${prefix}.pincode`).optional({ values: 'falsy' }).matches(/^[1-9][0-9]{5}$/).withMessage('Pincode must be a valid 6-digit Indian PIN code'),
]);

exports.applyForBusiness = [
  body('businessName').exists({ checkFalsy: true }).withMessage('Business name is required').bail()
    .isString().trim().isLength({ min: 2, max: 150 }),
  body('businessType').exists({ checkFalsy: true }).withMessage('Business type is required').bail()
    .isIn(BUSINESS_TYPES).withMessage('Invalid business type'),
  body('legalName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 150 }),
  gstinOptional(body('gstin')),
  body('fssaiLicenseNo').optional({ values: 'falsy' }).isString().trim().isLength({ max: 50 }),
  body('contactName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('phone').optional({ values: 'falsy' }).matches(INDIAN_PHONE_RE).withMessage('Phone number must be a valid 10-digit Indian mobile number'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email').bail().normalizeEmail(),
  ...addressFields('billingAddress'),
];

exports.updateMyBusiness = [
  body('businessName').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 150 }),
  body('businessType').optional({ values: 'falsy' }).isIn(BUSINESS_TYPES).withMessage('Invalid business type'),
  body('legalName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 150 }),
  gstinOptional(body('gstin')),
  body('fssaiLicenseNo').optional({ values: 'falsy' }).isString().trim().isLength({ max: 50 }),
  body('contactName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('phone').optional({ values: 'falsy' }).matches(INDIAN_PHONE_RE).withMessage('Phone number must be a valid 10-digit Indian mobile number'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email').bail().normalizeEmail(),
  ...addressFields('billingAddress'),
  body('shippingAddresses').optional().isArray({ max: 20 }).withMessage('Too many shipping addresses'),
  body('shippingAddresses.*.label').optional({ values: 'falsy' }).isString().trim().isLength({ max: 60 }),
  body('shippingAddresses.*.contactName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('shippingAddresses.*.phone').optional({ values: 'falsy' }).isString().trim(),
  body('shippingAddresses.*.line1').optional({ values: 'falsy' }).isString().trim().isLength({ max: 200 }),
  body('shippingAddresses.*.line2').optional({ values: 'falsy' }).isString().trim().isLength({ max: 200 }),
  body('shippingAddresses.*.city').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('shippingAddresses.*.district').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('shippingAddresses.*.state').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('shippingAddresses.*.stateCode').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 2 }),
  body('shippingAddresses.*.pincode').optional({ values: 'falsy' }).matches(/^[1-9][0-9]{5}$/).withMessage('Pincode must be a valid 6-digit Indian PIN code'),
  body('shippingAddresses.*.isDefault').optional().isBoolean(),
];
