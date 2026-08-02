// mergeDuplicateUser.js
// Place this file inside the "server" folder (same level as package.json)
//
// Only run this AFTER checkUserEmail.js showed more than one User document
// for the same email.
//
// Dry run (safe, shows the plan, changes nothing):
//   node mergeDuplicateUser.js sumzar12@gmail.com
//
// Actually apply the merge:
//   node mergeDuplicateUser.js sumzar12@gmail.com --apply
//
// What it does:
//   1. Finds every User doc matching the email (case-insensitive).
//   2. Picks a "keeper": prefers role:'partner', else whichever has a
//      password set, else the oldest account.
//   3. Copies any googleId / avatar from the other doc(s) onto the keeper
//      (only if the keeper doesn't already have one), so Google login
//      keeps working for the merged account.
//   4. Repoints any Partner document that referenced a deleted duplicate
//      so the partner record isn't orphaned.
//   5. Deletes the duplicate doc(s).
//
// This does NOT touch Orders/Consignments placed under the duplicate's
// _id — if the duplicate ever placed orders as a regular customer, those
// stay linked to the old _id (harmless, just means that history won't
// show up under the merged account). Ask before running this if that
// matters for this specific email.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Partner = require('./models/Partner');

async function run(emailArg, apply) {
  if (!emailArg) {
    console.error('Usage: node mergeDuplicateUser.js someone@example.com [--apply]');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to:', mongoose.connection.name);

  const escaped = emailArg.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const users = await User.find({ email: { $regex: `^${escaped}$`, $options: 'i' } })
    .select('+password')
    .sort({ createdAt: 1 });

  if (users.length < 2) {
    console.log(`Found ${users.length} document(s) — nothing to merge.`);
    process.exit(0);
  }

  const keeper =
    users.find((u) => u.role === 'partner') ||
    users.find((u) => u.password) ||
    users[0];
  const duplicates = users.filter((u) => u._id.toString() !== keeper._id.toString());

  console.log('\nKeeper account:');
  console.log('  _id:', keeper._id.toString(), '| role:', keeper.role, '| hasPassword:', Boolean(keeper.password), '| googleId:', keeper.googleId || '(none)');

  console.log('\nWill delete:');
  duplicates.forEach((d) => {
    console.log('  _id:', d._id.toString(), '| role:', d.role, '| hasPassword:', Boolean(d.password), '| googleId:', d.googleId || '(none)');
  });

  let googleIdToCopy = keeper.googleId;
  let avatarToCopy = keeper.avatar;
  duplicates.forEach((d) => {
    if (!googleIdToCopy && d.googleId) googleIdToCopy = d.googleId;
    if (!avatarToCopy && d.avatar) avatarToCopy = d.avatar;
  });

  if (!apply) {
    console.log('\nDry run only — no changes made. Re-run with --apply to execute this plan.');
    process.exit(0);
  }

  if (googleIdToCopy && googleIdToCopy !== keeper.googleId) {
    keeper.googleId = googleIdToCopy;
  }
  if (avatarToCopy && !keeper.avatar) {
    keeper.avatar = avatarToCopy;
  }
  await keeper.save();

  for (const d of duplicates) {
    const orphanedPartner = await Partner.findOne({ user: d._id });
    if (orphanedPartner) {
      orphanedPartner.user = keeper._id;
      await orphanedPartner.save();
      console.log(`Repointed Partner ${orphanedPartner._id} from ${d._id} -> ${keeper._id}`);
    }
    await User.deleteOne({ _id: d._id });
    console.log(`Deleted duplicate User ${d._id}`);
  }

  console.log('\nDone. Keeper account now has googleId:', keeper.googleId || '(none)', '| hasPassword:', Boolean(keeper.password));
  process.exit(0);
}

const apply = process.argv.includes('--apply');
const emailArg = process.argv[2];
run(emailArg, apply).catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
