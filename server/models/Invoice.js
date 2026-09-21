// server/models/Invoice.js
//
// Immutable once created (docs/B2B_PORTAL_SPEC.md §2 rule 6) - every
// field is a snapshot taken at issuance time (seller config, buyer,
// lines, totals, tax mode). Corrections happen through a CreditNote,
// never an edit to this document. `documentTitle`/`taxMode`/
// `supplierTaxNote` are snapshotted too so a past invoice still reads
// correctly even after the business registers for GST and
// utils/taxMode.js's live output changes.

const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  serialNo: { type: Number, required: true },
  description: { type: String, required: true }, // product name + size
  size: { type: String },
  cases: { type: Number, required: true },
  units: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
}, { _id: false });

const partySnapshotSchema = new mongoose.Schema({
  legalName: { type: String },
  tradeName: { type: String },
  businessName: { type: String },
  gstin: { type: String },
  fssaiLicenseNo: { type: String },
  address: { type: mongoose.Schema.Types.Mixed },
  phone: { type: String },
  email: { type: String },
  bank: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true }, // e.g. "NCB/26-27/00001"
  financialYear: { type: String, required: true }, // e.g. "26-27"
  issuedAt: { type: Date, required: true, default: Date.now },

  documentTitle: { type: String, required: true }, // snapshot, "Invoice" while unregistered
  taxMode: { type: String, required: true },
  supplierTaxNote: { type: String, required: true },

  order: { type: mongoose.Schema.Types.ObjectId, ref: 'B2BOrder', required: true, unique: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessAccount', required: true, index: true },

  seller: partySnapshotSchema,
  buyer: partySnapshotSchema,
  shipTo: { type: mongoose.Schema.Types.Mixed },

  lines: [lineItemSchema],
  totals: {
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },
    payable: { type: Number, required: true },
  },
  amountInWords: { type: String, required: true },

  dueDate: { type: Date, required: true }, // issuedAt for prepaid; issuedAt + terms days for credit

  status: { type: String, enum: ['issued', 'cancelled'], default: 'issued' },
  creditNote: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditNote', default: null },
}, { timestamps: true });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
