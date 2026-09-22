const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getFinancialYear, getFinancialYearRange, formatDocNumber } = require('../utils/financialYear');

test('FY boundary: 31 Mar 23:59 IST is still the earlier FY', () => {
  // 31 Mar 2027 23:59 IST == 31 Mar 2027 18:29 UTC
  const justBeforeMidnightIST = new Date(Date.UTC(2027, 2, 31, 18, 29));
  assert.equal(getFinancialYear(justBeforeMidnightIST), '26-27');
});

test('FY boundary: 1 Apr 00:00 IST is already the new FY', () => {
  // 1 Apr 2027 00:00 IST == 31 Mar 2027 18:30 UTC
  const justAfterMidnightIST = new Date(Date.UTC(2027, 2, 31, 18, 30));
  assert.equal(getFinancialYear(justAfterMidnightIST), '27-28');
});

test('mid-year dates resolve to the expected FY', () => {
  assert.equal(getFinancialYear(new Date(Date.UTC(2026, 8, 15))), '26-27'); // Sept 2026
  assert.equal(getFinancialYear(new Date(Date.UTC(2027, 0, 15))), '26-27'); // Jan 2027
});

test('getFinancialYearRange round-trips with getFinancialYear at both edges', () => {
  const { start, end } = getFinancialYearRange('26-27');
  assert.equal(getFinancialYear(new Date(start.getTime())), '26-27');
  assert.equal(getFinancialYear(new Date(end.getTime())), '26-27');
  assert.equal(getFinancialYear(new Date(start.getTime() - 1)), '25-26'); // 1ms before start
  assert.equal(getFinancialYear(new Date(end.getTime() + 1)), '27-28'); // 1ms after end
});

test('formatDocNumber builds the expected shape and stays within 16 characters', () => {
  assert.equal(formatDocNumber('NCB', '26-27', 1), 'NCB/26-27/00001');
  assert.equal(formatDocNumber('NCC', '26-27', 42), 'NCC/26-27/00042');
  // Spec requirement is "<= 16 characters", not exactly 16 — a 3-char
  // prefix with this format is actually 15 ("NCB/26-27/00001").
  assert.ok(formatDocNumber('NCB', '26-27', 1).length <= 16);
});

test('formatDocNumber throws rather than silently truncate if a sequence would exceed 16 chars', () => {
  assert.throws(() => formatDocNumber('NCB', '26-27', 123456789), /exceeds 16 characters/);
});
