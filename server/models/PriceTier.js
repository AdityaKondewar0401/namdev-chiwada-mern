// server/models/PriceTier.js
//
// Wholesale pricing tiers (e.g. STANDARD, DISTRIBUTOR) - a flat discount
// percent off WholesaleCatalogItem.basePricePerUnit, with an optional
// per-item override (see WholesaleCatalogItem.tierOverrides). No tiers
// are seeded by this codebase (docs/B2B_PORTAL_SPEC.md §0 D5) - created
// through the admin UI (B2BCatalogTab) in a later phase.

const mongoose = require('mongoose');

const priceTierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  discountPercent: { type: Number, required: true, min: 0, max: 100 },
  // Exactly one tier should be the default (enforced in the admin
  // controller when creating/editing - Mongoose has no native "at most
  // one true" index).
  isDefault: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.models.PriceTier || mongoose.model('PriceTier', priceTierSchema);
