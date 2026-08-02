// checkUserEmail.js
// Place this file inside the "server" folder (same level as package.json)
//
// Run locally:   node checkUserEmail.js sumzar12@gmail.com
// Run on Render: open the Shell tab for the backend service and run the
//                same command there (it already has MONGO_URI configured).
//
// Prints EVERY User document matching this email (case-insensitive), so
// you can see directly whether there are two separate accounts fighting
// over the same email — this is the most likely cause of "logged in as
// partner, then Google login broke it."

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Partner = require('./models/Partner');

async function run(emailArg) {
  if (!emailArg) {
    console.error('Usage: node checkUserEmail.js someone@example.com');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to:', mongoose.connection.name);

  // Case-insensitive regex match, so this finds duplicates even if they
  // differ only by case (which is exactly the bug we're checking for).
  const escaped = emailArg.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const users = await User.find({ email: { $regex: `^${escaped}$`, $options: 'i' } }).select('+password');

  console.log(`\nFound ${users.length} User document(s) for "${emailArg}":\n`);
  users.forEach((u, i) => {
    console.log(`--- User #${i + 1} ---`);
    console.log('  _id:       ', u._id.toString());
    console.log('  email:     ', u.email);
    console.log('  role:      ', u.role);
    console.log('  hasPassword:', Boolean(u.password));
    console.log('  googleId:  ', u.googleId || '(none)');
    console.log('  isVerified:', u.isVerified);
    console.log('  createdAt: ', u.createdAt);
    console.log('');
  });

  if (users.length > 1) {
    console.log('⚠️  MULTIPLE accounts found for the same email — this is the bug.');
    console.log('   Whichever one a given login flow happens to match first is');
    console.log('   the one you get logged into, which explains the inconsistent');
    console.log('   behavior (password sometimes "missing", partner view disappearing).');
  } else if (users.length === 1) {
    const u = users[0];
    const partner = await Partner.findOne({ user: u._id });
    console.log('Only one account exists — good. Linked Partner record:', partner ? partner._id.toString() : '(none found)');
    if (!partner) {
      console.log('⚠️  This user has role "partner" but no Partner document points to them — check the Partner collection.');
    }
  } else {
    console.log('No account found at all for this email.');
  }

  process.exit(0);
}

run(process.argv[2]).catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
