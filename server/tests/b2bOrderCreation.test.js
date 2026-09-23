// Transactional tests for utils/b2bOrderCreation.js — the advance-payment
// verification + order-creation core behind POST /api/b2b/orders. Uses a
// real replica set (see tests/helpers/memoryReplSet.js) since
// createB2BOrderForUser writes the order + its advance-payment ledger
// entry inside one real Mongo transaction, the same reason
// b2bInvoicing.test.js needs one.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { startReplSet, stopReplSet } = require('./helpers/memoryReplSet');

const User = require('../models/User');
const BusinessAccount = require('../models/BusinessAccount');
const B2BOrder = require('../models/B2BOrder');
const LedgerEntry = require('../models/LedgerEntry');
const Product = require('../models/Product');
const PriceTier = require('../models/PriceTier');
const WholesaleCatalogItem = require('../models/WholesaleCatalogItem');
const VerifiedPayment = require('../models/VerifiedPayment');

const { createB2BOrderForUser } = require('../utils/b2bOrderCreation');
const { REMAINDER_DUE_DAYS } = require('../utils/b2bInvoicing');

let product, tier, catalogItem;

// 6 cases x 24 units/case x ₹70/unit = ₹10,080 subtotal/payable (tax 0 in
// unregistered mode) — comfortably clears both the item's MOQ (2 cases)
// and a real ₹5,000 default min order value, regardless of what
// B2B_MIN_ORDER_VALUE happens to be in whatever .env runs this file.
const CASES = 6;
const EXPECTED_PAYABLE = 10080;
const ADDR = { line1: 'Test Line 1', city: 'Pune', state: 'Maharashtra', stateCode: '27', pincode: '411001' };

