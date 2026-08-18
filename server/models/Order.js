const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:    { type: String },
  img:     { type: String },
  size:    { type: String }, // matches Cart.items' `size` label, e.g. "250g"
  weight:  { type: String }, // legacy field name, kept for older orders that used it
  price:   { type: Number, required: true },
  qty:     { type: Number, required: true, min: 1 },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String },
  name:     { type: String }, // fallback for older checkout versions
  phone:    { type: String },
  line1:    { type: String },
  street:   { type: String }, // fallback
  line2:    { type: String },
  city:     { type: String },
  state:    { type: String },
  pincode:  { type: String },
  zip:      { type: String }, // fallback
}, { _id: false });

// ── Courier (Shadowfax) tracking history — one entry per Push Callback
// webhook event received, so the full journey is auditable even though
// `courier.status` only ever holds the latest state. ──
const courierHistorySchema = new mongoose.Schema({
  statusId:       { type: String },   // Shadowfax status_id, e.g. "ofd"
  status:         { type: String },   // Shadowfax human label, e.g. "Out For Delivery"
  location:       { type: String },
  remarks:        { type: String },
  eventTimestamp: { type: Date },
}, { _id: false });

// ── Courier (Shadowfax) shipment state for this order. Populated after
// `createWarehouseOrder()` succeeds in orderController.placeOrder, then
// kept current by the Push Callback webhook (see routes/shipping.js). ──
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

const orderSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:           [orderItemSchema],
  shippingAddress: { type: shippingAddressSchema },

  subtotal:       { type: Number, required: true },
  shippingCharge: { type: Number, default: 0 },
  discount:       { type: Number, default: 0 },
  total:          { type: Number, required: true },
  promoCode:      { type: String },
  notes:          { type: String },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },

  // ── Razorpay payment fields ──
  paymentMethod:     { type: String, default: 'COD' },
  paymentStatus:     { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },

  // ── Shadowfax courier/shipment state — see courierSchema above ──
  courier: { type: courierSchema, default: () => ({}) },

}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
