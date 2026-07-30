const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
  getFeaturedProducts,
  searchProducts,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/', getProducts);
router.post('/seed', seedProducts);

router.get('/:id', getProduct);

// Dev only — remove in production

// Admin only routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;