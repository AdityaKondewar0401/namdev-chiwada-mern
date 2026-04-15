const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc  Get user cart
// @route GET /api/cart
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name img inStock');
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @desc  Add item to cart
// @route POST /api/cart
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, name, img, price, size, qty = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Block out of stock products at backend too
    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: `"${product.name}" is currently out of stock`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existIdx = cart.items.findIndex(
      (i) => i.product.toString() === productId && i.size === size
    );
    if (existIdx > -1) {
      cart.items[existIdx].qty += qty;
    } else {
      cart.items.push({ product: productId, name, img, price, size, qty });
    }
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @desc  Update cart item quantity
// @route PUT /api/cart/:itemId
exports.updateCartItem = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (qty <= 0) {
      item.deleteOne();
    } else {
      item.qty = qty;
    }
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @desc  Remove item from cart
// @route DELETE /api/cart/:itemId
exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @desc  Clear cart
// @route DELETE /api/cart
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
};
