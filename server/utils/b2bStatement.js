// server/utils/b2bStatement.js
//
// Shared "build a statement" logic for one business account — opening
// balance (derived from every entry before the range, never a stored
// field), entries within the range with a running balance, and the
// closing balance. Reused by both the business-facing ledger endpoint
// (own account only) and the admin one (any account).

const LedgerEntry = require('../models/LedgerEntry');
const { round2 } = require('./money');

async function buildStatement(businessId, { from, to } = {}) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  let openingBalance = 0;
  if (fromDate) {
    const [result] = await LedgerEntry.aggregate([
      { $match: { business: businessId, date: { $lt: fromDate } } },
      { $group: { _id: null, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
    ]);
    openingBalance = result ? round2(result.debit - result.credit) : 0;
  }

  const filter = { business: businessId };
  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = fromDate;
    if (toDate) filter.date.$lte = toDate;
  }
  const entries = await LedgerEntry.find(filter).sort({ date: 1, _id: 1 });

  let running = openingBalance;
  const entriesWithBalance = entries.map((e) => {
    running = round2(running + e.debit - e.credit);
    return { ...e.toObject(), runningBalance: running };
  });

  return { openingBalance, entries: entriesWithBalance, closingBalance: running };
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function statementToCsv(statement) {
  const rows = [['Date', 'Type', 'Reference', 'Debit', 'Credit', 'Balance', 'Note']];
  rows.push(['Opening balance', '', '', '', '', statement.openingBalance, '']);
  for (const e of statement.entries) {
    rows.push([
      new Date(e.date).toISOString().slice(0, 10),
      e.type, e.reference || '', e.debit || '', e.credit || '', e.runningBalance, e.note || '',
    ]);
  }
  rows.push(['Closing balance', '', '', '', '', statement.closingBalance, '']);
  return rows.map((r) => r.map(csvEscape).join(',')).join('\n');
}

module.exports = { buildStatement, statementToCsv };
