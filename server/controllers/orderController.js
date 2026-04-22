const Order = require('../models/Order');
const Cart = require('../models/Cart');

const PROMO_CODES = {
  NAMDEV10: { type: 'percent', value: 10 },
  SOLAPUR: { type: 'shipping', value: 0 },
  FLAT50: { type: 'flat', value: 50 },
};

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

    // Block unpaid online orders
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

    const subtotal = cart.items.reduce(
      (sum, item) =>
        sum + item.price * item.qty,
      0
    );

    let shippingCharge =
      subtotal >= 500 ? 0 : 60;

    let discount = 0;

    if (
      promoCode &&
      PROMO_CODES[
        promoCode.toUpperCase()
      ]
    ) {
      const promo =
        PROMO_CODES[
          promoCode.toUpperCase()
        ];

      if (
        promo.type === 'percent'
      ) {
        discount = Math.round(
          (subtotal *
            promo.value) /
            100
        );
      } else if (
        promo.type === 'shipping'
      ) {
        shippingCharge = 0;
      } else if (
        promo.type === 'flat'
      ) {
        discount =
          promo.value;
      }
    }

    const total =
      subtotal +
      shippingCharge -
      discount;

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
========================================= */
exports.validatePromo =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        code,
        subtotal,
      } = req.body;

      const promo =
        PROMO_CODES[
          code?.toUpperCase()
        ];

      if (!promo) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid promo code',
        });
      }

      let discount = 0;
      let freeShipping =
        false;

      if (
        promo.type ===
        'percent'
      ) {
        discount = Math.round(
          (subtotal *
            promo.value) /
            100
        );
      } else if (
        promo.type ===
        'shipping'
      ) {
        freeShipping = true;
      } else if (
        promo.type ===
        'flat'
      ) {
        discount =
          promo.value;
      }

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
   ADMIN ADD PROMO
========================================= */
exports.addPromo = (
  req,
  res
) => {
  const {
    code,
    type,
    value,
  } = req.body;

  if (!code || !type) {
    return res.status(400).json({
      success: false,
      message:
        'Invalid promo',
    });
  }

  PROMO_CODES[
    code.toUpperCase()
  ] = {
    type,
    value:
      Number(value),
  };

  res.json({
    success: true,
    message: `Promo ${code} added`,
  });
};