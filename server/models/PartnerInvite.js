const mongoose = require('mongoose');
const crypto = require('crypto');

const partnerInviteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

partnerInviteSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('PartnerInvite', partnerInviteSchema);
