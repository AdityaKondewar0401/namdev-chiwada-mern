// Needs a LOCAL MongoDB (server/.env MONGO_URI). Uses financial year 99-00
// (dates in 2099) so it can never touch real invoice numbers, and removes
// everything it creates.
require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const { createInvoiceWithNumber } = require('../utils/invoiceNumber');
const { getOrCreateInvoiceForOrder, recentOfflineCustomers } = require('../services/invoiceService');

const isLocalDb = /mongodb:\/\/(127\.0\.0\.1|localhost)/.test(process.env.MONGO_URI || '');
const TEST_FY = '99-00';
const ISSUED_AT = new Date('2099-06-01T06:30:00Z');

test('invoice numbering against a local database', { skip: !isLocalDb && 'MONGO_URI is not a local database' }, async (t) => {
  await mongoose.connect(process.env.MONGO_URI);
  const createdOrders = [];

  t.after(async () => {
    try {
      await Invoice.deleteMany({ $or: [{ fy: TEST_FY }, { order: { $in: createdOrders } }] });
      await Order.deleteMany({ _id: { $in: createdOrders } });
    } finally {
      await mongoose.disconnect();
    }
  });

  await Invoice.init();
  await Invoice.deleteMany({ fy: TEST_FY });

  await t.test('20 concurrent invoices get unique, gapless numbers', async () => {
    const make = (i) => createInvoiceWithNumber({
      source: 'offline',
      issuedAt: ISSUED_AT,
      customer: { name: `Concurrency test ${i}` },
      items: [{ name: 'Test item', price: 1, qty: 1, amount: 1 }],
      subtotal: 1,
      total: 1,
      payment: { method: 'cash', status: 'paid' },
    });
    const invoices = await Promise.all(Array.from({ length: 20 }, (_, i) => make(i)));
    const seqs = invoices.map((inv) => inv.seq).sort((a, b) => a - b);
    assert.deepEqual(seqs, Array.from({ length: 20 }, (_, i) => i + 1));
    assert.equal(new Set(invoices.map((inv) => inv.invoiceNumber)).size, 20);
    assert.ok(invoices.some((inv) => inv.invoiceNumber === `NC/${TEST_FY}/0001`));
  });

  await t.test('an order gets exactly one invoice even when requested concurrently', async () => {
    const order = await Order.create({
      user: new mongoose.Types.ObjectId(),
      items: [{ name: 'Namdev Chiwda', size: '200g', price: 89, qty: 3 }],
      shippingAddress: { fullName: 'Idempotency Test', phone: '9876543210', line1: 'Test', city: 'Solapur', state: 'Maharashtra', pincode: '413001' },
      subtotal: 267,
      shippingCharge: 49,
      total: 316,
      paymentMethod: 'COD',
    });
    createdOrders.push(order._id);
    // createdAt is immutable through Mongoose, so backdate via the driver.
    await Order.collection.updateOne({ _id: order._id }, { $set: { createdAt: ISSUED_AT } });
    const dated = await Order.findById(order._id);

    const [a, b] = await Promise.all([getOrCreateInvoiceForOrder(dated), getOrCreateInvoiceForOrder(dated)]);
    const again = await getOrCreateInvoiceForOrder(dated);
    assert.equal(String(a._id), String(b._id));
    assert.equal(String(a._id), String(again._id));
    assert.equal(await Invoice.countDocuments({ order: order._id }), 1);
    assert.equal(a.fy, TEST_FY);
    assert.equal(a.total, 316);
    assert.equal(a.shipping, 49);
  });

  await t.test('customer suggestions merge a name with and without a phone', async () => {
    const offline = (customer) => createInvoiceWithNumber({
      source: 'offline',
      issuedAt: ISSUED_AT,
      customer,
      items: [{ name: 'Test item', price: 1, qty: 1, amount: 1 }],
      subtotal: 1,
      total: 1,
      payment: { method: 'cash', status: 'paid' },
    });
    await offline({ name: 'Zqx Suggestion Test' });
    await offline({ name: 'Zqx Suggestion Test', phone: '9822000001', email: 'zqx@example.com' });
    await offline({ name: 'Zqx Other Customer', phone: '9822000002' });
    const found = await recentOfflineCustomers('zqx');
    assert.equal(found.filter((c) => c.name === 'Zqx Suggestion Test').length, 1);
    assert.equal(found.find((c) => c.name === 'Zqx Suggestion Test').phone, '9822000001');
    assert.ok(found.some((c) => c.name === 'Zqx Other Customer'));
  });
});
