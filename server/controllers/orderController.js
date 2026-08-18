const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Promo = require('../models/Promo');
const VerifiedPayment = require('../models/VerifiedPayment');
const { sendOrderConfirmation } = require('../services/emailService');
const { calculateCartTotals, applyPromoToSubtotal } = require('../utils/pricing');
const shadowfaxService = require('../services/shadowfaxService');
const { getShadowfaxConfig } = require('../config/shadowfax');
const { calcTotalWeightGrams } = require('../utils/weight');

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

    // SECURITY: "was this order actually paid" is never trusted from the
    // client. For ONLINE orders we require a VerifiedPayment record —
    // created by paymentController.createPaymentOrder and only marked
    // `verified` by paymentController.verifyPayment after a real HMAC
    // signature check — that belongs to this user, is verified, and has
    // not already been used for a different order.
    let verifiedPayment = null;
    if (paymentMethod === 'ONLINE') {
      if (!razorpayOrderId) {
        return res.status(400).json({
          success: false,
          message: 'Online payment must be completed before placing order',
        });
      }

      verifiedPayment = await VerifiedPayment.findOne({ razorpayOrderId });
      if (
        !verifiedPayment ||
        verifiedPayment.user.toString() !== req.user._id.toString() ||
        !verifiedPayment.verified ||
        verifiedPayment.consumedAt
      ) {
        return res.status(400).json({
          success: false,
          message: 'We could not verify this payment. Please try paying again.',
        });
      }
    }

    // ── Shadowfax pre-flight: courier/package weight cap ──
    // A single AWB = a single package, and Shadowfax pickup for this
    // warehouse is capped at 7kg per order. Checked here (authoritative)
    // in addition to the client-side check in CheckoutPage, since the
    // client check is UX only.
    const cfg = getShadowfaxConfig();
    const totalWeightGrams = calcTotalWeightGrams(cart.items, cfg.defaultItemWeightGrams);
    if (totalWeightGrams > cfg.maxOrderWeightGrams) {
      return res.status(400).json({
        success: false,
        message: `This order weighs ${(totalWeightGrams / 1000).toFixed(2)}kg, which is over the ${(cfg.maxOrderWeightGrams / 1000).toFixed(1)}kg limit for a single shipment. Please split it into two orders.`,
      });
    }

    // ── Shadowfax pre-flight: delivery pincode serviceability ──
    // Re-validated here even though CheckoutPage already checks this
    // before submit — the server check is the authoritative one, exactly
    // like the pricing recalculation below.
    const deliveryPincode = shippingAddress.pincode;
    if (deliveryPincode) {
      try {
        const { serviceable } = await shadowfaxService.checkPincodeServiceability(deliveryPincode);
        if (!serviceable) {
          return res.status(400).json({
            success: false,
            message: `Sorry, we currently can't deliver to pincode ${deliveryPincode}.`,
          });
        }
      } catch (svcErr) {
        // If the serviceability check itself fails (Shadowfax outage,
        // bad token, etc.), don't block checkout on it — log and
        // continue. The shipment-creation step below will surface a
        // clearer error if the pincode really is invalid.
        console.warn('Shadowfax pincode check failed, continuing:', svcErr.message);
      }
    }

    // Recalculate everything from the persisted cart — this is the
    // authoritative total. It must match what paymentController charged
    // for ONLINE orders, since both go through calculateCartTotals().
    const { subtotal, shippingCharge, discount, total, promo } =
      await calculateCartTotals(cart.items, promoCode);

    // The amount the customer actually paid (verifiedPayment.amount, set
    // when the Razorpay order was created) must match what the cart
    // charges right now. If the cart changed after payment was created
    // (promo expired, price changed, items edited in another tab), the
    // amounts won't match — reject rather than silently placing an order
    // for a different total than what was paid.
    if (verifiedPayment && verifiedPayment.amount !== Math.round(total * 100)) {
      return res.status(400).json({
        success: false,
        message: 'Your cart changed after payment. Please contact support with your payment ID.',
      });
    }

    if (promo) {
      await Promo.findByIdAndUpdate(promo._id, {
        $inc: { uses: 1 },
      });
    }

    // Cart items store the size label under `size`; order items store it
    // under `size` too (see orderItemSchema) — map explicitly rather than
    // spreading cart.items, since Mongoose's strict schema would silently
    // drop any field name it doesn't already declare.
    const orderItems = cart.items.map((item) => ({
      product: item.product,
      name: item.name,
      img: item.img,
      size: item.size,
      price: item.price,
      qty: item.qty,
    }));

    const order =
      await Order.create({
        user: req.user._id,
        items: orderItems,
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
          verifiedPayment?.razorpayOrderId ||
          '',

        razorpayPaymentId:
          verifiedPayment?.razorpayPaymentId ||
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

    if (verifiedPayment) {
      verifiedPayment.consumedAt = new Date();
      await verifiedPayment.save();
    }

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

    // Shipment creation is now a deliberate admin action (see the note
    // at the top of this file) — nothing to do here for Shadowfax.

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
