// server/utils/b2bCredit.js
//
// Credit-limit and overdue calculations (docs/B2B_PORTAL_SPEC.md §6.8).
// "Outstanding" is always DERIVED from LedgerEntry (sum(debit) -
// sum(credit)) - see that model's header comment - never a stored
// running-balance field.

const LedgerEntry = require('../models/LedgerEntry');
const Invoice = require('../models/Invoice');
const B2BOrder = require('../models/B2BOrder');
const BusinessAccount = require('../models/BusinessAccount');

function round2ish(n) {
  return Math.round(n * 100) / 100;
}

async function getOutstanding(businessId) {
  const [result] = await LedgerEntry.aggregate([
    { $match: { business: businessId } },
    { $group: { _id: null, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
  ]);
  if (!result) return 0;
  return round2ish(result.debit - result.credit);
}

async function getOpenOrderValue(businessId) {
  // Orders that exist but have not yet been invoiced - placed,
  // confirmed, or packed. Once invoiced (typically at/after dispatch),
  // the value moves into `outstanding` via the invoice's own ledger
  // debit instead, so it's never counted twice.
  const [result] = await B2BOrder.aggregate([
    { $match: { business: businessId, status: { $in: ['placed', 'confirmed', 'packed'] }, invoice: null } },
    { $group: { _id: null, total: { $sum: '$totals.payable' } } },
  ]);
  return result ? result.total : 0;
}

/**
 * FIFO allocation: walk invoices oldest-first, netting off available
 * credit (payments/credit-notes/adjustments) in date order, until the
 * pool runs out - whatever invoice total is left uncovered, past its
 * due date, counts as overdue.
 */
async function getOverdueSummary(businessId) {
  const now = new Date();

  const [invoices, creditEntries] = await Promise.all([
    Invoice.find({ business: businessId, status: 'issued' }).sort({ issuedAt: 1 }),
    LedgerEntry.find({ business: businessId, credit: { $gt: 0 } }).sort({ date: 1 }),
  ]);

  let availableCredit = creditEntries.reduce((sum, e) => sum + e.credit, 0);

  let overdueAmount = 0;
  let oldestOverdueDays = 0;

  for (const invoice of invoices) {
    let remaining = invoice.totals.payable;
    if (availableCredit > 0) {
      const applied = Math.min(availableCredit, remaining);
      remaining -= applied;
      availableCredit -= applied;
    }
    if (remaining > 0 && invoice.dueDate < now) {
      overdueAmount = round2ish(overdueAmount + remaining);
      const days = Math.floor((now - invoice.dueDate) / (1000 * 60 * 60 * 24));
      oldestOverdueDays = Math.max(oldestOverdueDays, days);
    }
  }

  return { overdueAmount, oldestOverdueDays };
}

async function getCreditSummary(businessId) {
  const [outstanding, openOrderValue, overdue, business] = await Promise.all([
    getOutstanding(businessId),
    getOpenOrderValue(businessId),
    getOverdueSummary(businessId),
    BusinessAccount.findById(businessId).select('creditLimit'),
  ]);

  const creditLimit = business?.creditLimit || 0;
  const availableCredit = round2ish(creditLimit - outstanding - openOrderValue);

  return {
    outstanding,
    openOrderValue,
    creditLimit,
    availableCredit,
    overdueAmount: overdue.overdueAmount,
    oldestOverdueDays: overdue.oldestOverdueDays,
  };
}

/**
 * @param {{ _id: any, paymentTerms: string, creditLimit: number }} account
 * @param {number} orderPayable
 */
async function shouldHold(account, orderPayable) {
  // Prepaid never holds at placement - checked instead at dispatch time
  // (spec §6.9), since a prepaid order should already be paid before it
  // ships, not before it's even confirmed.
  if (account.paymentTerms === 'prepaid') return false;

  const [outstanding, openOrderValue, overdue] = await Promise.all([
    getOutstanding(account._id),
    getOpenOrderValue(account._id),
    getOverdueSummary(account._id),
  ]);

  if (overdue.oldestOverdueDays > 30) return true;
  return round2ish(outstanding + openOrderValue + orderPayable) > (account.creditLimit || 0);
}

module.exports = { getCreditSummary, shouldHold, getOutstanding, getOpenOrderValue, getOverdueSummary };
