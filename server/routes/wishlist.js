const express = require('express');
const router = express.Router();
const { toggleWishlist, getWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');
const { userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const wishlistValidators = require('../validators/wishlistValidators');

router.use(protect, userActionLimiter);
router.get('/', getWishlist);
router.post('/:productId', wishlistValidators.toggleWishlist, validate, toggleWishlist);

module.exports = router;
