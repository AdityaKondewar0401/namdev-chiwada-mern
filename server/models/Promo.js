const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percent', 'flat', 'shipping'],
      required: true,
    },
    value: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    uses: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Promo', promoSchema);