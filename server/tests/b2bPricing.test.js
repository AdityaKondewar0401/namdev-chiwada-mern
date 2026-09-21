// Uses the app's own MONGO_URI (same connection the server itself uses
// in dev) to create temporary fixtures for the duration of this test
// file only, cleaned up in `after` regardless of pass/fail. This is a
// test creating its own throwaway data, not a seed script — nothing
// here is meant to be left behind for the app to use.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();
const mongoose = require('mongoose');

const Product = require('../models/Product');
const PriceTier = require('../models/PriceTier');
const WholesaleCatalogItem = require('../models/WholesaleCatalogItem');
const { resolveUnitPrice, priceB2BOrder } = require('../utils/b2bPricing');

let product, standardTier, distributorTier, catalogItem;

before(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  product = await Product.create({
    name: '__TEST__ B2B Pricing Product',
    slug: `__test-b2b-pricing-${Date.now()}`,
    desc: 'Temporary fixture for server/tests/b2bPricing.test.js',
    category: 'mild',
    price: 89,
    weight: '200g',
    img: 'https://example.com/test.jpg',
    inStock: true,
    sizes: [{ weight: '200g', price: 89 }],
  });

  standardTier = await PriceTier.create({
    name: '__TEST__ Standard', code: `TESTSTD${Date.now()}`, discountPercent: 0,
  });
  distributorTier = await PriceTier.create({
    name: '__TEST__ Distributor', code: `TESTDIST${Date.now()}`, discountPercent: 8,
  });

  catalogItem = await WholesaleCatalogItem.create({
    product: product._id,
    size: '200g',
    unitsPerCase: 24,
    moqCases: 2,
    basePricePerUnit: 70,
    active: true,
  });
});

after(async () => {
  await Promise.all([
    Product.deleteOne({ _id: product._id }),
    PriceTier.deleteMany({ _id: { $in: [standardTier._id, distributorTier._id] } }),
    WholesaleCatalogItem.deleteOne({ _id: catalogItem._id }),
  ]);
  await mongoose.disconnect();
});

test('resolveUnitPrice: STANDARD tier (0%) leaves the base price unchanged', () => {
  assert.equal(resolveUnitPrice(catalogItem, standardTier), 70);
});

test('resolveUnitPrice: DISTRIBUTOR tier (8%) discounts the base price', () => {
  assert.equal(resolveUnitPrice(catalogItem, distributorTier), 64.4); // 70 * 0.92
});

test('resolveUnitPrice: a per-item tier override wins over the tier percentage', () => {
  const withOverride = catalogItem.toObject();
  withOverride.tierOverrides = [{ tier: distributorTier._id, pricePerUnit: 60 }];
  assert.equal(resolveUnitPrice(withOverride, distributorTier), 60);
});

test('resolveUnitPrice: no tier at all falls back to the base price', () => {
  assert.equal(resolveUnitPrice(catalogItem, undefined), 70);
});

const MAHARASHTRA = { stateCode: '27' };
const GUJARAT = { stateCode: '24' };
const account = () => ({ _id: new mongoose.Types.ObjectId(), tier: distributorTier });

test('priceB2BOrder: a valid order within MOQ and min order value prices correctly', async () => {
  // 3 cases x 24 units/case x ₹64.40/unit = ₹4,636.80 — below the real
  // ₹5,000 default min order value, so bump quantity to clear it.
  const result = await priceB2BOrder({
    items: [{ catalogItemId: catalogItem._id, cases: 4 }],
    account: account(),
    shippingAddress: MAHARASHTRA,
  });
  assert.equal(result.success, true);
  assert.equal(result.lines[0].units, 96); // 4 cases x 24
  assert.equal(result.lines[0].unitPrice, 64.4);
  assert.equal(result.subtotal, 6182.4); // 96 x 64.40
  assert.equal(result.taxTotal, 0); // unregistered mode
});

test('priceB2BOrder: rejects a delivery state outside B2B_ALLOWED_STATE_CODES', async () => {
  const result = await priceB2BOrder({
    items: [{ catalogItemId: catalogItem._id, cases: 4 }],
    account: account(),
    shippingAddress: GUJARAT,
  });
  assert.equal(result.success, false);
  assert.ok(result.errors.some((e) => e.field === 'shippingAddress'));
});

test('priceB2BOrder: rejects a case count below the item MOQ', async () => {
  const result = await priceB2BOrder({
    items: [{ catalogItemId: catalogItem._id, cases: 1 }], // MOQ is 2
    account: account(),
    shippingAddress: MAHARASHTRA,
  });
  assert.equal(result.success, false);
  assert.ok(result.errors.some((e) => /minimum order is 2 case/.test(e.message)));
});

test('priceB2BOrder: rejects an order below the minimum order value', async () => {
  // 2 cases (meets MOQ) x 24 x ₹64.40 = ₹3,091.20 — under ₹5,000
  const result = await priceB2BOrder({
    items: [{ catalogItemId: catalogItem._id, cases: 2 }],
    account: account(),
    shippingAddress: MAHARASHTRA,
  });
  assert.equal(result.success, false);
  assert.ok(result.errors.some((e) => /[Mm]inimum order value/.test(e.message)));
});

test('priceB2BOrder: rejects an unknown/inactive catalog item id', async () => {
  const result = await priceB2BOrder({
    items: [{ catalogItemId: new mongoose.Types.ObjectId(), cases: 4 }],
    account: account(),
    shippingAddress: MAHARASHTRA,
  });
  assert.equal(result.success, false);
  assert.ok(result.errors.some((e) => e.field === 'items'));
});

test('priceB2BOrder: rejects an out-of-stock product', async () => {
  await Product.updateOne({ _id: product._id }, { inStock: false });
  try {
    const result = await priceB2BOrder({
      items: [{ catalogItemId: catalogItem._id, cases: 4 }],
      account: account(),
      shippingAddress: MAHARASHTRA,
    });
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => /out of stock/.test(e.message)));
  } finally {
    await Product.updateOne({ _id: product._id }, { inStock: true }); // restore for any later test
  }
});
