// server/tests/helpers/memoryReplSet.js
//
// Shared setup for the handful of Phase 4 tests that need real MongoDB
// transactions (invoice issuance, dispatch-triggered invoicing, credit
// notes, payments, the ledger, and the concurrent invoice-numbering
// test) — spec Part C. The local dev MONGO_URI is a standalone instance
// with no transaction support (the user's own local setup, deliberately
// not changed — see Part A5), so these specific tests spin up an
// isolated, disposable single-node replica set via mongodb-memory-server
// instead of using the app's real connection. Every other test file in
// this directory keeps using the real MONGO_URI, since only multi-document
// transactions actually require a replica set.
//
// Usage in a test file:
//   const { startReplSet, stopReplSet } = require('./helpers/memoryReplSet');
//   before(async () => { await startReplSet(); });
//   after(async () => { await stopReplSet(); });

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replset = null;

async function startReplSet() {
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replset.getUri());
}

async function stopReplSet() {
  await mongoose.disconnect();
  if (replset) {
    await replset.stop();
    replset = null;
  }
}

module.exports = { startReplSet, stopReplSet };
