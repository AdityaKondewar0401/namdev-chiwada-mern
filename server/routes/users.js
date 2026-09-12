const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');
const { userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const userValidators = require('../validators/userValidators');

// Every route in this file is admin-only — there is no non-admin use of
// /api/users today (a signed-in user's own profile lives at
// GET /api/auth/me instead).
router.use(protect, userActionLimiter, admin);

router.get('/admin', userValidators.adminListUsers, validate, userController.getAllUsers);
router.get('/admin/:id', userValidators.adminGetUser, validate, userController.getUserById);

module.exports = router;
