const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
    },
    // FIX: this field was used in authController but never declared here,
    // so Mongoose was silently dropping every phone number on register/update.
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // NEW: explicit marketing consent, tracked per-channel with a timestamp.
    // Never defaults to true — consent must be an active opt-in.
    marketingConsent: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      consentedAt: { type: Date, default: null },
      source: {
        type: String,
        enum: ['signup', 'checkout', 'account', null],
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);