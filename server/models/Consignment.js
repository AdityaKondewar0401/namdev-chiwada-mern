const mongoose = require('mongoose');

const consignmentItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    size: { type: String },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

// ── Courier (Shadowfax) tracking history — identical shape to Order.js's
// courierHistorySchema. Duplicated rather than shared to avoid coupling
// the Order and Consignment models together; one entry per Push Callback
// webhook event received for this consignment's shipment. ──
const courierHistorySchema = new mongoose.Schema({
  statusId:       { type: String },   // Shadowfax status_id, e.g. "ofd"
  status:         { type: String },   // Shadowfax human label, e.g. "Out For Delivery"
  location:       { type: String },
  remarks:        { type: String },
  eventTimestamp: { type: Date },
}, { _id: false });

// ── Courier (Shadowfax) shipment state for this consignment. Populated
// after createShadowfaxShipmentForConsignment() succeeds (see
// server/services/consignmentShipping.js), then kept current by the same
// Push Callback webhook that updates customer Orders (see
// server/routes/shipping.js / shippingController.handlePushCallback).
//
// IMPORTANT: this is entirely separate from `consignmentSchema.status`
// below. `status` tracks PAYMENT settlement (dispatched / partially_settled
// / settled) — the courier's delivery progress must never be written into
// that field, since the two mean completely different things for a
// consignment (unlike Order.status, which IS the shipping status). ──
const courierSchema = new mongoose.Schema({
  provider:         { type: String, default: 'shadowfax' },
  awbNumber:        { type: String },
  shadowfaxOrderId: { type: String },
  status:           { type: String },   // latest Shadowfax status_id
  statusDisplay:    { type: String },   // latest Shadowfax human label
  trackingUrl:      { type: String },
  actualWeightGrams:{ type: Number },
  cancelReason:     { type: String },
  error:            { type: String },   // set if shipment creation/cancel failed
  lastSyncedAt:     { type: Date },
  history:          [courierHistorySchema],
}, { _id: false });

const consignmentSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
    },
    items: {
      type: [consignmentItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A consignment needs at least one item.',
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    // Snapshot of the partner's split at dispatch time — see Partner.defaultAdvancePercent.
    advancePercent: { type: Number, required: true, min: 0, max: 100 },
    dispatchDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['dispatched', 'partially_settled', 'settled'],
      default: 'dispatched',
    },

    // ── Shadowfax courier/shipment state — see courierSchema above ──
    courier: { type: courierSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consignment', consignmentSchema);
