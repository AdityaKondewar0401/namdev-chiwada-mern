// server/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/*
  WHAT IS MIDDLEWARE?
  
  Middleware runs BETWEEN the request and your route handler.
  
  REQUEST → [middleware] → ROUTE HANDLER → RESPONSE
  
  ANALOGY:
  Like a security guard at a club:
  - Request arrives (person at door)
  - Middleware checks their ID (verifies JWT)
  - If valid: lets them in (calls next())
  - If invalid: turns them away (sends 401 error)
*/

// ──────────────────────────────────────────────────────
// PROTECT MIDDLEWARE
// Verifies JWT token — use on any private route
// ──────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  let token;

  /*
    HOW FRONTEND SENDS TOKEN:
    Every request to a protected route includes:
    Headers: {
      Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9..."
    }
    
    We extract the token after "Bearer "
  */

  // Check if Authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // "Bearer abc123" → split by space → ["Bearer", "abc123"] → [1] = "abc123"
  }

  // No token found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login first.',
    });
  }

  try {
    /*
      VERIFY TOKEN:
      jwt.verify(token, secret) does TWO things:
      1. Checks the signature (not tampered)
      2. Checks expiry (not expired)
      
      If valid → returns the payload { id: "123" }
      If invalid → throws an error
    */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: "64abc123...", iat: 1234567, exp: 9876543 }

    // Find the user from the ID stored in token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    // ATTACH user to request object
    // Now any route handler can access req.user
    req.user = user;

    next(); // ✅ Token is valid — continue to route handler

  } catch (err) {
    // Token is invalid or expired
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or expired. Please login again.',
    });
  }
};

// ──────────────────────────────────────────────────────
// ADMIN MIDDLEWARE
// Use AFTER protect middleware
// ──────────────────────────────────────────────────────
/*
  ROLE-BASED AUTHORIZATION:
  
  ANALOGY:
  - protect = Security guard checks your ID (are you a member?)
  - admin = VIP check (are you on the VIP list?)
  
  Always use protect FIRST, then admin:
  router.delete('/product/:id', protect, admin, deleteProduct)
*/
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // ✅ User is admin — allow access
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
      // 403 = Forbidden (you're authenticated but not authorized)
    });
  }
};

/*
  DIFFERENCE BETWEEN 401 and 403:
  401 = Unauthorized = "I don't know who you are" (no token)
  403 = Forbidden = "I know who you are, but you can't do this" (wrong role)
*/