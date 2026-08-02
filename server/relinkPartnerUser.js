// relinkPartnerUser.js
// Place this file inside the "server" folder (same level as package.json)
//
// Use this when checkUserEmail.js shows a User account that SHOULD be a
// partner (has googleId, was previously a partner) but shows role: "user"
// and "no Partner document points to them". That combination means the
// Partner record's `user` field still points at an old, now-deleted User
// _id — the Partner got orphaned, most likely because the original User
// document was removed directly in the database at some point (nothing in
// this app itself deletes a User document).
//
// Dry run (safe, shows the plan, changes nothing):
//   node relinkPartnerUser.js sumzar12@gmail.com
//
// Actually apply the fix:
//   node relinkPartnerUser.js sumzar12@gmail.com --apply
//
// What it does:
//   1. Finds the Partner document by its `email` field (not by `user`,
//      since that link is the broken part).
//   2. Finds the current User document for that same email.
//   3. If the Partner's `user` field doesn't point at that User (either
//      it's missing, or points at an _id that no longer exists), repoints
//      Partner.user -> the current User's _id.
//   4. Sets that User's role to "partner" and isVerified to true, so the
//      partner dashboard/consignments become visible again on next login.
//
// It does NOT set a password — this account already has a googleId, so
// Google login is how this person will keep signing in. If they also want
// email/password login to work, use the "Resend invite link" flow again
// afterward (it creates a fresh PartnerInvite for this same account).

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Partner = require('./models/Partner');

async function run(emailArg, apply) {
  if (!emailArg) {
    console.error('Usage: node relinkPartnerUser.js someone@example.com [--apply]');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to:', mongoose.connection.name);

  const escaped = emailArg.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const emailRegex = { $regex: `^${escaped}$`, $options: 'i' };

  const partner = await Partner.findOne({ email: emailRegex });
  if (!partner) {
    console.log(`No Partner document found with email "${emailArg}".`);
    console.log('This script only fixes the case where a Partner record already exists but is orphaned.');
    process.exit(0);
  }

  const currentUser = await User.findOne({ email: emailRegex });
  if (!currentUser) {
    console.log(`No User account found with email "${emailArg}" — nothing to link to.`);
    process.exit(0);
  }

  console.log('\nPartner record:');
  console.log('  _id:       ', partner._id.toString());
  console.log('  businessName:', partner.businessName);
  console.log('  user field:', partner.user ? partner.user.toString() : '(empty)');

  console.log('\nCurrent User account for this email:');
  console.log('  _id:  ', currentUser._id.toString());
  console.log('  role: ', currentUser.role);
  console.log('  hasPassword:', Boolean(currentUser.password));
  console.log('  googleId:  ', currentUser.googleId || '(none)');

  const alreadyLinked = partner.user && partner.user.toString() === currentUser._id.toString();
  const roleAlreadyPartner = currentUser.role === 'partner';

  if (alreadyLinked && roleAlreadyPartner) {
    console.log('\nEverything already lines up — nothing to fix.');
    process.exit(0);
  }

  console.log('\nPlan:');
  if (!alreadyLinked) {
    console.log(`  - Set Partner.user: ${partner.user || '(empty)'} -> ${currentUser._id.toString()}`);
  }
  if (!roleAlreadyPartner) {
    console.log(`  - Set User.role: "${currentUser.role}" -> "partner"`);
  }

  if (!apply) {
    console.log('\nDry run only — no changes made. Re-run with --apply to execute this plan.');
    process.exit(0);
  }

  partner.user = currentUser._id;
  await partner.save();

  currentUser.role = 'partner';
  currentUser.isVerified = true;
  await currentUser.save();

  console.log('\nDone. This account is now linked as the partner for', partner.businessName);
  console.log('They should log in via Google (the same one used before) and see the partner dashboard again.');
  process.exit(0);
}

const apply = process.argv.includes('--apply');
const emailArg = process.argv[2];
run(emailArg, apply).catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
