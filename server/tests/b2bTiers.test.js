// Uses the app's own MONGO_URI to create temporary fixtures for the
// duration of this test file only, cleaned up in `afterEach`/`after`
// regardless of pass/fail — not a seed script.

const { test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();
const mongoose = require('mongoose');

const PriceTier = require('../models/PriceTier');
const BusinessAccount = require('../models/BusinessAccount');
const WholesaleCatalogItem = require('../models/WholesaleCatalogItem');
const Product = require('../models/Product');
const User = require('../models/User');
const { enforceSingleDefaultTier, isTierInUse } = require('../utils/b2bTiers');

let tierA, tierB, tierC;

before(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

after(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  const stamp = Date.now();
  tierA = await PriceTier.create({ name: '__TEST__ A', code: `TESTA${stamp}`, discountPercent: 0, isDefault: true });
  tierB = await PriceTier.create({ name: '__TEST__ B', code: `TESTB${stamp}`, discountPercent: 5, isDefault: false });
  tierC = await PriceTier.create({ name: '__TEST__ C', code: `TESTC${stamp}`, discountPercent: 10, isDefault: false });
});

afterEach(async () => {
  await PriceTier.deleteMany({ _id: { $in: [tierA._id, tierB._id, tierC._id] } });
});

test('enforceSingleDefaultTier unsets isDefault on every other tier', async () => {
  // tierA starts as the default (see beforeEach). Simulate the
  // controller having just created/updated tierB with isDefault: true,
  // then enforce the invariant exactly like createTier/updateTier do.
  await PriceTier.updateOne({ _id: tierB._id }, { isDefault: true });
  await enforceSingleDefaultTier(tierB._id);

  const [a, b, c] = await Promise.all([
    PriceTier.findById(tierA._id),
    PriceTier.findById(tierB._id),
    PriceTier.findById(tierC._id),
  ]);

  assert.equal(a.isDefault, false);
  assert.equal(b.isDefault, true);
  assert.equal(c.isDefault, false);
});

test('isTierInUse is false for an unreferenced tier', async () => {
  assert.equal(await isTierInUse(tierC._id), false);
});

test('isTierInUse is true when referenced by a BusinessAccount', async () => {
  const user = await User.create({
    name: '__TEST__ Tier User',
    email: `__test-tier-user-${Date.now()}@example.com`,
  });
  const account = await BusinessAccount.create({
    user: user._id,
    businessName: '__TEST__ Tier Business',
    businessType: 'retailer',
    tier: tierC._id,
  });

  assert.equal(await isTierInUse(tierC._id), true);
  assert.equal(await isTierInUse(tierA._id), false);

  await Promise.all([
    BusinessAccount.deleteOne({ _id: account._id }),
    User.deleteOne({ _id: user._id }),
  ]);
});

test('isTierInUse is true when referenced by a WholesaleCatalogItem tier override', async () => {
  const product = await Product.create({
    name: '__TEST__ Tier Product',
    slug: `__test-tier-product-${Date.now()}`,
    desc: 'Temporary fixture for server/tests/b2bTiers.test.js',
    category: 'mild',
    price: 89,
    weight: '200g',
    img: 'https://example.com/test.jpg',
    inStock: true,
    sizes: [{ weight: '200g', price: 89 }],
  });
  const catalogItem = await WholesaleCatalogItem.create({
    product: product._id,
    size: '200g',
    unitsPerCase: 24,
    moqCases: 2,
    basePricePerUnit: 70,
    tierOverrides: [{ tier: tierC._id, pricePerUnit: 60 }],
  });

  assert.equal(await isTierInUse(tierC._id), true);

  await Promise.all([
    WholesaleCatalogItem.deleteOne({ _id: catalogItem._id }),
    Product.deleteOne({ _id: product._id }),
  ]);
});
