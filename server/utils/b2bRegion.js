// server/utils/b2bRegion.js
//
// B2B delivery-region restriction (B2B_PORTAL_SPEC.md §0 D14): while the
// business is not GST-registered, inter-state supply of goods generally
// requires GST registration, so B2B orders are restricted to allowed
// states — today just Maharashtra (code 27) — even though a business
// from anywhere may apply and hold an account. Configurable via
// B2B_ALLOWED_STATE_CODES so this widens with zero code changes once
// the business registers for GST (Phase 6).

const { STATE_CODES } = require('./indianStates');

function getAllowedStateCodes() {
  const raw = process.env.B2B_ALLOWED_STATE_CODES || '27';
  return raw.split(',').map((code) => code.trim()).filter(Boolean);
}

function isAllowedDeliveryState(stateCode) {
  return getAllowedStateCodes().includes(String(stateCode || '').trim());
}

function getAllowedStateNames() {
  return getAllowedStateCodes().map((code) => STATE_CODES[code] || code);
}

module.exports = { getAllowedStateCodes, isAllowedDeliveryState, getAllowedStateNames };
