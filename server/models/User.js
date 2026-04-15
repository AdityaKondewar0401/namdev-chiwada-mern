// server/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/*
  WHY EACH FIELD:
  - name: Display name shown on website
  - email: Unique identifier (like your username)
  - password: Stored as a HASH (never plain text)
  - googleId: If user logs in with Google, we store Google's ID
  - role: Controls what pages/actions user can access
  - avatar: Profile picture URL
  - wishlist: Products user saved
  - address: For delivery
*/

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
      unique: true, // No two users with same email
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      // NOT required because Google users have no password
    },
    googleId: {
      type: String,
      default: null,
      // Google gives every user a unique ID
      // We store it to recognize returning Google users
    },
    avatar: {
      type: String,
      default: null,
      // Profile picture URL (from Google or uploaded)
    },
    role: {
      type: String,
      enum: ['user', 'admin'], // Only these two values allowed
      default: 'user',
      // Think of it like: user = regular ticket, admin = VIP pass
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
      // Later you can add email verification
    },
  },
  {
    timestamps: true,
    // Automatically adds: createdAt, updatedAt
  }
);

/*
  BEFORE saving to database:
  If password was changed, hash it first.
  
  WHY HASH? 
  If your database gets hacked, hackers see
  "x7$kL9#mP2" instead of "mypassword123"
  They can't reverse it — it's one-way encryption.
*/
userSchema.pre('save', async function (next) {
  // Only hash if password was actually modified
  if (!this.isModified('password')) return next();
  
  // bcrypt.hash(password, saltRounds)
  // saltRounds = 12 means it scrambles 2^12 = 4096 times
  // Higher = more secure, but slower
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/*
  METHOD: Compare entered password with stored hash
  
  ANALOGY: 
  You type "mypassword123" 
  bcrypt scrambles it the SAME way
  Compares: "x7$kL9#mP2" === "x7$kL9#mP2" ✅
*/
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);