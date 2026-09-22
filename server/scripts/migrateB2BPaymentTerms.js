#!/usr/bin/env node
// server/scripts/migrateB2BPaymentTerms.js
//
// One-time migration: BusinessAccount.paymentTerms (field removed from
// the schema - see models/BusinessAccount.js) -> advancePercent.
// Maps prepaid->100, net7/net15/net30->0 (closest honest equivalent -
// no advance was ever collected under credit terms, so nothing was due
// at placement; the whole payable becomes the "remainder" tracked 14
// days out, same as any other 0%-advance account going forward).
//
// Dry run by default - prints exactly what WOULD change and exits.
// Pass --confirm to actually write. Reads/writes via the model's raw
// driver collection (not normal Mongoose document methods), since
// `paymentTerms` no longer exists in the schema and a regular hydrated
// document would silently drop it before we ever see the value.
//
// Usage:
//   npm run b2b:migrate-payment-terms              (dry run)
//   npm run b2b:migrate-payment-terms -- --confirm (writes)

require('dotenv').config();
const mongoose = require('mongoose');
const BusinessAccount = require('../models/BusinessAccount');

const TERM_TO_ADVANCE_PERCENT = { prepaid: 100, net7: 0, net15: 0, net30: 0 };

async function main() {
  const confirm = process.argv.includes('--confirm');

  await mongoose.connect(process.env.MONGO_URI);
  const accounts = BusinessAccount.collection;

  const toMigrate = await accounts.find({ paymentTerms: { $exists: true } }).toArray();

  console.log('B2B PAYMENT-TERMS -> ADVANCE% MIGRATION');
  console.log('=========================================');
  console.log(`Accounts with a stored paymentTerms: ${toMigrate.length}`);
  toMigrate.forEach((a) => {
    const advancePercent = TERM_TO_ADVANCE_PERCENT[a.paymentTerms] ?? 100;
    console.log(`  - ${a.businessName} (${a._id}): paymentTerms="${a.paymentTerms}" -> advancePercent=${advancePercent}`);
  });
  console.log('');

  if (!confirm) {
    console.log('Dry run only — nothing changed. Re-run with --confirm to actually write.');
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  for (const a of toMigrate) {
    const advancePercent = TERM_TO_ADVANCE_PERCENT[a.paymentTerms] ?? 100;
    await accounts.updateOne(
      { _id: a._id },
      { $set: { advancePercent }, $unset: { paymentTerms: '' } }
    );
    updated += 1;
  }

  console.log(`Updated ${updated} account(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('migrateB2BPaymentTerms failed:', err);
  process.exit(1);
});
