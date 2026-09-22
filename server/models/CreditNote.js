// server/models/CreditNote.js
//
// v1 = full-cancellation credit notes only (one per invoice, hence the
// unique index on `invoice`) - see docs/B2B_PORTAL_SPEC.md §1
// "out of scope: partial credit notes". Same immutable-snapshot
// principle as Invoice.

const mongoose = require('mongoose');

const creditNoteSchema = new mongoose.Schema({
  creditNoteNumber: { type: String, required: true, unique: true }, // e.g. "NCC/26-27/00001"
  financialYear: { type: String, required: true },
  issuedAt: { type: Date, required: true, default: Date.now },

  documentTitle: { type: String, required: true }, // snapshot, "Credit Note"
  taxMode: { type: String, required: true },

  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, unique: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessAccount', required: true, index: true },

  reason: { type: String, required: true, trim: true },
  totals: {
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },
    payable: { type: Number, required: true },
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.models.CreditNote || mongoose.model('CreditNote', creditNoteSchema);
