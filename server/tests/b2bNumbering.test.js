// Exercises the real Counter collection against the app's own MONGO_URI.
// Order-number tests use isTest:true (the real, isolated test series —
// safe to consume freely). Invoice/credit-note tests use a deliberately
// far-future date (FY "99-00") so they never touch the CURRENT real FY's
// counter — that one is left untouched here since "the first real
// invoice is NCB/.../00001" is a promise about the production database
// at go-live, not this local one, but there's no reason to spend real
// sequence numbers in local dev either. Every counter this file creates
// is deleted in `after`.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();
const mongoose = require('mongoose');

const Counter = require('../models/Counter');
const { nextB2BOrderNumber, nextInvoiceNumber, nextCreditNoteNumber } = require('../utils/b2bNumbering');

const FAR_FUTURE = new Date(Date.UTC(2099, 5, 15)); // FY "99-00" — never collides with real usage

before(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

after(async () => {
  await Counter.deleteMany({
    _id: { $in: ['b2b_order_test', 'invoice_test:99-00', 'credit_note_test:99-00', 'invoice:99-00', 'credit_note:99-00'] },
  });
  await mongoose.disconnect();
});

test('nextB2BOrderNumber: test series uses the TST-O- prefix and increments', async () => {
  const a = await nextB2BOrderNumber(true);
  const b = await nextB2BOrderNumber(true);
  assert.match(a, /^TST-O-\d{6}$/);
  assert.match(b, /^TST-O-\d{6}$/);
  assert.equal(Number(b.slice(-6)), Number(a.slice(-6)) + 1);
});

test('nextInvoiceNumber: real vs test series are independent counters at the same FY', async () => {
  const real1 = await nextInvoiceNumber(false, FAR_FUTURE);
  const test1 = await nextInvoiceNumber(true, FAR_FUTURE);
  const real2 = await nextInvoiceNumber(false, FAR_FUTURE);

  assert.equal(real1.financialYear, '99-00');
  assert.equal(real1.number, 'NCB/99-00/00001');
  assert.equal(test1.number, 'TST/99-00/00001'); // test series starts at 1 regardless of real series activity
  assert.equal(real2.number, 'NCB/99-00/00002'); // real series unaffected by the test call in between
});

test('nextCreditNoteNumber: uses the NCC/TSC prefixes and stays within 16 characters', async () => {
  const real = await nextCreditNoteNumber(false, FAR_FUTURE);
  const testSeries = await nextCreditNoteNumber(true, FAR_FUTURE);
  assert.equal(real.number, 'NCC/99-00/00001');
  assert.equal(testSeries.number, 'TSC/99-00/00001');
  assert.ok(real.number.length <= 16);
  assert.ok(testSeries.number.length <= 16);
});

test('counters for different document kinds never share a sequence', async () => {
  const order = await nextB2BOrderNumber(true);
  const invoice = await nextInvoiceNumber(true, FAR_FUTURE);
  // Both may coincidentally be small numbers, but they come from
  // completely separate Counter _ids ('b2b_order_test' vs
  // 'invoice_test:99-00') — assert the underlying docs are distinct.
  const counters = await Counter.find({ _id: { $in: ['b2b_order_test', 'invoice_test:99-00'] } });
  assert.equal(counters.length, 2);
  assert.ok(order); // sanity — value already asserted in shape by earlier tests
  assert.ok(invoice.number);
});
