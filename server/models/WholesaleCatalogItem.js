// server/models/WholesaleCatalogItem.js
//
// Wholesale pricing lives here, NEVER on Product - this collection is
// the only place a B2B price exists, so no public/retail endpoint can
// ever leak it (docs/B2B_PORTAL_SPEC.md §2 rule 3). `size` matches one
// entry in `product.sizes[].weight`, OR `product.weight` for a
// single-size product (today's reality for every real product - see
// server/models/Product.js) - validated in the controller, not the
// schema, so this works unchanged whether a product has one size or many.

const mongoose = require('mongoose');

const tierOverrideSchema = new mongoose.Schema({
  tier: { type: mongoose.Schema.Types.ObjectId, ref: 'PriceTier', required: true },
  pricePerUnit: { type: Number, required: true, min: 0 },
}, { _id: false });

const wholesaleCatalogItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  size: { type: String, required: true, trim: true },

  unitsPerCase: { type: Number, required: true, min: 1 },
  moqCases: { type: Number, required: true, min: 1 },
  basePricePerUnit: { type: Number, required: true, min: 0.01 },

  // Stored for future GST use only - never displayed while
  // SELLER_GST_MODE=unregistered (see utils/taxMode.js).
  hsnCode: { type: String, trim: true },

  tierOverrides: [tierOverrideSchema],

  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

wholesaleCatalogItemSchema.index({ product: 1, size: 1 }, { unique: true });

module.exports = mongoose.models.WholesaleCatalogItem || mongoose.model('WholesaleCatalogItem', wholesaleCatalogItemSchema);
