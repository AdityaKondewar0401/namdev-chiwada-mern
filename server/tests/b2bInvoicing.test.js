// Transactional Phase 4 tests — invoice issuance, credit notes, the
// ledger/statement, and the PDF service. Uses an isolated, disposable
// in-memory MongoDB REPLICA SET (see tests/helpers/memoryReplSet.js),
// not the app's real MONGO_URI, because these are the only tests in
// this codebase that need real multi-document transactions — the local
// dev database is deliberately left as a standalone instance (Part A5
// of the Phase 3-5 instruction). node:test runs each file in its own
// process, so setting SELLER_* env vars here before any require() only
// affects this file's config/business.js — safe and isolated.

process.env.SELLER_LEGAL_NAME = 'Namdev Chiwda Sweet Home';
process.env.SELLER_FSSAI_LICENSE = '21526041003460';
process.env.SELLER_TRADE_NAME = 'Namdev Chiwda';
process.env.SELLER_ADDRESS_LINE1 = 'Navipeth';
process.env.SELLER_CITY = 'Solapur';
process.env.SELLER_BANK_NAME = 'Test Bank';
process.env.SELLER_UPI_ID = 'namdevchiwda@upi';

const { test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { startReplSet, stopReplSet } = require('./helpers/memoryReplSet');

const User = require('../models/User');
const BusinessAccount = require('../models/BusinessAccount');
const B2BOrder = require('../models/B2BOrder');
const Invoice = require('../models/Invoice');
const CreditNote = require('../models/CreditNote');
const LedgerEntry = require('../models/LedgerEntry');
const Counter = require('../models/Counter');

const { issueInvoiceForOrder } = require('../utils/b2bInvoicing');
const { issueCreditNoteForInvoice } = require('../utils/b2bCreditNote');
const { buildStatement } = require('../utils/b2bStatement');
const { getOutstanding } = require('../utils/b2bCredit');
const { renderInvoicePdf, renderCreditNotePdf } = require('../services/invoicePdfService');

let adminUser, buyerUser, statementUser;

before(async () => {
  await startReplSet();
  adminUser = await User.create({ name: 'Invoice Test Admin', email: 'invoice-test-admin@example.com' });
  buyerUser = await User.create({ name: 'Invoice Test Buyer', email: 'invoice-test-buyer@example.com' });
  // Dedicated user for the statement beforeEach/afterEach below — node:test
  // runs beforeEach/afterEach for EVERY test in the file's implicit
  // top-level suite, not just tests declared after them, so this must
  // never share a user (and therefore a BusinessAccount, which is
  // unique per user) with any test above.
  statementUser = await User.create({ name: 'Statement Test User', email: 'invoice-test-statement@example.com' });
});

after(async () => {
  await stopReplSet();
});

function pdfBufferToText(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks).toString('latin1')));
    doc.on('error', reject);
  });
}

