const Cart = require('../models/Cart');
const Product = require('../models/Product');

// SECURITY: cart lines must snapshot the server's own size/price, never
// the client's. Returns null if the requested size doesn't exist on this
// product (caller should reject with 400).
function resolveCartLine(product, requestedSize) {
  if (product.sizes && product.sizes.length > 0) {
    const match = product.sizes.find((s) => s.weight === requestedSize);
    if (!match) return null;
    return { size: match.weight, price: match.price };
  }
  // Single-size product — its own weight/price are the only valid choice.
  return { size: product.weight, price: product.price };
}

/* ===============================
   Get Cart
================================= */
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({
      user: req.user._id,
    }).populate(
      'items.product',
      'name img price inStock'
    );

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
      });
    }

    res.json({
      success: true,
      cart,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   Add To Cart
================================= */
exports.addToCart = async (req, res, next) => {
  try {
    const {
      productId,
      size,
      qty = 1,
    } = req.body;

    const product =
      await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          'Product not found',
      });
    }

    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: 'This product is currently out of stock',
      });
    }

    const resolved = resolveCartLine(product, size);
    if (!resolved) {
      return res.status(400).json({
        success: false,
        message: 'Invalid size selected for this product',
      });
    }

    let cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
      });
    }

    const index =
      cart.items.findIndex(
        (item) =>
          item.product.toString() ===
            productId &&
          item.size === resolved.size
      );

    if (index > -1) {
      cart.items[index].qty += qty;
    } else {
      cart.items.push({
        product: productId,
        name: product.name,
        img: product.img,
        price: resolved.price,
        size: resolved.size,
        qty,
      });
    }

    await cart.save();
    await cart.populate(
      'items.product',
      'name img price inStock'
    );

    res.json({
      success: true,
      cart,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   FIXED Update Quantity
================================= */
exports.updateCartItem = async (
  req,
  res,
  next
) => {
  try {
    const {
      productId,
      size,
      quantity,
    } = req.body;

    // Atomic single-document update instead of findOne + mutate + save.
    // The stepper debounces clicks client-side, but a debounced request
    // can still be in flight over the network when the next one fires —
    // two concurrent read-modify-write saves on the same cart raced on
    // Mongoose's array version check and threw VersionError, which
    // surfaced to the user as "Failed to update quantity". An atomic
    // update has nothing to race: each request is a single Mongo
    // operation applied directly, last write wins, no local version to
    // conflict.
    const cart =
      quantity <= 0
        ? await Cart.findOneAndUpdate(
            { user: req.user._id },
            {
              $pull: {
                items: { product: productId, size },
              },
            },
            { new: true }
          )
        : await Cart.findOneAndUpdate(
            {
              user: req.user._id,
              items: {
                $elemMatch: { product: productId, size },
              },
            },
            { $set: { 'items.$.qty': quantity } },
            { new: true }
          );

    if (!cart) {
      return res.status(404).json({
        success: false,
        message:
          quantity <= 0
            ? 'Cart not found'
            : 'Cart item not found',
      });
    }

    await cart.populate(
      'items.product',
      'name img price inStock'
    );

    res.json({
      success: true,
      cart,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   Remove Item
================================= */
exports.removeFromCart = async (
  req,
  res,
  next
) => {
  try {
    const { itemId } =
      req.params;

    // Atomic $pull — see updateCartItem for why this replaced a
    // findOne + mutate + save (that pattern raced with concurrent
    // requests on the same cart and threw VersionError).
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { items: { _id: itemId } } },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    await cart.populate(
      'items.product',
      'name img price inStock'
    );

    res.json({
      success: true,
      cart,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   Clear Cart
================================= */
exports.clearCart = async (
  req,
  res,
  next
) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];

    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      cart,
    });
  } catch (err) {
    next(err);
  }
};