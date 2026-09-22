const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  isTransitionAllowed,
  getAllowedNextStatuses,
  ALL_STATUSES,
  CANCEL_REQUIRES_CREDIT_NOTE_IF_INVOICED,
  REASON_REQUIRED_FOR,
} = require('../utils/b2bOrderStatus');

test('allowed transitions match the spec §6.9 diagram', () => {
  assert.equal(isTransitionAllowed('placed', 'confirmed'), true);
  assert.equal(isTransitionAllowed('placed', 'rejected'), true);
  assert.equal(isTransitionAllowed('placed', 'cancelled'), true);
  assert.equal(isTransitionAllowed('confirmed', 'packed'), true);
  assert.equal(isTransitionAllowed('confirmed', 'cancelled'), true);
  assert.equal(isTransitionAllowed('packed', 'dispatched'), true);
  assert.equal(isTransitionAllowed('packed', 'cancelled'), true);
  assert.equal(isTransitionAllowed('dispatched', 'delivered'), true);
});

test('forbidden transitions are rejected', () => {
  assert.equal(isTransitionAllowed('placed', 'packed'), false); // skips confirmed
  assert.equal(isTransitionAllowed('placed', 'dispatched'), false);
  assert.equal(isTransitionAllowed('placed', 'delivered'), false);
  assert.equal(isTransitionAllowed('confirmed', 'dispatched'), false); // skips packed
  assert.equal(isTransitionAllowed('dispatched', 'cancelled'), false); // too late to cancel
  assert.equal(isTransitionAllowed('delivered', 'cancelled'), false);
  assert.equal(isTransitionAllowed('cancelled', 'placed'), false); // terminal
  assert.equal(isTransitionAllowed('rejected', 'placed'), false); // terminal
});

test('getAllowedNextStatuses matches isTransitionAllowed for every status', () => {
  for (const status of ALL_STATUSES) {
    const next = getAllowedNextStatuses(status);
    for (const candidate of ALL_STATUSES) {
      assert.equal(isTransitionAllowed(status, candidate), next.includes(candidate));
    }
  }
});

test('an unknown "from" status has no allowed transitions', () => {
  assert.deepEqual(getAllowedNextStatuses('not-a-real-status'), []);
  assert.equal(isTransitionAllowed('not-a-real-status', 'placed'), false);
});

test('credit-note-on-cancel applies only to confirmed/packed, not placed', () => {
  assert.deepEqual(CANCEL_REQUIRES_CREDIT_NOTE_IF_INVOICED, ['confirmed', 'packed']);
});

test('reject and cancel require a reason; nothing else does', () => {
  assert.deepEqual(REASON_REQUIRED_FOR, ['rejected', 'cancelled']);
});
