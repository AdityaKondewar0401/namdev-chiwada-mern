// server/utils/b2bNumbering.js
//
// Single place that owns every sequential B2B document number — order,
// invoice, and credit note — for BOTH the real series and the isTest
// series (spec Part B2). Real and test series use entirely separate
// Counter documents, so a test account can never consume a real number
// (and vice versa): the first real invoice is always NCB/{FY}/00001
// regardless of how much test data exists.
//
//   Real:  B2B-000123        NCB/26-27/00001        NCC/26-27/00001
//   Test:  TST-O-000123      TST/26-27/00001         TSC/26-27/00001
//
// Every function accepts an optional Mongoose `session` so number
// allocation can happen inside the same transaction as the document it
// numbers (required for Phase 4's invoice-issuance transaction and the
// concurrent-issuance test).

const Counter = require('../models/Counter');
const { getFinancialYear, formatDocNumber } = require('./financialYear');

async function nextSeq(counterId, session) {
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );
  return counter.seq;
}

async function nextB2BOrderNumber(isTest, session) {
  const counterId = isTest ? 'b2b_order_test' : 'b2b_order';
  const seq = await nextSeq(counterId, session);
  const prefix = isTest ? 'TST-O-' : 'B2B-';
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

async function nextInvoiceNumber(isTest, date = new Date(), session) {
  const financialYear = getFinancialYear(date);
  const counterId = isTest ? `invoice_test:${financialYear}` : `invoice:${financialYear}`;
  const seq = await nextSeq(counterId, session);
  const prefix = isTest ? 'TST' : 'NCB';
  return { number: formatDocNumber(prefix, financialYear, seq), financialYear };
}

async function nextCreditNoteNumber(isTest, date = new Date(), session) {
  const financialYear = getFinancialYear(date);
  const counterId = isTest ? `credit_note_test:${financialYear}` : `credit_note:${financialYear}`;
  const seq = await nextSeq(counterId, session);
  const prefix = isTest ? 'TSC' : 'NCC';
  return { number: formatDocNumber(prefix, financialYear, seq), financialYear };
}

module.exports = { nextB2BOrderNumber, nextInvoiceNumber, nextCreditNoteNumber };
