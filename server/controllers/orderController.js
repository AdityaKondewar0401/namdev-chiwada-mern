const Order = require('../models/Order');
const Promo = require('../models/Promo');
const shadowfaxService = require('../services/shadowfaxService');
const { applyPromoToSubtotal } = require('../utils/pricing');
const { createOrderForUser } = require('../utils/orderCreation');

/* =========================================
   PLACE ORDER
   ONLINE orders only after payment success

   NOTE ON SHIPPING: this used to call the Shadowfax integration
   automatically right after the order was created. That auto-creation
   has been removed — a shipment is now only created when an admin
   explicitly clicks "Create Shipment" in the admin Orders tab (see
   shippingController.createShipment / PUT /api/shipping/orders/:id/
   create-shipment). This gives the admin a review step before a real
   courier pickup is requested, and the AWB/tracking info appears to the
   customer (My Orders) and the admin the moment that action is taken.
========================================= */
exports.placeOrder = async (req, res, next) => {
  try {
    const {
      shippingAddress,
      paymentMethod,
      razorpayOrderId,
      promoCode,
      notes,
      marketingConsent,
    } = req.body;

    // Core logic lives in utils/orderCreation.js, shared with the
    // WhatsApp bot (services/whatsappBotService.js) so both entry points
    // place orders through the exact same stock/pricing/Shadowfax checks —
    // see that file's header comment for why this was extracted.
    const result = await createOrderForUser({
      userId: req.user._id,
      shippingAddress,
      paymentMethod,
      razorpayOrderId,
      promoCode,
      notes,
      marketingConsent,
    });

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      order: result.order,
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
   Admin-only status changes. Setting status to "cancelled" now also
   cancels the underlying Shadowfax shipment (if one exists) so the two
   systems don't drift apart — an admin cancelling in this dashboard is
   the one place in the app that should also cancel the courier request.
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

      const existing = await Order.findById(req.params.id).select('status');
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      if (status === 'cancelled' && existing.status === 'delivered') {
        return res.status(400).json({ success: false, message: 'A delivered order cannot be cancelled' });
      }

      // Populate `user` the same way getAllOrders does — without this, the
      // admin Orders list replaces its in-memory order with this response
      // (see OrdersTab.jsx's updateStatus) and the customer's name/email
      // collapse to "Guest" until the next full page reload, even though
      // the order's actual `user` reference never changed.
      const order =
        await Order.findByIdAndUpdate(
          req.params.id,
          { status },
          { new: true }
        ).populate('user', 'name email');

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            'Order not found',
        });
      }

      if (status === 'cancelled' && order.courier?.awbNumber) {
        try {
          const result = await shadowfaxService.cancelOrder(
            order.courier.awbNumber,
            'Cancelled by admin'
          );
          order.courier.status = 'cancelled_by_customer';
          order.courier.statusDisplay = result.responseMsg || 'Cancelled';
          order.courier.cancelReason = 'Cancelled by admin';
          order.courier.lastSyncedAt = new Date();
          await order.save();
        } catch (courierErr) {
          console.error(
            `Shadowfax cancellation failed for order ${order._id}:`,
            courierErr.message
          );
          order.courier.error = `Cancellation failed: ${courierErr.message}`;
          await order.save().catch(() => {});
        }
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

    // Belt-and-suspenders alongside orderValidators.addPromo's own check:
    // never let a non-numeric value reach the database, since a stored
    // NaN would silently poison every future discount calculation for
    // this code instead of failing loudly here.
    const numericValue = type === 'shipping' ? 0 : Number(value);
    if (Number.isNaN(numericValue)) {
      return res.status(400).json({
        success: false,
        message: 'value must be a valid number for this promo type',
      });
    }

    const promo = await Promo.create({
      code: code.toUpperCase(),
      type,
      value: numericValue,
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
