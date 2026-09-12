// seedPromos.js
// Place this file inside the "server" folder (same level as package.json)
//
// Seeds the 3 default promo codes documented in README.md — NAMDEV10,
// SOLAPUR, FLAT50. These were never actually inserted anywhere (seed.js
// only seeds products), which is why they always returned "Invalid promo
// code" at checkout despite being documented as available.
//
// Upsert-based, so it's safe to run more than once — re-running never
// duplicates a code or clobbers its current `active`/`uses` state if it
// already exists; it only fills in `type`/`value` for it.
//
// Run with:  node seedPromos.js
// (or `railway run node seedPromos.js` to seed the live Railway database)

require('dotenv').config();

const mongoose = require('mongoose');
const Promo = require('./models/Promo');

const DEFAULT_PROMOS = [
  { code: 'NAMDEV10', type: 'percent', value: 10 },
  { code: 'SOLAPUR', type: 'shipping', value: 0 },
  { code: 'FLAT50', type: 'flat', value: 50 },
];

async function seedPromos() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to:', mongoose.connection.name);

    for (const { code, type, value } of DEFAULT_PROMOS) {
      const result = await Promo.findOneAndUpdate(
        { code },
        { $setOnInsert: { code, type, value, active: true, uses: 0 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`   ✓ ${code} — ${result.type}, value=${result.value}, active=${result.active}`);
    }

    console.log('✅ Default promo codes are seeded.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seedPromos();
