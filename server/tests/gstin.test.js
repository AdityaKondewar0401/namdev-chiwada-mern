const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateGstin } = require('../utils/gstin');

test('a well-known valid GSTIN passes format and checksum', () => {
  // Widely-used public example GSTIN (Maharashtra, state code 27).
  const result = validateGstin('27AAPFU0939F1ZV');
  assert.equal(result.valid, true);
  assert.equal(result.stateCode, '27');
});

test('rejects malformed input before even checking the checksum', () => {
  assert.equal(validateGstin('').valid, false);
  assert.equal(validateGstin('not-a-gstin').valid, false);
  assert.equal(validateGstin('27AAPFU0939F1Z').valid, false); // one char short
});

test('rejects a correctly-shaped GSTIN with a wrong checksum digit', () => {
  // Same as the valid example above but with the last character changed —
  // still matches the format regex, must fail on checksum instead.
  const result = validateGstin('27AAPFU0939F1ZA');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'Invalid GSTIN checksum');
});

test('is case-insensitive on input', () => {
  assert.equal(validateGstin('27aapfu0939f1zv').valid, true);
});
