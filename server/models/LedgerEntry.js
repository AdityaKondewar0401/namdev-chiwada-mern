// server/models/LedgerEntry.js
//
// Append-only (docs/B2B_PORTAL_SPEC.md §2 rule 7 - no update/delete
// route will ever exist for this model). A business's outstanding
// balance is always DERIVED by summing entries (sum(debit) -
// sum(credit)), never stored as a running-total field on
// BusinessAccount - so it can never drift out of sync with the entries
// that are supposed to explain it.

const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessAccount', required: true, index: true },
  date: { type: Date, required: true, default: Date.now, index: true },

  type: {
    type: String,
    enum: ['opening_balance', 'invoice', 'payment', 'credit_note', 'adjustment'],
    required: true,
  },

  // Exactly one of these is > 0 for any given entry (enforced in the
  // controller that creates entries, not the schema).
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },

  refModel: { type: String, enum: ['Invoice', 'CreditNote'] },
  refId: { type: mongoose.Schema.Types.ObjectId },

  reference: { type: String, trim: true }, // UTR, cheque no., etc.
  method: { type: String, enum: ['upi', 'neft_rtgs', 'cash', 'cheque', 'razorpay', 'other'] },

  note: { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

ledgerEntrySchema.index({ business: 1, date: 1, _id: 1 });

module.exports = mongoose.models.LedgerEntry || mongoose.model('LedgerEntry', ledgerEntrySchema);
