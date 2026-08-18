const mongoose = require('mongoose');

// One document per Razorpay order created via paymentController.createPaymentOrder.
// verifyPayment() marks it `verified` once the HMAC signature checks out;
// orderController.placeOrder() is the only place that consumes it (sets
// `consumedAt`), and refuses to mark an order "paid" without a matching,
// verified, not-yet-consumed record. This is what actually ties a real
// Razorpay payment to the order it pays for — client-sent paymentStatus
// is never trusted for the ONLINE flow.
const verifiedPaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    amount: { type: Number, required: true }, // paise, matches Razorpay order amount
    verified: { type: Boolean, default: false },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.VerifiedPayment || mongoose.model('VerifiedPayment', verifiedPaymentSchema);
