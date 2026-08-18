// server/validators/common.js
//
// Small library of reusable, strict field validators shared across every
// domain validator file. Centralizing these means "what counts as a
// valid pincode" (for example) is defined exactly once.
//
// Every helper here CHECKS and REJECTS on mismatch — none of them call
// .escape()/.trim() as a substitute for validation. (`.trim()` used
// during a *check* like `.isEmail()` only affects what's tested, not
// what's stored — express-validator's own body/query no longer mutate
// req.body by default in v7 without an explicit sanitizer call.)

const { param, query, body } = require('express-validator');

// Mongo ObjectId — used for basically every :id / :productId / etc. route
// param. Rejecting a malformed id here means it never reaches Mongoose
// (which would otherwise throw a CastError caught only by the generic
// error handler).
const mongoIdParam = (name) =>
  param(name)
    .exists({ checkFalsy: true }).withMessage(`${name} is required`)
    .bail()
    .isMongoId().withMessage(`${name} must be a valid id`);

const mongoIdBody = (field, { optional = false } = {}) => {
  const chain = body(field);
  if (optional) chain.optional({ values: 'falsy' });
  else chain.exists({ checkFalsy: true }).withMessage(`${field} is required`).bail();
  return chain.isMongoId().withMessage(`${field} must be a valid id`);
};

// Indian 6-digit PIN code — used at checkout and for the Shadowfax
// serviceability check. Deliberately strict: exactly 6 digits, no
// leading zero collapse, no letters.
const indianPincode = (chain) =>
  chain
    .exists({ checkFalsy: true }).withMessage('Pincode is required')
    .bail()
    .isString().withMessage('Pincode must be a string')
    .bail()
    .matches(/^[1-9][0-9]{5}$/).withMessage('Pincode must be a valid 6-digit Indian PIN code');

// Indian mobile number — 10 digits, starting 6-9 (optionally prefixed
// with +91 / 91 / 0, all stripped for the check so any of the common
// input shapes are accepted, but nothing else is).
const indianPhone = (chain) =>
  chain
    .exists({ checkFalsy: true }).withMessage('Phone number is required')
    .bail()
    .isString().withMessage('Phone number must be a string')
    .bail()
    .matches(/^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/).withMessage('Phone number must be a valid 10-digit Indian mobile number');

const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('page must be an integer between 1 and 10000')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be an integer between 1 and 100')
    .toInt(),
];

module.exports = {
  mongoIdParam,
  mongoIdBody,
  indianPincode,
  indianPhone,
  paginationQuery,
};
