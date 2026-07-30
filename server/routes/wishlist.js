const express = require('express');
const router = express.Router();
const { toggleWishlist, getWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getWishlist);
router.post('/:productId', toggleWishlist);

module.exports = router;
