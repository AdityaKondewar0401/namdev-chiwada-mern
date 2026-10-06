const Invoice = require('../models/Invoice');
const { getFinancialYear, formatInvoiceNumber } = require('./invoiceUtils');

const MAX_ATTEMPTS = 25;
const backoff = (attempt) => new Promise((resolve) => setTimeout(resolve, Math.random() * 15 * attempt));

const isNumberCollision = (err) =>
  err?.code === 11000 && Boolean(err.keyPattern?.seq || err.keyPattern?.invoiceNumber);

// Next number = highest number in the financial year + 1. The unique
// (fy, seq) index turns a concurrent race into a duplicate-key error that is
// simply retried, so numbers are gapless without needing a transaction (a
// number only exists if its invoice does, and invoices are never deleted).
async function createInvoiceWithNumber(fields) {
  const fy = getFinancialYear(fields.issuedAt);
  for (let attempt = 1; ; attempt += 1) {
    const last = await Invoice.findOne({ fy }).sort({ seq: -1 }).select('seq').lean();
    const seq = (last?.seq || 0) + 1;
    try {
      return await Invoice.create({ ...fields, fy, seq, invoiceNumber: formatInvoiceNumber(fy, seq) });
    } catch (err) {
      if (!isNumberCollision(err) || attempt >= MAX_ATTEMPTS) throw err;
      await backoff(attempt);
    }
  }
}

module.exports = { createInvoiceWithNumber };
