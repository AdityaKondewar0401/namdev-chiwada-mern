const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'whatsapp'],
      required: true,
    },
    sentAt: { type: Date, default: Date.now },
    success: { type: Boolean, default: true },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
