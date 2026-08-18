const express = require('express');
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');

const { protect } = require('../middleware/auth');
const { userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const cartValidators = require('../validators/cartValidators');

router.use(protect, userActionLimiter);

// Get cart
router.get('/', getCart);

// Add item
router.post('/', cartValidators.addToCart, validate, addToCart);

// FIXED update route
router.put('/', cartValidators.updateCartItem, validate, updateCartItem);

// Remove single item
router.delete('/:itemId', cartValidators.removeFromCart, validate, removeFromCart);

// Clear all cart
router.delete('/', clearCart);

module.exports = router;
