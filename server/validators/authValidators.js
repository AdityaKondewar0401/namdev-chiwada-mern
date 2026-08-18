// server/validators/authValidators.js
//
// Strict schema for every field authController.js reads from req.body.
// Anything that doesn't match type/length/format is rejected with 400
// before the controller — or a database query — ever sees it.

const { body } = require('express-validator');
const { indianPhone } = require('./common');

// Matches the User schema's own minlength: 6 (models/User.js). Upper
// bound of 128 is a sane cap — long enough for any real passphrase,
// short enough to block deliberately huge payloads aimed at bcrypt's
// cost (bcrypt itself silently truncates at 72 bytes, so anything past
// that is wasted anyway).
const passwordField = (field, { optional = false } = {}) => {
  const chain = body(field);
  if (optional) chain.optional({ values: 'falsy' });
  return chain
    .exists({ checkFalsy: true }).withMessage(`${field} is required`)
    .bail()
    .isString().withMessage(`${field} must be a string`)
    .bail()
    .isLength({ min: 6, max: 128 }).withMessage(`${field} must be between 6 and 128 characters`);
};

const emailField = body('email')
  .exists({ checkFalsy: true }).withMessage('Email is required')
  .bail()
  .isString().withMessage('Email must be a string')
  .bail()
  .isLength({ max: 254 }).withMessage('Email is too long')
  .bail()
  .isEmail().withMessage('Must be a valid email address');

const register = [
  body('name')
    .exists({ checkFalsy: true }).withMessage('Name is required')
    .bail()
    .isString().withMessage('Name must be a string')
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .bail()
    .matches(/^[\p{L}\p{M}\s.'-]+$/u).withMessage('Name contains characters that are not allowed'),
  emailField,
  passwordField('password'),
  body('phone').optional({ values: 'falsy' }).custom((value, { req }) => {
    // Reuse the strict phone check but keep it optional at register time
    // (checkout is where a phone number becomes mandatory).
    if (!/^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/.test(String(value))) {
      throw new Error('Phone number must be a valid 10-digit Indian mobile number');
    }
    return true;
  }),
  body('marketingConsent')
    .optional()
    .isBoolean().withMessage('marketingConsent must be true or false')
    .toBoolean(),
];

const login = [
  emailField,
  body('password')
    .exists({ checkFalsy: true }).withMessage('Password is required')
    .bail()
    .isString().withMessage('Password must be a string')
    .bail()
    // No minlength check here on purpose: a wrong-length password should
    // fail as "invalid email or password" from the controller, exactly
    // like a wrong password — not leak the password policy via a
    // differently-worded 400 from the validator.
    .isLength({ max: 128 }).withMessage('Password is too long'),
];

const google = [
  body('credential')
    .exists({ checkFalsy: true }).withMessage('Google credential is required')
    .bail()
    .isString().withMessage('Google credential must be a string')
    .bail()
    // Google ID tokens are JWTs — three dot-separated base64url segments.
    .isLength({ min: 16, max: 4096 }).withMessage('Google credential has an invalid length')
    .bail()
    .matches(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/).withMessage('Google credential is not a valid token'),
];

const updateProfile = [
  body('name')
    .optional({ values: 'falsy' })
    .isString().withMessage('Name must be a string')
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .bail()
    .matches(/^[\p{L}\p{M}\s.'-]+$/u).withMessage('Name contains characters that are not allowed'),
  body('phone').optional({ values: 'falsy' }).custom((value) => {
    if (!/^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/.test(String(value))) {
      throw new Error('Phone number must be a valid 10-digit Indian mobile number');
    }
    return true;
  }),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('address.street').optional({ values: 'falsy' }).isString().isLength({ max: 200 }).withMessage('Street must be at most 200 characters'),
  body('address.city').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('City must be at most 100 characters'),
  body('address.state').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('State must be at most 100 characters'),
  body('address.pincode').optional({ values: 'falsy' }).isString().matches(/^[1-9][0-9]{5}$/).withMessage('Pincode must be a valid 6-digit Indian PIN code'),
  body('marketingConsent')
    .optional()
    .isBoolean().withMessage('marketingConsent must be true or false')
    .toBoolean(),
];

const changePassword = [
  passwordField('currentPassword'),
  passwordField('newPassword'),
];

module.exports = { register, login, google, updateProfile, changePassword };
