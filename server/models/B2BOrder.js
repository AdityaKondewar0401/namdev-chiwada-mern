// server/models/B2BOrder.js
//
// Separate from the retail Order model on purpose
// (docs/B2B_PORTAL_SPEC.md §4 Architecture decisions) - retail Order is
// wired into Shadowfax, retail transactional email, the WhatsApp bot,
// and retail admin analytics; B2B needs different fields entirely
// (cases, dispatch/LR, credit hold, invoice link) and a different
// status workflow (utils/b2bOrderStatus.js). Item/billing/shipping
// fields are snapshots taken at placement time - never re-read live
// catalog/account data after the fact (spec §12).

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  catalogItem: { type: mongoose.Schema.Types.ObjectId, ref: 'WholesaleCatalogItem', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  size: { type: String, required: true },
  unitsPerCase: { type: Number, required: true },
  cases: { type: Number, required: true, min: 1 },
  units: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
}, { _id: false });

const addressSnapshotSchema = new mongoose.Schema({
  label: { type: String },
  contactName: { type: String },
  phone: { type: String },
  line1: { type: String },
  line2: { type: String },
  city: { type: String },
  district: { type: String },
  state: { type: String },
  stateCode: { type: String },
  pincode: { type: String },
}, { _id: false });

const statusHistoryEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
  note: { type: String, trim: true },
}, { _id: false });

const editHistoryEntrySchema = new mongoose.Schema({
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
  reason: { type: String, trim: true },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const b2bOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true }, // e.g. "B2B-000123", via Counter

  business: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessAccount', required: true, index: true },
  placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  items: [orderItemSchema],

  billing: {
    businessName: { type: String },
    gstin: { type: String },
    address: addressSnapshotSchema,
  },
  shippingAddress: addressSnapshotSchema,

  taxMode: { type: String, required: true }, // snapshot, e.g. 'unregistered' - see utils/taxMode.js

  totals: {
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },
    payable: { type: Number, required: true },
  },

  status: {
    type: String,
    enum: ['placed', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled', 'rejected'],
    default: 'placed',
    index: true,
  },
  statusHistory: [statusHistoryEntrySchema],

  creditHold: { type: Boolean, default: false },
  creditHoldOverride: {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date },
    note: { type: String, trim: true },
  },

  paymentTermsSnapshot: { type: String },

  buyerNotes: { type: String, trim: true },
  adminNotes: { type: String, trim: true },
  cancelReason: { type: String, trim: true },
  rejectReason: { type: String, trim: true },

  dispatch: {
    mode: { type: String, enum: ['own_vehicle', 'transporter', 'courier', 'pickup'] },
    transporterName: { type: String, trim: true },
    lrNumber: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true },
    trackingUrl: { type: String, trim: true },
    dispatchedAt: { type: Date },
    expectedDeliveryDate: { type: Date },
    notes: { type: String, trim: true },
  },

  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },

  editHistory: [editHistoryEntrySchema],
}, { timestamps: true });

module.exports = mongoose.models.B2BOrder || mongoose.model('B2BOrder', b2bOrderSchema);
