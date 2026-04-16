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
router.get('/', (req, res) => {
  res.json({ message: "Route is working" });
});
router.get('/:id', getProduct);

// Dev only — remove in production
router.post('/seed', seedProducts);

// Admin only routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;