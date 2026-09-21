const { test } = require('node:test');
const assert = require('node:assert/strict');
const { round2, roundToRupee, amountInWordsINR } = require('../utils/money');

test('round2 fixes floating-point drift', () => {
  assert.equal(round2(1.005), 1.01); // the classic case plain (1.005*100)/100 gets wrong
  assert.equal(round2(89 * 2), 178);
  assert.equal(round2(NaN), 0);
  assert.equal(round2(undefined), 0);
});

test('roundToRupee returns the rounded amount and a signed round-off', () => {
  assert.deepEqual(roundToRupee(227.4), { rounded: 227, roundOff: -0.4 });
  assert.deepEqual(roundToRupee(227.6), { rounded: 228, roundOff: 0.4 });
  assert.deepEqual(roundToRupee(500), { rounded: 500, roundOff: 0 });
});

test('amountInWordsINR uses Indian lakh/crore numbering, with paise when present', () => {
  assert.equal(amountInWordsINR(0), 'Rupees Zero Only');
  assert.equal(amountInWordsINR(500), 'Rupees Five Hundred Only');
  assert.equal(
    amountInWordsINR(123456.5),
    'Rupees One Lakh Twenty-Three Thousand Four Hundred Fifty-Six and Fifty Paise Only'
  );
  assert.equal(
    amountInWordsINR(10000000),
    'Rupees One Crore Only'
  );
});
