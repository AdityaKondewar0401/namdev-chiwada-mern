// server/utils/b2bTiers.js
//
// Small DB-helper functions for PriceTier admin actions, pulled out of
// the controller so the "exactly one default" rule and the
// block-delete-if-in-use rule are unit-testable in isolation (Phase 1
// convention: controllers orchestrate, utils hold the logic).

const PriceTier = require('../models/PriceTier');
const BusinessAccount = require('../models/BusinessAccount');
const WholesaleCatalogItem = require('../models/WholesaleCatalogItem');

// Unsets isDefault on every OTHER tier so exactly one tier is ever the
// default. Called after creating/updating a tier with isDefault: true.
async function enforceSingleDefaultTier(exceptTierId) {
  await PriceTier.updateMany(
    { _id: { $ne: exceptTierId } },
    { $set: { isDefault: false } }
  );
}

// True if any BusinessAccount or WholesaleCatalogItem still references
// this tier — used to block a hard delete (spec: "deactivate instead").
async function isTierInUse(tierId) {
  const [byAccount, byCatalogOverride] = await Promise.all([
    BusinessAccount.exists({ tier: tierId }),
    WholesaleCatalogItem.exists({ 'tierOverrides.tier': tierId }),
  ]);
  return Boolean(byAccount || byCatalogOverride);
}

module.exports = { enforceSingleDefaultTier, isTierInUse };
