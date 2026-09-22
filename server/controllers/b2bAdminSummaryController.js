// server/controllers/b2bAdminSummaryController.js
//
// GET /api/b2b/admin/summary — pending applications, orders by status,
// total outstanding, aging buckets, top outstanding accounts, FY
// turnover vs GST threshold (spec §7.2). isTest accounts are excluded
// from outstanding/aging/turnover (spec Part B2) — surfaced separately
// so test data never distorts the real picture.

const BusinessAccount = require('../models/BusinessAccount');
const B2BOrder = require('../models/B2BOrder');
const { getOutstanding, getOverdueSummary } = require('../utils/b2bCredit');
const { getFinancialYearTurnover } = require('../utils/turnover');
const { getFinancialYear } = require('../utils/financialYear');
const { round2 } = require('../utils/money');

function agingBucket(days) {
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

exports.getSummary = async (req, res, next) => {
  try {
    const [pendingApplications, ordersByStatusAgg, approvedAccounts, testAccountCount] = await Promise.all([
      BusinessAccount.countDocuments({ status: 'pending' }),
      B2BOrder.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      BusinessAccount.find({ status: 'approved', isTest: { $ne: true } }).select('businessName'),
      BusinessAccount.countDocuments({ isTest: true }),
    ]);

    const ordersByStatus = {};
    ordersByStatusAgg.forEach((o) => { ordersByStatus[o._id] = o.count; });

    let totalOutstanding = 0;
    const agingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    const accountOutstandings = [];

    for (const account of approvedAccounts) {
      const [outstanding, overdue] = await Promise.all([
        getOutstanding(account._id),
        getOverdueSummary(account._id),
      ]);
      totalOutstanding = round2(totalOutstanding + outstanding);
      if (outstanding > 0) {
        accountOutstandings.push({ business: account._id, businessName: account.businessName, outstanding });
      }
      if (overdue.overdueAmount > 0) {
        const bucket = agingBucket(overdue.oldestOverdueDays);
        agingBuckets[bucket] = round2(agingBuckets[bucket] + overdue.overdueAmount);
      }
    }

    accountOutstandings.sort((a, b) => b.outstanding - a.outstanding);

    const turnover = await getFinancialYearTurnover(getFinancialYear());

    res.json({
      success: true,
      summary: {
        pendingApplications,
        ordersByStatus,
        totalOutstanding,
        agingBuckets,
        topOutstandingAccounts: accountOutstandings.slice(0, 10),
        turnover,
        testAccountCount,
      },
    });
  } catch (err) {
    next(err);
  }
};