async function makeOrder({ business, isTest = false, status = 'confirmed', payable = 5000 }) {
  return B2BOrder.create({
    orderNumber: `TST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    business: business._id,
    placedBy: buyerUser._id,
    items: [{
      catalogItem: new mongoose.Types.ObjectId(), product: new mongoose.Types.ObjectId(),
      name: 'Test Item', size: '200g', unitsPerCase: 24, cases: 2, units: 48, unitPrice: payable / 48, lineTotal: payable,
    }],
    billing: { businessName: business.businessName },
    shippingAddress: { contactName: 'Buyer', line1: 'Line 1', city: 'Pune', state: 'Maharashtra', stateCode: '27', pincode: '411001' },
    taxMode: 'unregistered',
    totals: { subtotal: payable, taxTotal: 0, grandTotal: payable, roundOff: 0, payable },
    status,
    statusHistory: [{ status, by: buyerUser._id }],
    paymentTermsSnapshot: business.paymentTerms,
  });
}

test('issueInvoiceForOrder: creates Invoice + a debit LedgerEntry + links the order, and totals match', async () => {
  const business = await BusinessAccount.create({
    user: buyerUser._id, businessName: 'Invoice Test Business', businessType: 'retailer',
    status: 'approved', paymentTerms: 'net15', creditLimit: 50000,
  });
  const order = await makeOrder({ business, payable: 7654.5 });

  const invoice = await issueInvoiceForOrder(order._id, adminUser._id);

  assert.match(invoice.invoiceNumber, /^NCB\/\d{2}-\d{2}\/00001$/); // first real invoice in this fresh DB
  assert.equal(invoice.totals.payable, order.totals.payable);
  assert.equal(invoice.totals.payable, 7654.5);

  const ledgerEntry = await LedgerEntry.findOne({ refModel: 'Invoice', refId: invoice._id });
  assert.ok(ledgerEntry, 'expected a LedgerEntry for the invoice');
  assert.equal(ledgerEntry.debit, 7654.5);
  assert.equal(ledgerEntry.credit, 0);
  assert.equal(ledgerEntry.type, 'invoice');

  const reloadedOrder = await B2BOrder.findById(order._id);
  assert.equal(String(reloadedOrder.invoice), String(invoice._id));

  await BusinessAccount.deleteOne({ _id: business._id });
});

test('issueInvoiceForOrder: rejects a second invoice for the same order', async () => {
  const business = await BusinessAccount.create({
    user: buyerUser._id, businessName: 'Invoice Test Business 2', businessType: 'retailer',
    status: 'approved', paymentTerms: 'prepaid', creditLimit: 0,
  });
  const order = await makeOrder({ business });
  await issueInvoiceForOrder(order._id, adminUser._id);

  await assert.rejects(() => issueInvoiceForOrder(order._id, adminUser._id), /already has an invoice/);

  await BusinessAccount.deleteOne({ _id: business._id });
});

test('issueInvoiceForOrder: fails loudly (and writes nothing) when seller legal name / FSSAI are missing', async () => {
  delete require.cache[require.resolve('../config/business')];
  delete require.cache[require.resolve('../utils/b2bInvoicing')];
  const savedLegal = process.env.SELLER_LEGAL_NAME;
  const savedFssai = process.env.SELLER_FSSAI_LICENSE;
  delete process.env.SELLER_LEGAL_NAME;
  delete process.env.SELLER_FSSAI_LICENSE;

  const freshIssue = require('../utils/b2bInvoicing').issueInvoiceForOrder;

  const business = await BusinessAccount.create({
    user: buyerUser._id, businessName: 'Invoice Test Business 3', businessType: 'retailer',
    status: 'approved', paymentTerms: 'prepaid', creditLimit: 0,
  });
  const order = await makeOrder({ business });

  await assert.rejects(() => freshIssue(order._id, adminUser._id), /seller.*must be set/i);

  const invoiceCount = await Invoice.countDocuments({ order: order._id });
  assert.equal(invoiceCount, 0, 'no Invoice should have been written');
  const reloadedOrder = await B2BOrder.findById(order._id);
  assert.equal(reloadedOrder.invoice, null, 'order.invoice should remain unset');

  // restore for every later test in this file
  process.env.SELLER_LEGAL_NAME = savedLegal;
  process.env.SELLER_FSSAI_LICENSE = savedFssai;
  delete require.cache[require.resolve('../config/business')];
  delete require.cache[require.resolve('../utils/b2bInvoicing')];

  await BusinessAccount.deleteOne({ _id: business._id });
});

// From here on, every test creates its OWN dedicated User (never reuses
// buyerUser/adminUser for a BusinessAccount) and cleans up in a
// try/finally — BusinessAccount.user is unique, so an earlier test's
// assertion failure must never leave a document behind that a LATER
// test's fixture setup then collides with. (Found the hard way: an
// early version of this file shared one user across several tests and
// a single failing assertion cascaded into unrelated failures below it.)

test('real and test invoice series are independent (test series starts at .../00001)', async () => {
  const [realUser, testUser] = await Promise.all([
    User.create({ name: 'Series Real User', email: `series-real-${Date.now()}@example.com` }),
    User.create({ name: 'Series Test User', email: `series-test-${Date.now()}@example.com` }),
  ]);
  let realBusiness, testBusiness;
  try {
    realBusiness = await BusinessAccount.create({
      user: realUser._id, businessName: 'Series Real Biz', businessType: 'retailer',
      status: 'approved', paymentTerms: 'prepaid', creditLimit: 0, isTest: false,
    });
    testBusiness = await BusinessAccount.create({
      user: testUser._id, businessName: 'Series Test Biz', businessType: 'retailer',
      status: 'approved', paymentTerms: 'prepaid', creditLimit: 0, isTest: true,
    });

    const realOrder = await makeOrder({ business: realBusiness });
    const testOrder = await makeOrder({ business: testBusiness, isTest: true });

    const realInvoice = await issueInvoiceForOrder(realOrder._id, adminUser._id);
    const testInvoice = await issueInvoiceForOrder(testOrder._id, adminUser._id);

    // The real series' own sequence number depends on how many real
    // invoices earlier tests in this file already issued — only the
    // PREFIX and the fact that it's a real, positive sequence matter
    // here. The test series, though, has never been touched by any
    // other test, so it must be exactly 00001.
    assert.match(realInvoice.invoiceNumber, /^NCB\/\d{2}-\d{2}\/\d{5}$/);
    assert.match(testInvoice.invoiceNumber, /^TST\/\d{2}-\d{2}\/00001$/);
  } finally {
    await Promise.all([
      BusinessAccount.deleteMany({ _id: { $in: [realBusiness?._id, testBusiness?._id].filter(Boolean) } }),
      User.deleteMany({ _id: { $in: [realUser._id, testUser._id] } }),
    ]);
  }
});

test('20 concurrent invoice issuances produce 20 unique, gapless numbers', async () => {
  const user = await User.create({ name: 'Concurrency Test User', email: `concurrency-${Date.now()}@example.com` });
  let business;
  try {
    business = await BusinessAccount.create({
      user: user._id, businessName: 'Concurrency Test Biz', businessType: 'retailer',
      status: 'approved', paymentTerms: 'prepaid', creditLimit: 0,
    });
    const orders = await Promise.all(Array.from({ length: 20 }, () => makeOrder({ business })));

    const invoices = await Promise.all(orders.map((o) => issueInvoiceForOrder(o._id, adminUser._id)));
    const seqNumbers = invoices.map((inv) => Number(inv.invoiceNumber.split('/')[2])).sort((a, b) => a - b);

    assert.equal(new Set(seqNumbers).size, 20, 'expected 20 unique sequence numbers');
    const min = seqNumbers[0];
    const expected = Array.from({ length: 20 }, (_, i) => min + i);
    assert.deepEqual(seqNumbers, expected, 'expected a gapless consecutive run of numbers');
  } finally {
    if (business) await BusinessAccount.deleteOne({ _id: business._id });
    await User.deleteOne({ _id: user._id });
  }
});

test('cancelling an invoiced order (credit note) nets outstanding back to zero', async () => {
  const user = await User.create({ name: 'Credit Note Test User', email: `credit-note-${Date.now()}@example.com` });
  let business;
  try {
    business = await BusinessAccount.create({
      user: user._id, businessName: 'Credit Note Test Biz', businessType: 'retailer',
      status: 'approved', paymentTerms: 'net15', creditLimit: 50000,
    });
    const order = await makeOrder({ business, payable: 3000 });
    const invoice = await issueInvoiceForOrder(order._id, adminUser._id);

    assert.equal(await getOutstanding(business._id), 3000);

    const creditNote = await issueCreditNoteForInvoice(invoice._id, 'Order cancelled after confirmation', adminUser._id);

    assert.equal(creditNote.totals.payable, 3000);
    const reloadedInvoice = await Invoice.findById(invoice._id);
    assert.equal(reloadedInvoice.status, 'cancelled');
    assert.equal(String(reloadedInvoice.creditNote), String(creditNote._id));

    const creditEntry = await LedgerEntry.findOne({ refModel: 'CreditNote', refId: creditNote._id });
    assert.equal(creditEntry.credit, 3000);
    assert.equal(creditEntry.debit, 0);

    assert.equal(await getOutstanding(business._id), 0);

    // Smoke-test the credit-note PDF too (reuses the same draw* helpers
    // already visually confirmed via the invoice PDF — see the note atop
    // invoicePdfService.js for why this checks render-succeeds rather
    // than extracted text).
    const reloadedInvoiceForPdf = await Invoice.findById(invoice._id);
    const creditDoc = renderCreditNotePdf(creditNote, reloadedInvoiceForPdf);
    const creditPdfText = await pdfBufferToText(creditDoc);
    assert.ok(creditPdfText.startsWith('%PDF-'));
    assert.equal(creditNote.documentTitle, 'Credit Note');

    // A second credit note against the same invoice must be rejected —
    // applyCreditNoteToInvoice's own first check (invoice already
    // cancelled) fires before its "credit note already exists" check,
    // since the first credit note already flipped the invoice's status.
    await assert.rejects(() => issueCreditNoteForInvoice(invoice._id, 'again', adminUser._id), /already (exists|been cancelled)/);
  } finally {
    if (business) await BusinessAccount.deleteOne({ _id: business._id });
    await User.deleteOne({ _id: user._id });
  }
});

// pdfkit embeds/subsets even the standard 14 fonts (confirmed directly —
// see the note atop invoicePdfService.js), so a rendered PDF's text
// never appears as greppable literal ASCII in the byte stream, with or
// without stream compression. Extracting real text back out would need
// a PDF-parsing dependency beyond the two this phase is scoped to
// (pdfkit, mongodb-memory-server). So this test asserts correctness on
// the Invoice document itself — the actual source of truth
// invoicePdfService.js only transcribes onto the page — plus that
// rendering a real invoice succeeds and produces a well-formed PDF. The
// visual layout (FSSAI number, supplier note, no GST/HSN columns, title
// "INVOICE" not "Tax Invoice") was additionally confirmed once by hand
// against a generated sample.
test('PDF data source: the issued invoice snapshot has the FSSAI number, the supplier note, and no GST fields, and rendering succeeds', async () => {
  const user = await User.create({ name: 'PDF Test User', email: `pdf-test-${Date.now()}@example.com` });
  let business;
  try {
    business = await BusinessAccount.create({
      user: user._id, businessName: 'PDF Test Biz', businessType: 'retailer',
      status: 'approved', paymentTerms: 'prepaid', creditLimit: 0,
    });
    const order = await makeOrder({ business, payable: 1200 });
    const invoice = await issueInvoiceForOrder(order._id, adminUser._id);

    assert.equal(invoice.seller.fssaiLicenseNo, '21526041003460');
    assert.equal(invoice.supplierTaxNote, 'Supplier not registered under GST. GST not charged.');
    assert.equal(invoice.documentTitle, 'Invoice'); // never "Tax Invoice"
    assert.equal(invoice.taxMode, 'unregistered');
    assert.equal(invoice.totals.taxTotal, 0);
    assert.equal(JSON.stringify(invoice.toObject()).includes('hsnCode'), false);

    const doc = renderInvoicePdf(invoice, { orderNumber: order.orderNumber, paymentTerms: 'prepaid' });
    const text = await pdfBufferToText(doc);
    assert.ok(text.startsWith('%PDF-'), 'expected a well-formed PDF header');
    assert.ok(text.length > 500, 'expected non-trivial PDF output');
  } finally {
    if (business) await BusinessAccount.deleteOne({ _id: business._id });
    await User.deleteOne({ _id: user._id });
  }
});

let statementBusiness;

beforeEach(async () => {
  statementBusiness = await BusinessAccount.create({
    user: statementUser._id, businessName: `Statement Test Biz ${Date.now()}`, businessType: 'retailer',
    status: 'approved', paymentTerms: 'net15', creditLimit: 50000,
  });
});

afterEach(async () => {
  if (statementBusiness) {
    await LedgerEntry.deleteMany({ business: statementBusiness._id });
    await BusinessAccount.deleteOne({ _id: statementBusiness._id });
  }
});

test('buildStatement: opening balance only counts entries strictly before "from"; running/closing balances are correct', async () => {
  const day = (n) => new Date(Date.UTC(2026, 5, n));

  await LedgerEntry.create([
    { business: statementBusiness._id, date: day(1), type: 'invoice', debit: 1000, credit: 0, recordedBy: adminUser._id },
    { business: statementBusiness._id, date: day(5), type: 'payment', debit: 0, credit: 400, recordedBy: adminUser._id },
    { business: statementBusiness._id, date: day(10), type: 'invoice', debit: 2000, credit: 0, recordedBy: adminUser._id },
    { business: statementBusiness._id, date: day(15), type: 'payment', debit: 0, credit: 500, recordedBy: adminUser._id },
  ]);

  const statement = await buildStatement(statementBusiness._id, { from: day(6).toISOString(), to: day(20).toISOString() });

  assert.equal(statement.openingBalance, 600); // 1000 debit - 400 credit, both before day(6)
  assert.equal(statement.entries.length, 2); // day(10) and day(15) fall inside [day(6), day(20)]
  assert.equal(statement.entries[0].runningBalance, 2600); // 600 + 2000
  assert.equal(statement.entries[1].runningBalance, 2100); // 2600 - 500
  assert.equal(statement.closingBalance, 2100);
});
