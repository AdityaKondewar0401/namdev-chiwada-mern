// server/validators/wishlistValidators.js

const { mongoIdParam } = require('./common');

const toggleWishlist = [mongoIdParam('productId')];

module.exports = { toggleWishlist };
