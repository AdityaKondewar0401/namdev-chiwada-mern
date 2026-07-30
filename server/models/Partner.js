const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema(
  {
    // Left unset in Phase 1 (admin-only tracking, no partner login yet).
    // Phase 2 links this to a User account once the invite/login flow exists.
    //
    // IMPORTANT: no `default: null` here. If this had a default of null,
    // Mongoose would write an explicit `user: null` on every partner that
    // doesn't have one — and a sparse unique index only skips documents
    // where the field is genuinely ABSENT, not documents where it's
    // present-but-null. With a default, every partner without a login
    // would collide on the same `null` value and the second one would
    // fail to save. Leaving it truly unset is what makes the index work.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    businessName: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['distributor', 'retailer', 'corporate'],
      required: true,
    },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    gstin: { type: String, trim: true },
    // % paid upfront at dispatch; remainder is due once the partner sells the stock.
    // Snapshotted onto each Consignment at creation time so later changes here
    // don't rewrite the terms of past dispatches.
    defaultAdvancePercent: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// sparse: true so multiple partners can have user: null (Phase 1) without
// tripping the unique constraint — only non-null values must be unique.
partnerSchema.index({ user: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Partner', partnerSchema);
