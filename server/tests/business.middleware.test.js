// Exercises loadBusiness/requireApprovedBusiness directly as plain
// functions (req/res mocked) — no running server needed, same spirit as
// the DB-fixture tests elsewhere in this directory, cleaned up in
// `after` regardless of pass/fail.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const BusinessAccount = require('../models/BusinessAccount');
const { loadBusiness, requireApprovedBusiness } = require('../middleware/business');

let userWithBusiness, userWithoutBusiness, business;

before(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const stamp = Date.now();
  userWithBusiness = await User.create({
    name: '__TEST__ Business User',
    email: `__test-b2b-mw-${stamp}@example.com`,
  });
  userWithoutBusiness = await User.create({
    name: '__TEST__ No Business User',
    email: `__test-b2b-mw-nobiz-${stamp}@example.com`,
  });
  business = await BusinessAccount.create({
    user: userWithBusiness._id,
    businessName: '__TEST__ Business',
    businessType: 'retailer',
    status: 'pending',
  });
});

after(async () => {
  await Promise.all([
    User.deleteMany({ _id: { $in: [userWithBusiness._id, userWithoutBusiness._id] } }),
    BusinessAccount.deleteOne({ _id: business._id }),
  ]);
  await mongoose.disconnect();
});

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

test('loadBusiness attaches req.business when the user has one', async () => {
  const req = { user: userWithBusiness };
  const res = mockRes();
  let nextCalled = false;
  await loadBusiness(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.ok(req.business);
  assert.equal(String(req.business._id), String(business._id));
});

test('loadBusiness returns 404 when the user has no business account', async () => {
  const req = { user: userWithoutBusiness };
  const res = mockRes();
  let nextCalled = false;
  await loadBusiness(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
});

test('requireApprovedBusiness calls next() when status is approved', () => {
  const req = { business: { status: 'approved' } };
  const res = mockRes();
  let nextCalled = false;
  requireApprovedBusiness(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test('requireApprovedBusiness returns 403 for pending, rejected, and suspended', () => {
  for (const status of ['pending', 'rejected', 'suspended']) {
    const req = { business: { status } };
    const res = mockRes();
    let nextCalled = false;
    requireApprovedBusiness(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false, `expected next() NOT to be called for status=${status}`);
    assert.equal(res.statusCode, 403);
  }
});

test('requireApprovedBusiness returns 403 when req.business is missing entirely', () => {
  const req = {};
  const res = mockRes();
  let nextCalled = false;
  requireApprovedBusiness(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

// requireB2BEnabled reads config/business.js's frozen `enabled`, computed
// once from process.env.B2B_ENABLED at require time — same
// clear-the-cache-and-re-require pattern as taxMode.test.js to exercise
// both states in one process.
function freshRequireB2BEnabled(envValue) {
  if (envValue === undefined) delete process.env.B2B_ENABLED;
  else process.env.B2B_ENABLED = envValue;
  delete require.cache[require.resolve('../config/business')];
  delete require.cache[require.resolve('../middleware/business')];
  return require('../middleware/business').requireB2BEnabled;
}

test('requireB2BEnabled: default (unset) is disabled — 404 for a non-admin', () => {
  const requireB2BEnabled = freshRequireB2BEnabled(undefined);
  const req = { user: { role: 'user' }, originalUrl: '/api/b2b/orders' };
  const res = mockRes();
  let nextCalled = false;
  requireB2BEnabled(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, 'Route /api/b2b/orders not found');
});

test('requireB2BEnabled: disabled, but an admin still passes through', () => {
  const requireB2BEnabled = freshRequireB2BEnabled('false');
  const req = { user: { role: 'admin' }, originalUrl: '/api/b2b/orders' };
  const res = mockRes();
  let nextCalled = false;
  requireB2BEnabled(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test('requireB2BEnabled: enabled — a non-admin passes through too', () => {
  const requireB2BEnabled = freshRequireB2BEnabled('true');
  const req = { user: { role: 'user' }, originalUrl: '/api/b2b/orders' };
  const res = mockRes();
  let nextCalled = false;
  requireB2BEnabled(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);

  // Restore so later tests in the same run (or a later file, since
  // node:test files can share process.env) don't inherit this.
  delete process.env.B2B_ENABLED;
  delete require.cache[require.resolve('../config/business')];
  delete require.cache[require.resolve('../middleware/business')];
});
