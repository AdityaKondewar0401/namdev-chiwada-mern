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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consignment', consignmentSchema);
