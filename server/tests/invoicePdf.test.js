const test = require('node:test');
const assert = require('node:assert/strict');
const { planPages, renderInvoicePdf } = require('../services/invoicePdf');
const { amountInWords } = require('../utils/invoiceUtils');

test('planPages keeps a short invoice on one page', () => {
  assert.deepEqual(
    planPages({ firstCapacity: 500, nextCapacity: 700, rowHeights: [40, 40], summaryHeight: 200 }),
    [{ start: 0, end: 2 }]
  );
});

test('planPages breaks rows across pages', () => {
  assert.deepEqual(
    planPages({ firstCapacity: 100, nextCapacity: 100, rowHeights: [40, 40, 40, 40, 40], summaryHeight: 10 }),
    [{ start: 0, end: 2 }, { start: 2, end: 4 }, { start: 4, end: 5 }]
  );
});

test('planPages moves the last row with the totals so they never stand alone', () => {
  assert.deepEqual(
    planPages({ firstCapacity: 100, nextCapacity: 100, rowHeights: [40, 40], summaryHeight: 50 }),
    [{ start: 0, end: 1 }, { start: 1, end: 2 }]
  );
});

test('planPages puts the totals on their own page only when one row fills a page', () => {
  assert.deepEqual(
    planPages({ firstCapacity: 100, nextCapacity: 100, rowHeights: [90], summaryHeight: 50 }),
    [{ start: 0, end: 1 }, { start: 1, end: 1 }]
  );
});

function view(lineCount) {
  const lines = Array.from({ length: lineCount }, (_, i) => ({ name: `Namdev Chiwda ${i + 1}`, size: '200g', price: 89, qty: 2, amount: 178 }));
  const total = 178 * lineCount;
  return {
    number: 'NC/26-27/0001',
    issuedOn: '5 October 2026',
    customer: { name: 'Test Customer', phone: '9876543210', email: '', addressLines: ['Solapur'] },
    lines,
    units: lineCount * 2,
    subtotal: total,
    shipping: 0,
    showShipping: true,
    shippingLabel: 'Shipping',
    discount: 0,
    discountLabel: 'Discount',
    total,
    paymentMethod: 'Online payment',
    paymentRef: '',
    statusLabel: 'Paid',
    statusTone: 'paid',
    cancelled: false,
    totalLabel: 'Total paid',
    amountInWords: amountInWords(total),
    notes: '',
  };
}

const pageCount = (pdf) => (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

test('renders a one-page A4 PDF for a small invoice', async () => {
  const pdf = await renderInvoicePdf(view(2));
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.equal(pageCount(pdf), 1);
  assert.ok(pdf.length < 200 * 1024, `PDF is ${pdf.length} bytes`);
});

test('renders a multi-page PDF for a long invoice', async () => {
  const pdf = await renderInvoicePdf(view(40));
  assert.ok(pageCount(pdf) >= 3, `expected at least 3 pages, got ${pageCount(pdf)}`);
});
