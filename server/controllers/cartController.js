const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get User Cart
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name img price inStock'
    );

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    res.json({
      success: true,
      cart
    });
  } catch (err) {
    next(err);
  }
};

// Add To Cart
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, name, img, price, size, qty = 1 } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: `"${product.name}" is out of stock`
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    const existIdx = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === size
    );

    if (existIdx > -1) {
      cart.items[existIdx].qty += qty;
    } else {
      cart.items.push({
        product: productId,
        name,
        img,
        price,
        size,
        qty
      });
    }

    await cart.save();

    await cart.populate('items.product', 'name img price inStock');

    res.json({
      success: true,
      cart
    });
  } catch (err) {
    next(err);
  }
};

// Update Cart Item Quantity
exports.updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { qty } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    item.qty = qty;

    await cart.save();
    await cart.populate('items.product', 'name img price inStock');

    res.json({
      success: true,
      cart
    });
  } catch (err) {
    next(err);
  }
};

// Remove Cart Item
exports.removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== itemId
    );

    await cart.save();
    await cart.populate('items.product', 'name img price inStock');

    res.json({
      success: true,
      cart
    });
  } catch (err) {
    next(err);
  }
};

// Clear Cart
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];

    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      cart
    });
  } catch (err) {
    next(err);
  }
};