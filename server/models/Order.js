const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:    { type: String },
  img:     { type: String },
  weight:  { type: String },
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

}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
