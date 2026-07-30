const mongoose = require('mongoose');

const requestItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    size: { type: String },
    qty: { type: Number, required: true, min: 1 },
    // The partner-discounted price shown to the partner at request time —
    // an estimate only. The admin sets the real, binding unitPrice on the
    // Consignment created when this request is approved.
    estimatedUnitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const partnerOrderRequestSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
    },
    items: {
      type: [requestItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'An order needs at least one item.',
      },
    },
    estimatedTotal: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // Set once an admin approves this request and dispatches it as a
    // real Consignment (with real, admin-set prices).
    consignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consignment',
    },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PartnerOrderRequest', partnerOrderRequestSchema);
