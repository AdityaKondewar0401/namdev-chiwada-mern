// server/middleware/validate.js
//
// The single choke point every validation chain runs through. Its only
// job is: if any express-validator rule failed, REJECT the request with
// 400 and tell the client exactly which field(s) and why. It never
// mutates, escapes, or "cleans up" req.body/query/params and lets the
// request continue — a request that doesn't match its schema does not
// reach the controller, full stop.
//
// Usage in a route:
//   router.post('/thing', someValidatorArray, validate, controller.thing);
//
// `someValidatorArray` is an array of express-validator chains (from
// server/validators/*.js) that only CHECK (isEmail, isInt, isLength,
// matches, isIn, ...) — they don't call .escape()/.trim() to silently
// rewrite bad input into something acceptable.

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
}

module.exports = { validate };
