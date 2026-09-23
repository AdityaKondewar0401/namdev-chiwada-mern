const mongoose = require('mongoose');
const courierSchema = require('./schemas/courierSchema');

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

// ── Attribution — how this order came in. Set for every order (default
// 'website' covers the normal logged-in checkout flow); WhatsApp orders
// carry the same source/referral shape captured on WhatsAppSession at the
// start of that conversation (see models/WhatsAppSession.js), copied over
// once in utils/orderCreation.createOrderForUser so this stays a simple
// read-only record of the order's origin, not a live link to the session. ──
const attributionSchema = new mongoose.Schema({
  channel: {
    type: String,
    enum: ['website', 'whatsapp'],
    default: 'website',
  },
  source: { type: String }, // WhatsApp only: 'organic' | 'website' | 'ad'
  referral: {
    source_id: { type: String },
    headline: { type: String },
    ctwa_clid: { type: String },
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items:           [orderItemSchema],
  shippingAddress: { type: shippingAddressSchema },
  attribution:     { type: attributionSchema, default: () => ({}) },

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
  // Sparse+unique: COD orders never set this (empty string collisions
  // would break a plain unique index), but no two orders should ever be
  // able to claim the same Razorpay order as a backstop against the
  // check-then-act race in orderController.placeOrder.
  razorpayOrderId:   { type: String, index: { unique: true, sparse: true } },
  razorpayPaymentId: { type: String },

  // ── Shadowfax courier/shipment state — see courierSchema above ──
  courier: { type: courierSchema, default: () => ({}) },

}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