function rzpOrderId() {
  return `order_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function makeBusiness(overrides = {}) {
  const user = await User.create({ name: '__TEST__ OC User', email: `oc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com` });
  const business = await BusinessAccount.create({
    user: user._id, businessName: '__TEST__ Order Creation Biz', businessType: 'retailer',
    status: 'approved', creditLimit: 50000, tier: tier._id, billingAddress: ADDR,
    advancePercent: 100,
    ...overrides,
  });
  return { user, business };
}

async function cleanup({ user, business, payment }) {
  await Promise.all([
    B2BOrder.deleteMany({ business: business._id }),
    LedgerEntry.deleteMany({ business: business._id }),
    payment ? VerifiedPayment.deleteOne({ _id: payment._id }) : Promise.resolve(),
    BusinessAccount.deleteOne({ _id: business._id }),
    User.deleteOne({ _id: user._id }),
  ]);
}

before(async () => {
  await startReplSet();

  product = await Product.create({
    name: '__TEST__ Order Creation Product',
    slug: `__test-order-creation-${Date.now()}`,
    desc: 'Fixture for tests/b2bOrderCreation.test.js',
    category: 'mild', price: 89, weight: '200g',
    img: 'https://example.com/test.jpg', inStock: true,
    sizes: [{ weight: '200g', price: 89 }],
  });
  tier = await PriceTier.create({ name: '__TEST__ OC Tier', code: `TESTOC${Date.now()}`, discountPercent: 0 });
  catalogItem = await WholesaleCatalogItem.create({
    product: product._id, size: '200g', unitsPerCase: 24, moqCases: 2, basePricePerUnit: 70, active: true,
  });
});

after(async () => {
  await Promise.all([
    Product.deleteOne({ _id: product._id }),
    PriceTier.deleteOne({ _id: tier._id }),
    WholesaleCatalogItem.deleteOne({ _id: catalogItem._id }),
  ]);
  await stopReplSet();
});

test('createB2BOrderForUser: a 0%-advance account places directly, no payment required', async () => {
  const { user, business } = await makeBusiness({ advancePercent: 0 });
  try {
    const result = await createB2BOrderForUser({
      businessId: business._id, userId: user._id,
      items: [{ catalogItemId: catalogItem._id, cases: CASES }],
    });

    assert.equal(result.success, true);
    assert.equal(result.order.advancePercent, 0);
    assert.equal(result.order.advanceAmount, 0);
    assert.equal(result.order.remainingAmount, EXPECTED_PAYABLE);
    assert.equal(result.order.razorpayOrderId, undefined);

    const ledgerCount = await LedgerEntry.countDocuments({ business: business._id });
    assert.equal(ledgerCount, 0, 'a 0%-advance order should write no ledger entry at placement');
  } finally {
    await cleanup({ user, business });
  }
});

test('createB2BOrderForUser: advance payment creates the order + a matching ledger credit, and consumes the VerifiedPayment', async () => {
  const { user, business } = await makeBusiness({ advancePercent: 50 });
  const advanceAmount = 5040; // 50% of 10,080
  const payment = await VerifiedPayment.create({
    user: user._id, razorpayOrderId: rzpOrderId(), razorpayPaymentId: `pay_test_${Date.now()}`,
    amount: Math.round(advanceAmount * 100), verified: true,
  });
  try {
    const result = await createB2BOrderForUser({
      businessId: business._id, userId: user._id,
      items: [{ catalogItemId: catalogItem._id, cases: CASES }],
      razorpayOrderId: payment.razorpayOrderId,
    });

    assert.equal(result.success, true);
    assert.equal(result.order.advancePercent, 50);
    assert.equal(result.order.advanceAmount, advanceAmount);
    assert.equal(result.order.remainingAmount, EXPECTED_PAYABLE - advanceAmount);
    assert.equal(result.order.razorpayOrderId, payment.razorpayOrderId);
    assert.equal(result.order.razorpayPaymentId, payment.razorpayPaymentId);

    const ledgerEntry = await LedgerEntry.findOne({ refModel: 'B2BOrder', refId: result.order._id });
    assert.ok(ledgerEntry, 'expected a LedgerEntry for the advance payment');
    assert.equal(ledgerEntry.credit, advanceAmount);
    assert.equal(ledgerEntry.debit, 0);
    assert.equal(ledgerEntry.method, 'razorpay');
    assert.equal(ledgerEntry.reference, payment.razorpayPaymentId);

    const reloadedPayment = await VerifiedPayment.findById(payment._id);
    assert.ok(reloadedPayment.consumedAt, 'expected the payment to be marked consumed');
  } finally {
    await cleanup({ user, business, payment });
  }
});

test('createB2BOrderForUser: rejects reusing an already-consumed payment (double-spend)', async () => {
  const { user, business } = await makeBusiness({ advancePercent: 50 });
  const payment = await VerifiedPayment.create({
    user: user._id, razorpayOrderId: rzpOrderId(),
    amount: Math.round(5040 * 100), verified: true, consumedAt: new Date(),
  });
  try {
    const result = await createB2BOrderForUser({
      businessId: business._id, userId: user._id,
      items: [{ catalogItemId: catalogItem._id, cases: CASES }],
      razorpayOrderId: payment.razorpayOrderId,
    });
    assert.equal(result.success, false);
    assert.match(result.message, /verify this payment/i);
  } finally {
    await cleanup({ user, business, payment });
  }
});

test('createB2BOrderForUser: rejects when the verified amount does not match the recomputed advance', async () => {
  const { user, business } = await makeBusiness({ advancePercent: 50 });
  // Paid for a different (wrong) advance amount than 50% of 10,080.
  const payment = await VerifiedPayment.create({
    user: user._id, razorpayOrderId: rzpOrderId(),
    amount: 100000, verified: true,
  });
  try {
    const result = await createB2BOrderForUser({
      businessId: business._id, userId: user._id,
      items: [{ catalogItemId: catalogItem._id, cases: CASES }],
      razorpayOrderId: payment.razorpayOrderId,
    });
    assert.equal(result.success, false);
    assert.match(result.message, /pricing changed/i);

    const reloadedPayment = await VerifiedPayment.findById(payment._id);
    assert.equal(reloadedPayment.consumedAt, null, 'a rejected order must not consume the payment');
  } finally {
    await cleanup({ user, business, payment });
  }
});

test('createB2BOrderForUser: rejects a nonzero-advance order with no razorpayOrderId', async () => {
  const { user, business } = await makeBusiness({ advancePercent: 50 });
  try {
    const result = await createB2BOrderForUser({
      businessId: business._id, userId: user._id,
      items: [{ catalogItemId: catalogItem._id, cases: CASES }],
    });
    assert.equal(result.success, false);
    assert.match(result.message, /must be completed/i);
  } finally {
    await cleanup({ user, business });
  }
});

test('createB2BOrderForUser: remainingDueDate is 14 days out, anchored to order placement', async () => {
  const { user, business } = await makeBusiness({ advancePercent: 0 });
  try {
    const result = await createB2BOrderForUser({
      businessId: business._id, userId: user._id,
      items: [{ catalogItemId: catalogItem._id, cases: CASES }],
    });
    assert.equal(result.success, true);
    // remainingDueDate is computed from Date.now() before the write
    // transaction opens; order.createdAt is stamped by Mongoose a few ms
    // later inside it (nextB2BOrderNumber's own DB round-trip happens in
    // between) — two independent reads of "now" a few ms apart, not the
    // same instant. Assert the 14-day span within a generous tolerance
    // rather than bit-for-bit equality, which would flake on any slower
    // run (CI, a loaded machine) for no real reason.
    const diffMs = result.order.remainingDueDate.getTime() - result.order.createdAt.getTime();
    const expectedMs = REMAINDER_DUE_DAYS * 24 * 60 * 60 * 1000;
    assert.ok(Math.abs(diffMs - expectedMs) < 5000, `expected ~${expectedMs}ms, got ${diffMs}ms`);
  } finally {
    await cleanup({ user, business });
  }
});

test('createB2BOrderForUser: creditHold is keyed off the REMAINING amount, not the full payable', async () => {
  // 100% advance with a credit limit far below the full payable
  // (10,080) — if creditHold were still checking the full payable
  // (the old prepaid-bypass-era behavior), this would incorrectly hold.
  // Since the advance covers everything, remainingAmount is 0 and this
  // must never hold.
  const { user, business } = await makeBusiness({ advancePercent: 100, creditLimit: 100 });
  const payment = await VerifiedPayment.create({
    user: user._id, razorpayOrderId: rzpOrderId(),
    amount: Math.round(EXPECTED_PAYABLE * 100), verified: true,
  });
  try {
    const result = await createB2BOrderForUser({
      businessId: business._id, userId: user._id,
      items: [{ catalogItemId: catalogItem._id, cases: CASES }],
      razorpayOrderId: payment.razorpayOrderId,
    });
    assert.equal(result.success, true);
    assert.equal(result.order.remainingAmount, 0);
    assert.equal(result.order.creditHold, false);
  } finally {
    await cleanup({ user, business, payment });
  }
});

test('createB2BOrderForUser: a large remainder against a small credit limit DOES hold', async () => {
  const { user, business } = await makeBusiness({ advancePercent: 10, creditLimit: 100 });
  const advanceAmount = 1008; // 10% of 10,080 -> remaining 9,072, well over the 100 limit
  const payment = await VerifiedPayment.create({
    user: user._id, razorpayOrderId: rzpOrderId(),
    amount: Math.round(advanceAmount * 100), verified: true,
  });
  try {
    const result = await createB2BOrderForUser({
      businessId: business._id, userId: user._id,
      items: [{ catalogItemId: catalogItem._id, cases: CASES }],
      razorpayOrderId: payment.razorpayOrderId,
    });
    assert.equal(result.success, true);
    assert.equal(result.order.remainingAmount, EXPECTED_PAYABLE - advanceAmount);
    assert.equal(result.order.creditHold, true);
  } finally {
    await cleanup({ user, business, payment });
  }
});
