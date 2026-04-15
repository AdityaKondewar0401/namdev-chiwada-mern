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

/*
  ROUTE STRUCTURE:
  POST /api/auth/register     → Signup
  POST /api/auth/login        → Login  
  POST /api/auth/google       → Google Login
  GET  /api/auth/me           → Get current user (protected)
  PUT  /api/auth/profile      → Update profile (protected)
  PUT  /api/auth/change-password → Change password (protected)
*/

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Protected routes — need valid JWT
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;