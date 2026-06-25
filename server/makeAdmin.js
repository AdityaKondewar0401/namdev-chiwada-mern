// makeAdmin.js
// Place this file inside the "server" folder (same level as package.json)
//
// Run with:  railway run node makeAdmin.js youremail@example.com
//
// This promotes an existing user to admin by setting role: 'admin'

require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');

async function makeAdmin(email) {
  if (!email) {
    console.error('❌ Please provide an email address.');
    console.error('   Usage: railway run node makeAdmin.js youremail@example.com');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to:', mongoose.connection.name);

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      console.error('   Make sure this user has already registered/logged in once.');
      process.exit(1);
    }

    console.log(`✅ Success! ${user.name} (${user.email}) is now an ADMIN.`);
    console.log(`   Role: ${user.role}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

// Get email from command-line argument
const emailArg = process.argv[2];
makeAdmin(emailArg);