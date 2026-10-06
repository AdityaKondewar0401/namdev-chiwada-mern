const test = require('node:test');
const assert = require('node:assert/strict');
const u = require('../utils/invoiceUtils');

test('financial year switches at midnight IST on 1 April', () => {
  assert.equal(u.getFinancialYear(new Date('2027-03-31T18:29:59Z')), '26-27');
  assert.equal(u.getFinancialYear(new Date('2027-03-31T18:30:00Z')), '27-28');
  assert.equal(u.getFinancialYear(new Date('2026-10-05T10:00:00Z')), '26-27');
  assert.equal(u.getFinancialYear(new Date('2099-06-01T00:00:00Z')), '99-00');
});

test('financial year starts at 1 April 00:00 IST', () => {
  assert.equal(u.getFinancialYearStart(new Date('2026-10-05T10:00:00Z')).toISOString(), '2026-03-31T18:30:00.000Z');
});

test('istDateKey follows the IST calendar day', () => {
  assert.equal(u.istDateKey(new Date('2026-10-05T19:00:00Z')), '2026-10-06');
  assert.equal(u.istDateKey(new Date('2026-10-05T18:29:00Z')), '2026-10-05');
});

test('invoice numbers and file names', () => {
  assert.equal(u.formatInvoiceNumber('26-27', 1), 'NC/26-27/0001');
  assert.equal(u.formatInvoiceNumber('26-27', 12345), 'NC/26-27/12345');
  assert.equal(u.invoiceFileName('NC/26-27/0001'), 'Namdev-Chiwda-Invoice-NC-26-27-0001.pdf');
});

test('amount in words uses Indian grouping and paise', () => {
  assert.equal(u.amountInWords(2225), 'Rupees Two Thousand Two Hundred Twenty Five Only');
  assert.equal(u.amountInWords(449.5), 'Rupees Four Hundred Forty Nine and Fifty Paise Only');
  assert.equal(u.amountInWords(12345678), 'Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only');
  assert.equal(u.amountInWords(0), 'Rupees Zero Only');
});

test('formatINR uses Indian digit grouping with two decimals', () => {
  assert.equal(u.formatINR(123456.5), '₹1,23,456.50');
  assert.equal(u.formatINR(0.1 + 0.2), '₹0.30');
});

test('computeTotals handles flat and percent discounts, caps them, and adds delivery', () => {
  const items = [{ price: 89, qty: 3 }, { price: 84.5, qty: 2 }];

  let t = u.computeTotals(items, { type: 'flat', value: 20 }, 49);
  assert.deepEqual([t.subtotal, t.discount, t.shipping, t.total], [436, 20, 49, 465]);
  assert.equal(t.lines[1].amount, 169);

  t = u.computeTotals(items, { type: 'percent', value: 10 }, 0);
  assert.deepEqual([t.discount, t.total], [43.6, 392.4]);

  t = u.computeTotals(items, { type: 'flat', value: 10000 }, 0);
  assert.deepEqual([t.discount, t.total], [436, 0]);

  t = u.computeTotals(items, { type: 'percent', value: 250 }, 0);
  assert.equal(t.discount, 436);

  t = u.computeTotals(items);
  assert.deepEqual([t.discount, t.shipping, t.total], [0, 0, 436]);
});
