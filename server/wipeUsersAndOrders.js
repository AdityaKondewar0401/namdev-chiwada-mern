// wipeUsersAndOrders.js
// Place this file inside the "server" folder (same level as package.json)
//
// Deletes EVERY User and EVERY Order in the database. Irreversible —
// there is no undo once --apply runs. Back up your database first if
// there's any chance you'll want this data later (MongoDB Atlas ->
// your cluster -> "Back Up" / or Export Collection).
//
// Dry run (safe — only prints how many documents WOULD be deleted):
//   node wipeUsersAndOrders.js
//
// Actually delete everything:
//   node wipeUsersAndOrders.js --apply
//
// After this runs, sign up again through the app (or Google login) to
// create a fresh account, then run:
//   node makeAdmin.js youremail@example.com
// to promote that fresh account back to admin.
//
// NOTE on side effects: this does NOT touch Partner, PartnerInvite,
// Consignment, or Payment documents. If any existing Partner record's
// `user` field pointed at a User you just deleted, that link becomes
// orphaned (same situation as the recent partner-login bug) — the
// partnerLink.js self-heal added earlier will NOT auto-relink it, since
// there's no way to tell which fresh account should own it. You'll need
// to either delete/recreate that Partner too, or use the admin panel's
// "resend invite" once a new account exists for that email.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');

async function run(apply) {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to:', mongoose.connection.name);

  const userCount = await User.countDocuments();
  const orderCount = await Order.countDocuments();

  console.log(`\nUsers found:  ${userCount}`);
  console.log(`Orders found: ${orderCount}`);

  if (!apply) {
    console.log('\nDry run only — nothing deleted. Re-run with --apply to actually delete all of the above.');
    process.exit(0);
  }

  console.log('\nDeleting...');
  const userResult = await User.deleteMany({});
  const orderResult = await Order.deleteMany({});

  console.log(`Deleted ${userResult.deletedCount} User document(s).`);
  console.log(`Deleted ${orderResult.deletedCount} Order document(s).`);
  console.log('\nDone. Sign up / Google-login again to create a fresh account, then run:');
  console.log('  node makeAdmin.js youremail@example.com');
  process.exit(0);
}

const apply = process.argv.includes('--apply');
run(apply).catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
