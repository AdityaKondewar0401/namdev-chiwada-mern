// Uses the app's own MONGO_URI to create temporary fixtures, cleaned up
// in `after` regardless of pass/fail — not a seed script.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const BusinessAccount = require('../models/BusinessAccount');
const B2BOrder = require('../models/B2BOrder');
const LedgerEntry = require('../models/LedgerEntry');
const { getOutstanding, getOpenOrderValue, getCreditSummary, shouldHold } = require('../utils/b2bCredit');

let user, prepaidUser, prepaidAccount, creditAccount, order;

before(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const stamp = Date.now();
  // Two separate users — BusinessAccount.user is unique (one account per user).
  user = await User.create({ name: '__TEST__ Credit User', email: `__test-credit-${stamp}@example.com` });
  prepaidUser = await User.create({ name: '__TEST__ Prepaid User', email: `__test-credit-prepaid-${stamp}@example.com` });

  prepaidAccount = await BusinessAccount.create({
    user: prepaidUser._id, businessName: '__TEST__ Prepaid Biz', businessType: 'retailer',
    status: 'approved', paymentTerms: 'prepaid', creditLimit: 0,
  });
  creditAccount = await BusinessAccount.create({
    user: user._id, businessName: '__TEST__ Credit Biz', businessType: 'retailer',
    status: 'approved', paymentTerms: 'net15', creditLimit: 10000,
  });

  order = await B2BOrder.create({
    orderNumber: `TST-O-${Date.now()}`,
    business: creditAccount._id,
    placedBy: user._id,
    items: [{
      catalogItem: new mongoose.Types.ObjectId(), product: new mongoose.Types.ObjectId(),
      name: 'Test Item', size: '200g', unitsPerCase: 24, cases: 2, units: 48, unitPrice: 60, lineTotal: 2880,
    }],
    billing: { businessName: '__TEST__ Credit Biz' },
    shippingAddress: { stateCode: '27' },
    taxMode: 'unregistered',
    totals: { subtotal: 2880, taxTotal: 0, grandTotal: 2880, roundOff: 0, payable: 2880 },
    status: 'placed',
    statusHistory: [{ status: 'placed', by: user._id }],
    paymentTermsSnapshot: 'net15',
  });

  await LedgerEntry.create({
    business: creditAccount._id, date: new Date(), type: 'invoice',
    debit: 4000, credit: 0, recordedBy: user._id,
  });
  await LedgerEntry.create({
    business: creditAccount._id, date: new Date(), type: 'payment',
    debit: 0, credit: 1500, recordedBy: user._id,
  });
});

after(async () => {
  await Promise.all([
    B2BOrder.deleteOne({ _id: order._id }),
    LedgerEntry.deleteMany({ business: creditAccount._id }),
    BusinessAccount.deleteMany({ _id: { $in: [prepaidAccount._id, creditAccount._id] } }),
    User.deleteMany({ _id: { $in: [user._id, prepaidUser._id] } }),
  ]);
  await mongoose.disconnect();
});

test('getOutstanding derives from ledger entries (debit - credit), never a stored field', async () => {
  assert.equal(await getOutstanding(creditAccount._id), 2500); // 4000 - 1500
});

test('getOpenOrderValue sums placed/confirmed/packed orders with no invoice yet', async () => {
  assert.equal(await getOpenOrderValue(creditAccount._id), 2880);
});

test('getCreditSummary combines outstanding, open orders, and credit limit correctly', async () => {
  const summary = await getCreditSummary(creditAccount._id);
  assert.equal(summary.outstanding, 2500);
  assert.equal(summary.openOrderValue, 2880);
  assert.equal(summary.creditLimit, 10000);
  assert.equal(summary.availableCredit, 10000 - 2500 - 2880); // 4620
});

test('shouldHold: prepaid accounts never hold at placement regardless of amount', async () => {
  assert.equal(await shouldHold(prepaidAccount, 999999), false);
});

test('shouldHold: credit account holds once outstanding + open + new order exceeds the limit', async () => {
  // outstanding 2500 + open 2880 + new order = must stay <= 10000 to pass
  assert.equal(await shouldHold(creditAccount, 4000), false); // 2500+2880+4000 = 9380, under limit
  assert.equal(await shouldHold(creditAccount, 5000), true);  // 2500+2880+5000 = 10380, over limit
});
