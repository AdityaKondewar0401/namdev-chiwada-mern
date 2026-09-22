// server/middleware/business.js
//
// B2B account guards. Must run after `protect` (needs req.user).
// loadBusiness attaches req.business for ANY status (pending, rejected,
// suspended, approved) — routes that should work regardless of status
// (e.g. reading your own orders/invoices later) use only this.
// requireApprovedBusiness narrows further to approved-only actions
// (quoting/ordering) and must run AFTER loadBusiness on the same route.

const BusinessAccount = require('../models/BusinessAccount');
const { businessConfig } = require('../config/business');

// Production safeguard (spec Part B1): while B2B_ENABLED is false, every
// business-facing /api/b2b/* route 404s for non-admins — indistinguishable
// from a route that doesn't exist, so the feature stays fully invisible
// pre-launch. Admins always pass, so the business can be configured
// (tiers, catalog, a test account) before flipping the switch. Must run
// after `protect`; GET /config itself never uses this (it must always
// respond so the frontend can read `enabled`).
exports.requireB2BEnabled = (req, res, next) => {
  if (businessConfig.enabled || req.user?.role === 'admin') {
    return next();
  }
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

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
