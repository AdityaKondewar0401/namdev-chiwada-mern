const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Promo = require('../models/Promo');
const { sendOrderConfirmation } = require('../services/emailService');
const { calculateCartTotals, applyPromoToSubtotal } = require('../utils/pricing');

/* =========================================
   PLACE ORDER
   ONLINE orders only after payment success
========================================= */
exports.placeOrder = async (req, res, next) => {
  try {
    const {
      shippingAddress,
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      promoCode,
      notes,
      marketingConsent,
    } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    if (
      paymentMethod === 'ONLINE' &&
      paymentStatus !== 'paid'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Online payment must be completed before placing order',
      });
    }

    // Recalculate everything from the persisted cart — this is the
    // authoritative total. It must match what paymentController charged
    // for ONLINE orders, since both go through calculateCartTotals().
    const { subtotal, shippingCharge, discount, total, promo } =
      await calculateCartTotals(cart.items, promoCode);

    if (promo) {
      await Promo.findByIdAndUpdate(promo._id, {
        $inc: { uses: 1 },
      });
    }

    const order =
      await Order.create({
        user: req.user._id,
        items: cart.items,
        shippingAddress,

        paymentMethod:
          paymentMethod ||
          'COD',

        paymentStatus:
          paymentMethod ===
          'ONLINE'
            ? 'paid'
            : 'pending',

        razorpayOrderId:
          razorpayOrderId ||
          '',

        razorpayPaymentId:
          razorpayPaymentId ||
          '',

        status:
          paymentMethod ===
          'ONLINE'
            ? 'confirmed'
            : 'pending',

        subtotal,
        shippingCharge,
        discount,
        total,
        promoCode,
        notes,
      });

    // Clear cart after successful order creation
    cart.items = [];
    await cart.save();

    // Sync marketing consent captured at checkout onto the user's profile.
    // Only touches the field when the frontend explicitly sent a boolean,
    // so unrelated order fields never silently reset consent.
    if (typeof marketingConsent === 'boolean') {
      const currentUser = await User.findById(req.user._id).select('marketingConsent');
      const alreadyConsented = Boolean(
        currentUser?.marketingConsent?.email ||
        currentUser?.marketingConsent?.sms ||
        currentUser?.marketingConsent?.whatsapp
      );

      await User.findByIdAndUpdate(req.user._id, {
        marketingConsent: {
          email: marketingConsent,
          sms: marketingConsent,
          whatsapp: marketingConsent,
          consentedAt: marketingConsent
            ? (alreadyConsented ? currentUser.marketingConsent.consentedAt : new Date())
            : null,
          source: marketingConsent ? (currentUser?.marketingConsent?.source || 'checkout') : null,
        },
      });
    }

    // Send order confirmation email — TRANSACTIONAL, so it always sends
    // regardless of marketingConsent. Wrapped so an email failure (bad
    // SMTP creds, Gmail hiccup, etc.) never breaks the actual order —
    // the customer still gets their order placed even if the email fails.
    try {
      const userForEmail = await User.findById(req.user._id).select('email');
      await sendOrderConfirmation(order, userForEmail?.email);
    } catch (emailErr) {
      console.error('Order confirmation email failed to send:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   GET USER ORDERS
========================================= */
exports.getUserOrders = async (
  req,
  res,
  next
) => {
  try {
    const orders =
      await Order.find({
        user: req.user._id,
      }).sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   GET SINGLE ORDER
========================================= */
exports.getOrder = async (
  req,
  res,
  next
) => {
  try {
    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          'Order not found',
      });
    }

    if (
      order.user.toString() !==
        req.user._id.toString() &&
      req.user.role !==
        'admin'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Not authorized',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   GET ALL ORDERS (ADMIN)
========================================= */
exports.getAllOrders = async (
  req,
  res,
  next
) => {
  try {
    const orders =
      await Order.find({})
        .populate(
          'user',
          'name email'
        )
        .sort({
          createdAt: -1,
        });

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   UPDATE ORDER STATUS
========================================= */
exports.updateOrderStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const { status } =
        req.body;

      const order =
        await Order.findByIdAndUpdate(
          req.params.id,
          { status },
          { new: true }
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            'Order not found',
        });
      }

      res.json({
        success: true,
        order,
      });
    } catch (err) {
      next(err);
    }
  };

/* =========================================
   VALIDATE PROMO
   NOTE: `subtotal` here is client-supplied and only used to preview a
   discount amount on the Cart/Checkout page before payment — it is never
   used to charge anything. The real charge is always recalculated from
   the server-side cart in calculateCartTotals() (see placeOrder and
   paymentController.createPaymentOrder).
========================================= */
exports.validatePromo = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    const promo = await Promo.findOne({
      code: code?.toUpperCase(),
      active: true,
    });

    if (!promo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promo code',
      });
    }

    const { discount, freeShipping } = applyPromoToSubtotal(subtotal, promo);

    res.json({
      success: true,
      discount,
      freeShipping,
      message: `Promo "${code.toUpperCase()}" applied!`,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   ADMIN: GET ALL PROMOS
========================================= */
exports.getPromos = async (req, res, next) => {
  try {
    const promos = await Promo.find({}).sort({ createdAt: -1 });
    res.json({ success: true, promos });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   ADMIN: ADD PROMO
========================================= */
exports.addPromo = async (req, res, next) => {
  try {
    const { code, type, value } = req.body;

    if (!code || !type) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promo',
      });
    }

    const existing = await Promo.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Promo code already exists',
      });
    }

    const promo = await Promo.create({
      code: code.toUpperCase(),
      type,
      value: type === 'shipping' ? 0 : Number(value),
    });

    res.status(201).json({
      success: true,
      promo,
      message: `Promo ${promo.code} added`,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   ADMIN: TOGGLE PROMO ACTIVE/INACTIVE
========================================= */
exports.togglePromo = async (req, res, next) => {
  try {
    const promo = await Promo.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Promo not found',
      });
    }

    promo.active = !promo.active;
    await promo.save();

    res.json({
      success: true,
      promo,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   ADMIN: DELETE PROMO
========================================= */
exports.deletePromo = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase();

    if (['NAMDEV10', 'SOLAPUR', 'FLAT50'].includes(code)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default promo codes',
      });
    }

    const promo = await Promo.findOneAndDelete({ code });

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Promo not found',
      });
    }

    res.json({
      success: true,
      message: `Promo ${code} deleted`,
    });
  } catch (err) {
    next(err);
  }
};