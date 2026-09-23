// server/models/schemas/courierSchema.js
//
// Shadowfax shipment state, shared identically by models/Order.js
// (retail) and models/B2BOrder.js (wholesale) — extracted here so the
// one real shape has one real definition, not two copies that could
// quietly drift apart. Populated after createWarehouseOrder() succeeds
// (orderController.placeOrder for retail; b2bShippingController for
// B2B, always admin-triggered there — never automatic), then kept
// current by the Shadowfax Push Callback webhook (routes/shipping.js).

const mongoose = require('mongoose');

const courierHistorySchema = new mongoose.Schema({
  statusId:       { type: String },   // Shadowfax status_id, e.g. "ofd"
  status:         { type: String },   // Shadowfax human label, e.g. "Out For Delivery"
  location:       { type: String },
  remarks:        { type: String },
  eventTimestamp: { type: Date },
}, { _id: false });

const courierSchema = new mongoose.Schema({
  provider:          { type: String, default: 'shadowfax' },
  awbNumber:         { type: String, index: true },
  shadowfaxOrderId:  { type: String },
  status:            { type: String },   // latest Shadowfax status_id
  statusDisplay:     { type: String },   // latest Shadowfax human label
  trackingUrl:       { type: String },
  actualWeightGrams: { type: Number },
  cancelReason:      { type: String },
  error:             { type: String },   // set if shipment creation/cancel failed
  lastSyncedAt:      { type: Date },
  history:           [courierHistorySchema],
}, { _id: false });

module.exports = courierSchema;
