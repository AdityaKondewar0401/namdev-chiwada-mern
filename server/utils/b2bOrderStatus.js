// server/utils/b2bOrderStatus.js
//
// The B2B order state machine (docs/B2B_PORTAL_SPEC.md §6.9) as a pure
// allowed/forbidden transition graph - deliberately just the graph, not
// the side effects (credit-hold blocking, auto-invoice-on-dispatch,
// credit-note-on-cancel-after-invoicing all happen in the controller,
// which consults this module before doing anything else). Kept pure and
// DB-free so it stays trivially unit-testable.

const TRANSITIONS = {
  placed: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
  rejected: [],
};

const ALL_STATUSES = Object.keys(TRANSITIONS);

// Statuses from which cancelling requires a credit note if the order is
// already invoiced ("confirmed / packed -> cancelled (admin; if
// invoiced, a credit note is created in the same transaction)" - spec
// §6.9). `placed` can never be invoiced yet, so cancelling from there
// never needs one.
const CANCEL_REQUIRES_CREDIT_NOTE_IF_INVOICED = ['confirmed', 'packed'];

// Statuses that require a reason string from the caller.
const REASON_REQUIRED_FOR = ['rejected', 'cancelled'];

function isTransitionAllowed(from, to) {
  return Array.isArray(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
}

function getAllowedNextStatuses(from) {
  return TRANSITIONS[from] || [];
}

module.exports = {
  ALL_STATUSES,
  isTransitionAllowed,
  getAllowedNextStatuses,
  CANCEL_REQUIRES_CREDIT_NOTE_IF_INVOICED,
  REASON_REQUIRED_FOR,
};
