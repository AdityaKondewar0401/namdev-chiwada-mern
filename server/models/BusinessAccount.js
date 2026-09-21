// server/models/BusinessAccount.js
//
// One B2B business per User (1:1 — see docs/B2B_PORTAL_SPEC.md §4).
// Created on POST /api/b2b/apply, moves through the approval workflow,
// then holds everything an approved buyer needs to place orders:
// pricing tier, payment terms, credit limit, and shipping addresses.

const mongoose = require('mongoose');

const shippingAddressSchema = new mongoose.Schema({
  label: { type: String, trim: true },
  contactName: { type: String, trim: true },
  phone: { type: String, trim: true },
  line1: { type: String, trim: true },
  line2: { type: String, trim: true },
  city: { type: String, trim: true },
  district: { type: String, trim: true },
  state: { type: String, trim: true },
  stateCode: { type: String, trim: true }, // 2-digit GST state code — see utils/indianStates.js
  pincode: { type: String, trim: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const statusHistoryEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
  note: { type: String, trim: true },
}, { _id: false });

const businessAccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  businessName: { type: String, required: true, trim: true },
  legalName: { type: String, trim: true },
  businessType: {
    type: String,
    enum: ['retailer', 'sweet_shop', 'distributor', 'supermarket', 'caterer', 'other'],
    required: true,
  },

  // Optional — collected and format/checksum-validated (utils/gstin.js)
  // for records and future use, but has no tax effect while
  // SELLER_GST_MODE=unregistered (see utils/taxMode.js).
  //
  // Deliberately NO `default: null` here: a sparse index only excludes
  // documents where the field is genuinely ABSENT, not documents where
  // it's present with value null — Mongoose would otherwise stamp every
  // gstin-less account with an explicit `null`, and the SECOND such
  // account would collide on this unique index. Callers must omit the
  // key entirely (or unset it) rather than assigning null/''.
  gstin: {
    type: String,
    uppercase: true,
    trim: true,
    unique: true,
    sparse: true,
  },
  fssaiLicenseNo: { type: String, trim: true }, // the BUYER's own license, if any - not the seller's

  contactName: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },

  billingAddress: {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    stateCode: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  shippingAddresses: [shippingAddressSchema],

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
    index: true,
  },
  rejectionReason: { type: String, trim: true },
  adminNotes: { type: String, trim: true },

  tier: { type: mongoose.Schema.Types.ObjectId, ref: 'PriceTier' },
  paymentTerms: {
    type: String,
    enum: ['prepaid', 'net7', 'net15', 'net30'],
    default: 'prepaid',
  },
  creditLimit: { type: Number, default: 0, min: 0 },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },

  statusHistory: [statusHistoryEntrySchema],

  // Production safeguard (spec Part B2): a test account admins create to
  // exercise the full flow against real (e.g. Atlas) data without mixing
  // into real numbers. Test accounts get their own order/invoice/credit-note
  // number series (utils/b2bNumbering.js) and are excluded from turnover,
  // aging, and admin summary totals. The ONLY way test data is ever removed
  // is scripts/purgeB2BTestData.js — never a retail-style delete route.
  isTest: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.BusinessAccount || mongoose.model('BusinessAccount', businessAccountSchema);
