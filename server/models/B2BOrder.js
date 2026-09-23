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
const courierSchema = require('./schemas/courierSchema');

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

  // ── Advance/remainder payment (replaces the old paymentTerms model) ──
  // advancePercent is a snapshot of business.advancePercent at the
  // moment this order was placed (later admin changes to the account
  // must never retroactively change what an existing order owed).
  // advanceAmount was collected via a real, verified Razorpay payment
  // BEFORE this order could be created (see utils/b2bOrderCreation.js) -
  // unless advancePercent is 0, in which case no payment was collected
  // and razorpayOrderId/razorpayPaymentId are left unset. remainingAmount
  // is always payable - advanceAmount exactly (never independently
  // rounded), due remainingDueDate (order placement + 14 days, fixed for
  // every business - see utils/b2bInvoicing.js REMAINDER_DUE_DAYS) and
  // collected manually via the Ledger when it actually arrives.
  advancePercent:   { type: Number, required: true },
  advanceAmount:    { type: Number, required: true, default: 0 },
  remainingAmount:  { type: Number, required: true, default: 0 },
  remainingDueDate: { type: Date },
  // Sparse+unique, same reasoning as models/Order.js: a 0%-advance order
  // never sets this, but no two orders should ever claim the same
  // Razorpay order.
  razorpayOrderId:   { type: String, index: { unique: true, sparse: true } },
  razorpayPaymentId: { type: String },

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

  // ── Real Shadowfax shipment (separate from the manual `dispatch` info
  // above, which stays as free-text transporter/LR/vehicle notes an
  // admin can fill in regardless of whether a real AWB was ever booked).
  // Always admin-triggered via "Create Shipment" (b2bShippingController),
  // never automatic on order placement. Same shape as models/Order.js's
  // courier field, kept current by the shared Shadowfax webhook. ──
  courier: { type: courierSchema, default: () => ({}) },

  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },

  editHistory: [editHistoryEntrySchema],
}, { timestamps: true });

module.exports = mongoose.models.B2BOrder || mongoose.model('B2BOrder', b2bOrderSchema);
