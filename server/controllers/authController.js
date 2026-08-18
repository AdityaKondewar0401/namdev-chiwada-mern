const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { recordFailure, recordSuccess } = require('../middleware/accountRateLimiter');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

const sendTokenResponse = async (user, statusCode, res) => {
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
    const { name, password, phone, marketingConsent } = req.body;
    // Normalize BEFORE the duplicate-check query, not just at save time.
    // The schema's `lowercase: true` only fires when a doc is written —
    // it does nothing for a .findOne() query. If this dedupe check queries
    // the raw, un-normalized value and someone (admin, signup form, Google
    // payload) ever supplies the same email with different case/whitespace,
    // this check misses the existing account and a second User document
    // gets created with the "same" email in every way that matters, which
    // is exactly how an account can end up silently duplicated.
    const email = (req.body.email || '').trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Counts toward this email's register backoff — stops someone from
      // repeatedly hammering the same address (account-enumeration probing,
      // or spamming whatever side effects a duplicate attempt triggers).
      await recordFailure(req);
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

    await recordSuccess(req);
    await sendTokenResponse(user, 201, res);

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
    const { password } = req.body;
    // Same normalization as register() — must match exactly what's stored,
    // since Mongo's default collation is case-sensitive.
    const email = (req.body.email || '').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Deliberately the same recordFailure() + generic message as the
      // wrong-password branches below, so a failed lookup can't be
      // distinguished from a wrong password by response shape or timing
      // of the backoff kicking in.
      await recordFailure(req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // MUST run before matchPassword(): a Google-only account has no
    // password hash at all, so user.password is undefined here. Calling
    // bcrypt.compare(password, undefined) crashes with
    // "Illegal arguments: string, undefined" instead of failing
    // gracefully — this check used to exist AFTER the matchPassword call
    // below, which meant it never actually got reached before the crash.
    if (!user.password) {
      await recordFailure(req);
      return res.status(400).json({
        success: false,
        message: 'This email is registered with Google. Please use Google login.',
      });
    }

    if (!(await user.matchPassword(password))) {
      await recordFailure(req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    await recordSuccess(req);
    await sendTokenResponse(user, 200, res);

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

    const { sub, name, picture } = ticket.getPayload();
    // Google's claim is basically always already lowercase, but normalize
    // the same way register()/login() do — this must match byte-for-byte
    // with what's stored, or the $or below silently fails to find the
    // existing account and creates a duplicate User document instead of
    // linking to it.
    const email = (ticket.getPayload().email || '').trim().toLowerCase();

    let user = await User.findOne({
      $or: [{ googleId: sub }, { email }],
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

    await sendTokenResponse(user, 200, res);

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

    // Same crash risk as login: a Google-only account has no password
    // hash, so bcrypt.compare(currentPassword, undefined) would throw
    // "Illegal arguments: string, undefined" instead of failing cleanly.
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in and has no password to change.',
      });
    }

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