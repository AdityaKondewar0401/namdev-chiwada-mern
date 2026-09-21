// server/models/Counter.js
//
// Backs every sequential document number (B2B order numbers, invoice
// numbers, credit note numbers - one counter document per series, e.g.
// `_id: "invoice:26-27"`). Incremented atomically via
// `findOneAndUpdate({ _id }, { $inc: { seq: 1 } }, { upsert: true, new: true })`
// in the order/invoice/credit-note creation paths, so two concurrent
// requests can never be handed the same number.

const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
