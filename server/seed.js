// seed.js
// Place this file inside the "server" folder (same level as package.json)
//
// Run with:  railway run node seed.js
// This connects to the SAME MongoDB your live Railway backend uses
// (because `railway run` injects Railway's environment variables,
// including MONGO_URI, into this script).

require('dotenv').config(); // safe to keep — railway run will override with live env vars anyway

const mongoose = require('mongoose');
const Product = require('./models/Product');       // server/models/Product.js
const PRODUCTS = require('./config/seedData');      // server/config/seedData.js

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to:', mongoose.connection.name);

    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany({});

    console.log(`🌱 Inserting ${PRODUCTS.length} products...`);
    const inserted = await Product.insertMany(PRODUCTS);

    console.log(`✅ Seeded ${inserted.length} products successfully!`);
    inserted.forEach((p) => console.log(`   - ${p.name} (${p.slug})`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();