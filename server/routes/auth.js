// server/routes/auth.js

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, userActionLimiter } = require('../middleware/rateLimiter');
const { accountLimiter } = require('../middleware/accountRateLimiter');
const { validate } = require('../middleware/validate');
const authValidators = require('../validators/authValidators');

/*
  ROUTE STRUCTURE:
  POST /api/auth/register     → Signup
  POST /api/auth/login        → Login  
  POST /api/auth/google       → Google Login
  GET  /api/auth/me           → Get current user (protected)
  PUT  /api/auth/profile      → Update profile (protected)
  PUT  /api/auth/change-password → Change password (protected)

  MIDDLEWARE ORDER (register/login):
    1. authLimiter          — strict, per-IP (cheap, rejects volumetric
                               abuse before anything else runs)
    2. schema validators + validate — reject malformed input with 400
                               before it ever reaches a DB query
    3. accountLimiter(...)  — per-ACCOUNT exponential backoff (DB lookup,
                               so it only runs once the body is known-valid)
  google login only gets the per-IP limiter — brute-forcing an account
  via this route isn't meaningful without already holding a valid Google
  token, so per-account backoff doesn't apply the same way.
*/

router.post('/register', authLimiter, authValidators.register, validate, accountLimiter('register'), register);
router.post('/login', authLimiter, authValidators.login, validate, accountLimiter('login'), login);
router.post('/google', authLimiter, authValidators.google, validate, googleLogin);

// Protected routes — need valid JWT. Loose per-user limiter (Tier 3):
// these already require a valid token, so the risk profile is much
// lower than the public auth routes above.
router.get('/me', protect, userActionLimiter, getMe);
router.put('/profile', protect, userActionLimiter, authValidators.updateProfile, validate, updateProfile);
router.put('/change-password', protect, userActionLimiter, authValidators.changePassword, validate, changePassword);

module.exports = router;