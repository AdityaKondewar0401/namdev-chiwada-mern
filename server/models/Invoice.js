const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true, trim: true },
    size: { type: String, trim: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const emailLogSchema = new mongoose.Schema(
  {
    to: String,
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    kind: { type: String, enum: ['order-confirmation', 'manual'] },
    ok: Boolean,
    error: String,
  },
  { _id: false }
);

// An issued invoice is an immutable snapshot: it is never edited or deleted,
// only cancelled (keeping its number), so the numbering stays gapless.
// Website invoices take their live paid/cancelled state from the linked
// order at render time, so `payment` is only stored for offline sales.
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    fy: { type: String, required: true },
    seq: { type: Number, required: true },
    issuedAt: { type: Date, required: true },
    source: { type: String, enum: ['website', 'offline'], required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', unique: true, sparse: true },

    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      addressLines: { type: [String], default: [] },
    },

    items: {
      type: [lineSchema],
      validate: [(items) => items.length > 0, 'An invoice needs at least one item'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    discountLabel: { type: String, default: 'Discount' },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    payment: {
      method: { type: String, enum: ['cash', 'upi', 'bank', 'card', 'credit'] },
      status: { type: String, enum: ['paid', 'due'] },
      reference: { type: String, trim: true, default: '' },
      paidAt: Date,
    },

    status: { type: String, enum: ['issued', 'cancelled'], default: 'issued' },
    cancelledAt: Date,
    cancelReason: { type: String, trim: true },
    notes: { type: String, trim: true, default: '' },

    emailLog: { type: [emailLogSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

invoiceSchema.index({ fy: 1, seq: 1 }, { unique: true });
invoiceSchema.index({ source: 1, issuedAt: -1 });
invoiceSchema.index({ 'customer.phone': 1 });

// Own collection name: databases that ran the removed B2B portal still hold an
// `invoices` collection whose non-sparse unique `order` index would allow only
// one offline invoice.
module.exports = mongoose.model('Invoice', invoiceSchema, 'sales_invoices');
