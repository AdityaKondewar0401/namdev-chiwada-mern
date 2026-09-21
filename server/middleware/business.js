// server/middleware/business.js
//
// B2B account guards. Must run after `protect` (needs req.user).
// loadBusiness attaches req.business for ANY status (pending, rejected,
// suspended, approved) — routes that should work regardless of status
// (e.g. reading your own orders/invoices later) use only this.
// requireApprovedBusiness narrows further to approved-only actions
// (quoting/ordering) and must run AFTER loadBusiness on the same route.

const BusinessAccount = require('../models/BusinessAccount');

exports.loadBusiness = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No business account',
      });
    }
    req.business = business;
    next();
  } catch (err) {
    next(err);
  }
};

exports.requireApprovedBusiness = (req, res, next) => {
  if (req.business && req.business.status === 'approved') {
    return next();
  }
  res.status(403).json({
    success: false,
    message: 'Your business account is not approved.',
  });
};
