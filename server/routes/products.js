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

router.get('/:id', getProduct);

// Admin only routes
// NOTE: /seed wipes the ENTIRE product catalog (Product.deleteMany({}) then
// reseeds — see productController.seedProducts) and was previously mounted
// with NO auth at all, meaning anyone who found the URL could destroy the
// live catalog. Locked behind protect+admin like every other destructive
// product route below.
router.post('/seed', protect, admin, seedProducts);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;