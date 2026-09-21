// server/utils/turnover.js
//
// Financial-year turnover watch (spec §6.12) — informational only,
// against GST_REGISTRATION_THRESHOLD. Read-only queries on the retail
// Order collection; never writes to it, never changes retail behaviour.
// isTest B2B accounts are excluded from the wholesale figure (spec
// Part B2) — test data must never inflate the real turnover watch.

const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const CreditNote = require('../models/CreditNote');
const BusinessAccount = require('../models/BusinessAccount');
const { getFinancialYearRange } = require('./financialYear');
const { round2 } = require('./money');
const { businessConfig } = require('../config/business');

async function getRetailTurnover(start, end) {
  const [result] = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' },
        $or: [
          { paymentMethod: 'COD', status: 'delivered' },
          { paymentMethod: 'ONLINE', paymentStatus: 'paid' },
        ],
      },
    },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  return result ? round2(result.total) : 0;
}

async function getWholesaleTurnover(start, end) {
  const testAccountIds = await BusinessAccount.find({ isTest: true }).distinct('_id');

  const [invoiceResult] = await Invoice.aggregate([
    { $match: { issuedAt: { $gte: start, $lte: end }, business: { $nin: testAccountIds } } },
    { $group: { _id: null, total: { $sum: '$totals.payable' } } },
  ]);
  const [creditResult] = await CreditNote.aggregate([
    { $match: { issuedAt: { $gte: start, $lte: end }, business: { $nin: testAccountIds } } },
    { $group: { _id: null, total: { $sum: '$totals.payable' } } },
  ]);

  const invoiced = invoiceResult ? invoiceResult.total : 0;
  const credited = creditResult ? creditResult.total : 0;
  return round2(invoiced - credited);
}

/**
 * @param {string} fy e.g. "26-27"
 */
async function getFinancialYearTurnover(fy) {
  const { start, end } = getFinancialYearRange(fy);

  const [retail, wholesale] = await Promise.all([
    getRetailTurnover(start, end),
    getWholesaleTurnover(start, end),
  ]);

  const total = round2(retail + wholesale);
  const threshold = businessConfig.gstRegistrationThreshold;
  const percentOfThreshold = threshold > 0 ? round2((total / threshold) * 100) : 0;

  return { retail, wholesale, total, threshold, percentOfThreshold };
}

module.exports = { getFinancialYearTurnover };
