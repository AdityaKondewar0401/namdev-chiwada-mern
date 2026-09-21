#!/usr/bin/env node
// server/scripts/purgeB2BTestData.js
//
// Deletes every BusinessAccount with isTest: true, and ALL of their
// B2BOrders, Invoices, CreditNotes, and LedgerEntries, plus every
// *_test Counter document. This is the ONLY exception to the
// append-only-ledger / immutable-invoice rules in this codebase, and it
// applies ONLY to isTest accounts — see docs/B2B_PORTAL_SPEC.md §2 and
// AGENT.md §31.
//
// Dry run by default — prints exactly what WOULD be deleted and exits.
// Pass --confirm to actually delete. Never touches a non-test
// BusinessAccount, PriceTier, WholesaleCatalogItem (shared reference
// data, not "test" or "real"), retail collections, Users, or Products.
//
// Usage:
//   npm run b2b:purge-test              (dry run)
//   npm run b2b:purge-test -- --confirm (deletes)

require('dotenv').config();
const mongoose = require('mongoose');

const BusinessAccount = require('../models/BusinessAccount');
const B2BOrder = require('../models/B2BOrder');
const Invoice = require('../models/Invoice');
const CreditNote = require('../models/CreditNote');
const LedgerEntry = require('../models/LedgerEntry');
const Counter = require('../models/Counter');

async function main() {
  const confirm = process.argv.includes('--confirm');

  await mongoose.connect(process.env.MONGO_URI);

  const testAccounts = await BusinessAccount.find({ isTest: true }).select('_id businessName').lean();
  const accountIds = testAccounts.map((a) => a._id);

  const [orders, invoices, creditNotes, ledgerEntries, testCounters] = await Promise.all([
    B2BOrder.find({ business: { $in: accountIds } }).select('orderNumber').lean(),
    Invoice.find({ business: { $in: accountIds } }).select('invoiceNumber').lean(),
    CreditNote.find({ business: { $in: accountIds } }).select('creditNoteNumber').lean(),
    LedgerEntry.find({ business: { $in: accountIds } }).select('_id').lean(),
    Counter.find({ _id: /_test/ }).select('_id seq').lean(),
  ]);

  console.log('B2B TEST DATA PURGE');
  console.log('====================');
  console.log(`Business accounts (isTest: true): ${testAccounts.length}`);
  testAccounts.forEach((a) => console.log(`  - ${a.businessName} (${a._id})`));
  console.log(`B2B orders: ${orders.length}`);
  orders.forEach((o) => console.log(`  - ${o.orderNumber}`));
  console.log(`Invoices: ${invoices.length}`);
  invoices.forEach((i) => console.log(`  - ${i.invoiceNumber}`));
  console.log(`Credit notes: ${creditNotes.length}`);
  creditNotes.forEach((c) => console.log(`  - ${c.creditNoteNumber}`));
  console.log(`Ledger entries: ${ledgerEntries.length}`);
  console.log(`Test counters: ${testCounters.length}`);
  testCounters.forEach((c) => console.log(`  - ${c._id} (seq ${c.seq})`));
  console.log('');
  console.log('NOT touched: non-test business accounts, PriceTier, WholesaleCatalogItem, Users, Products, retail Orders.');
  console.log('');

  if (!confirm) {
    console.log('Dry run only — nothing deleted. Re-run with --confirm to actually delete.');
    await mongoose.disconnect();
    return;
  }

  const results = await Promise.all([
    B2BOrder.deleteMany({ business: { $in: accountIds } }),
    Invoice.deleteMany({ business: { $in: accountIds } }),
    CreditNote.deleteMany({ business: { $in: accountIds } }),
    LedgerEntry.deleteMany({ business: { $in: accountIds } }),
    Counter.deleteMany({ _id: /_test/ }),
  ]);
  const accountResult = await BusinessAccount.deleteMany({ isTest: true });

  console.log('DELETED:');
  console.log(`  ${results[0].deletedCount} B2BOrder(s)`);
  console.log(`  ${results[1].deletedCount} Invoice(s)`);
  console.log(`  ${results[2].deletedCount} CreditNote(s)`);
  console.log(`  ${results[3].deletedCount} LedgerEntry(entries)`);
  console.log(`  ${results[4].deletedCount} test Counter(s)`);
  console.log(`  ${accountResult.deletedCount} BusinessAccount(s)`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('purgeB2BTestData failed:', err);
  process.exit(1);
});
