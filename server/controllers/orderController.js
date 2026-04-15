const Order = require('../models/Order');
const Cart = require('../models/Cart');

const PROMO_CODES = {
  NAMDEV10: { type: 'percent', value: 10 },
  SOLAPUR: { type: 'shipping', value: 0 },
  FLAT50: { type: 'flat', value: 50 },
};

// @desc  Place new order
// @route POST /api/orders
exports.placeOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, promoCode, notes } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ success: false, message: 'Cart is empty' });

    const subtotal = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    let shippingCharge = subtotal >= 500 ? 0 : 60;
    let discount = 0;

    if (promoCode && PROMO_CODES[promoCode.toUpperCase()]) {
      const promo = PROMO_CODES[promoCode.toUpperCase()];
      if (promo.type === 'percent') discount = Math.round((subtotal * promo.value) / 100);
      else if (promo.type === 'shipping') shippingCharge = 0;
      else if (promo.type === 'flat') discount = promo.value;
    }

    const total = subtotal + shippingCharge - discount;

    const order = await Order.create({
      user: req.user._id,
      items: cart.items,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      subtotal,
      shippingCharge,
      discount,
      total,
      promoCode,
      notes,
    });

    // Clear cart after order
    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, order });
  } catch (err) { next(err); }
};

// @desc  Get user orders
// @route GET /api/orders
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

// @desc  Get single order
// @route GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// @desc  Get all orders (admin)
// @route GET /api/orders/admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

// @desc  Update order status (admin)
// @route PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// @desc  Validate promo code
// @route POST /api/orders/validate-promo
exports.validatePromo = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const promo = PROMO_CODES[code?.toUpperCase()];
    if (!promo) return res.status(400).json({ success: false, message: 'Invalid promo code' });
    let discount = 0;
    let freeShipping = false;
    if (promo.type === 'percent') discount = Math.round((subtotal * promo.value) / 100);
    else if (promo.type === 'shipping') freeShipping = true;
    else if (promo.type === 'flat') discount = promo.value;
    res.json({ success: true, discount, freeShipping, message: `Promo "${code.toUpperCase()}" applied!` });
  } catch (err) { next(err); }
};
