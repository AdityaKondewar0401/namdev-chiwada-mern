// server/utils/b2bCreditNote.js
//
// Full-cancellation credit notes only (spec §5.6, §1 "out of scope:
// partial credit notes"). Two entry points share the same core logic:
//   1. issueCreditNoteForInvoice — a standalone admin action
//      (POST /admin/invoices/:id/credit-note), manages its own transaction.
//   2. applyCreditNoteToInvoice — the same logic but callable INSIDE an
//      already-open session, used when cancelling an invoiced order
//      (confirmed/packed -> cancelled) so the order-status change and
//      the credit note commit as one transaction (spec §6.9).

const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const CreditNote = require('../models/CreditNote');
const LedgerEntry = require('../models/LedgerEntry');
const BusinessAccount = require('../models/BusinessAccount');
const { nextCreditNoteNumber } = require('./b2bNumbering');
const { getTaxMode, documentTitle } = require('./taxMode');

function httpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * @param {import('mongoose').Document} invoice - already-loaded Invoice doc
 * @param {string} reason
 * @param {string} createdByUserId
 * @param {import('mongoose').ClientSession} session - must already be in an open transaction
 */
async function applyCreditNoteToInvoice(invoice, reason, createdByUserId, session) {
  if (invoice.status === 'cancelled') throw httpError('This invoice has already been cancelled.', 400);
  if (invoice.creditNote) throw httpError('A credit note already exists for this invoice.', 400);

  const business = await BusinessAccount.findById(invoice.business).session(session);
  const { number: creditNoteNumber, financialYear } = await nextCreditNoteNumber(business.isTest, new Date(), session);

  const [creditNote] = await CreditNote.create([{
    creditNoteNumber,
    financialYear,
    issuedAt: new Date(),
    documentTitle: documentTitle('credit_note'),
    taxMode: getTaxMode(),
    invoice: invoice._id,
    business: invoice.business,
    reason,
    totals: invoice.totals,
    createdBy: createdByUserId,
  }], { session });

  await LedgerEntry.create([{
    business: invoice.business,
    date: new Date(),
    type: 'credit_note',
    debit: 0,
    credit: invoice.totals.payable,
    refModel: 'CreditNote',
    refId: creditNote._id,
    recordedBy: createdByUserId,
  }], { session });

  invoice.status = 'cancelled';
  invoice.creditNote = creditNote._id;
  await invoice.save({ session });

  return creditNote;
}

async function issueCreditNoteForInvoice(invoiceId, reason, createdByUserId) {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(invoiceId).session(session);
      if (!invoice) throw httpError('Invoice not found', 404);
      result = await applyCreditNoteToInvoice(invoice, reason, createdByUserId, session);
    });
  } finally {
    session.endSession();
  }
  return result;
}

module.exports = { issueCreditNoteForInvoice, applyCreditNoteToInvoice };
