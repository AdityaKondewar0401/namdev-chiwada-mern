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
const { publicLimiter, userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const productValidators = require('../validators/productValidators');

// Public routes — Tier 2 (moderate, per-IP)
router.get('/featured', publicLimiter, getFeaturedProducts);
router.get('/search', publicLimiter, productValidators.search, validate, searchProducts);
router.get('/', publicLimiter, productValidators.getProducts, validate, getProducts);

router.get('/:id', publicLimiter, productValidators.getProduct, validate, getProduct);

// Admin only routes — Tier 3 (loose, per-user) on top of admin auth.
// NOTE: /seed wipes the ENTIRE product catalog (Product.deleteMany({}) then
// reseeds — see productController.seedProducts) and was previously mounted
// with NO auth at all, meaning anyone who found the URL could destroy the
// live catalog. Locked behind protect+admin like every other destructive
// product route below.
router.post('/seed', protect, admin, userActionLimiter, seedProducts);
router.post('/', protect, admin, userActionLimiter, productValidators.createProduct, validate, createProduct);
router.put('/:id', protect, admin, userActionLimiter, productValidators.updateProduct, validate, updateProduct);
router.delete('/:id', protect, admin, userActionLimiter, productValidators.deleteProduct, validate, deleteProduct);

module.exports = router;
