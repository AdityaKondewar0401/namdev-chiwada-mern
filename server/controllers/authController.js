const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      marketingConsent: user.marketingConsent,
    },
  });
};

// ──────────────────────────────────────────────────────
// REGISTER (Signup)
// POST /api/auth/register
// ──────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, marketingConsent } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login.',
      });
    }

    // marketingConsent comes from the frontend as a simple boolean
    // (single checkbox = "yes, contact me"). We expand it into the
    // per-channel schema and stamp when consent was given.
    const consentGiven = marketingConsent === true;

    const user = await User.create({
      name,
      email,
      password,
      phone,
      marketingConsent: {
        email: consentGiven,
        sms: consentGiven,
        whatsapp: consentGiven,
        consentedAt: consentGiven ? new Date() : null,
        source: consentGiven ? 'signup' : null,
      },
    });

    sendTokenResponse(user, 201, res);

  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// LOGIN
// POST /api/auth/login
// ──────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This email is registered with Google. Please use Google login.',
      });
    }

    sendTokenResponse(user, 200, res);

  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GOOGLE LOGIN
// POST /api/auth/google
// ──────────────────────────────────────────────────────
exports.googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({
      $or: [{ googleId: sub }, { email: email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = sub;
        user.avatar = user.avatar || picture;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId: sub,
        avatar: picture,
        isVerified: true,
      });
    }

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
// GET /api/auth/me
// ──────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
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
    const { name, phone, address, marketingConsent } = req.body;

    const update = { name, phone, address };

    // Only touch marketingConsent if the request explicitly includes it,
    // so unrelated profile edits (e.g. changing address) never
    // silently reset consent.
    if (typeof marketingConsent === 'boolean') {
      update.marketingConsent = {
        email: marketingConsent,
        sms: marketingConsent,
        whatsapp: marketingConsent,
        consentedAt: marketingConsent ? new Date() : null,
        source: 'account',
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      update,
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

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};