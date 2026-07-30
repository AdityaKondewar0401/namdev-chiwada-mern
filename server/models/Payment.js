const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    consignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consignment',
      required: true,
    },
    // Denormalized so "all outstanding dues for this partner" queries don't
    // need to populate through Consignment every time.
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
    },
    installment: {
      type: String,
      enum: ['advance', 'final'],
      required: true,
    },
    amountDue: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    dueDate: { type: Date },
    paidDate: { type: Date },
    // Set only when this installment was paid online by the partner via
    // Razorpay (as opposed to the admin manually marking it paid).
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    // Used by the Phase 3 reminder job to enforce the 3-day cadence.
    lastReminderSentAt: { type: Date },
    reminderCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, lastReminderSentAt: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
