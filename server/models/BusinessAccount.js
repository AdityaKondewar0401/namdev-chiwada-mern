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
  gstin: {
    type: String,
    uppercase: true,
    trim: true,
    default: null,
    unique: true,
    sparse: true, // multiple accounts with no GSTIN must not collide on a plain unique index
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
}, { timestamps: true });

module.exports = mongoose.models.BusinessAccount || mongoose.model('BusinessAccount', businessAccountSchema);
