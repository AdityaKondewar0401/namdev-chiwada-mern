// server/controllers/authController.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Google OAuth client — verifies Google tokens
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/*
  HELPER: Create a JWT token
  
  jwt.sign(data, secret, options)
  - data: what to store inside the token (user's ID)
  - secret: a password only YOUR server knows
  - options: when does it expire
  
  ANALOGY: 
  Stamping a ticket with your hotel's
  unique stamp that only you have
*/
const signToken = (id) => {
  return jwt.sign(
    { id },                          // Payload: store user ID
    process.env.JWT_SECRET,          // Secret key (keep this SAFE!)
    { expiresIn: process.env.JWT_EXPIRE || '30d' }  // Expires in 30 days
  );
};

/*
  HELPER: Send token response
  Reused by register, login, and Google auth
*/
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
};

// ──────────────────────────────────────────────────────
// REGISTER (Signup)
// POST /api/auth/register
// ──────────────────────────────────────────────────────
/*
  FLOW:
  1. User sends: { name, email, password }
  2. Check if email already exists
  3. Create user (password gets hashed automatically by User model)
  4. Generate JWT token
  5. Send token back
*/
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Step 1: Check all required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    // Step 2: Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login.',
      });
    }

    // Step 3: Create user
    // Password is automatically hashed by User model's pre-save hook
    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    // Step 4 & 5: Generate token and send response
    sendTokenResponse(user, 201, res);

  } catch (err) {
    next(err); // Pass to error handler
  }
};

// ──────────────────────────────────────────────────────
// LOGIN
// POST /api/auth/login
// ──────────────────────────────────────────────────────
/*
  FLOW:
  1. User sends: { email, password }
  2. Find user by email
  3. Compare password with stored hash
  4. Generate JWT
  5. Send token back
*/
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Step 1: Check fields provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Step 2: Find user
    // NOTE: We need to explicitly select password
    // because in User model we could have set select: false
    const user = await User.findOne({ email }).select('+password');

    // Step 3: Check user exists AND password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        // NOTE: Give SAME message for both cases
        // Don't say "email not found" — that helps hackers
      });
    }

    // Check if user registered with Google (no password set)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This email is registered with Google. Please use Google login.',
      });
    }

    // Step 4 & 5: Send token
    sendTokenResponse(user, 200, res);

  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GOOGLE LOGIN
// POST /api/auth/google
// ──────────────────────────────────────────────────────
/*
  HOW GOOGLE AUTH WORKS:
  
  1. User clicks "Continue with Google" on frontend
  2. Google shows its login popup
  3. User logs in on Google's page (NOT yours)
  4. Google gives frontend a "credential" (a token)
  5. Frontend sends that credential to YOUR backend
  6. YOUR backend asks Google: "Is this token real?"
  7. Google says "Yes, here's the user info: name, email, picture"
  8. You create/find user in your DB
  9. You generate YOUR OWN JWT and send back
  
  ANALOGY:
  Like showing your Aadhaar card (Google token) to a hotel
  The hotel calls the Aadhaar office to verify it's real
  Then gives you their own room key card (JWT)
*/
exports.googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    // credential = the token Google gave to your frontend

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
      });
    }

    // Step 1: Verify the Google token
    // This asks Google's servers: "Is this token valid?"
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Step 2: Extract user info from verified token
    const { sub, email, name, picture } = ticket.getPayload();
    // sub = Google's unique user ID (like a fingerprint)
    // picture = profile photo URL

    // Step 3: Check if user already exists in OUR database
    let user = await User.findOne({
      $or: [
        { googleId: sub },  // Found by Google ID
        { email: email },   // Found by email (might have regular account)
      ],
    });

    if (user) {
      // User EXISTS — update their Google info if needed
      if (!user.googleId) {
        user.googleId = sub;
        user.avatar = user.avatar || picture;
        await user.save();
      }
    } else {
      // User DOESN'T EXIST — create new account
      user = await User.create({
        name,
        email,
        googleId: sub,
        avatar: picture,
        isVerified: true, // Google already verified their email
        // No password — Google users don't need one
      });
    }

    // Step 4: Generate OUR JWT and send
    sendTokenResponse(user, 200, res);

  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({
      success: false,
      message: 'Google authentication failed. Please try again.',
    });
  }
};

// ──────────────────────────────────────────────────────
// GET CURRENT USER
// GET /api/auth/me  (protected route)
// ──────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware (explained next)
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('wishlist', 'name img price');

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// UPDATE PROFILE
// PUT /api/auth/profile  (protected)
// ──────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// CHANGE PASSWORD
// PUT /api/auth/change-password  (protected)
// ──────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};