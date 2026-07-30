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

router.use(protect);

// Get cart
router.get('/', getCart);

// Add item
router.post('/', addToCart);

// FIXED update route
router.put('/', updateCartItem);

// Remove single item
router.delete('/:itemId', removeFromCart);

// Clear all cart
router.delete('/', clearCart);

module.exports = router;