const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Promo = require('../models/Promo');
const { sendOrderConfirmation } = require('../services/emailService');
const { calculateCartTotals, applyPromoToSubtotal } = require('../utils/pricing');
const shadowfaxService = require('../services/shadowfaxService');
const { getShadowfaxConfig } = require('../config/shadowfax');
const { calcTotalWeightGrams } = require('../utils/weight');

/* =========================================
   SHADOWFAX INTEGRATION HELPER
   Creates the forward delivery request with Shadowfax right after an
   order is persisted, and stores the returned AWB/tracking info on the
   order. This never blocks or fails order placement — a shipping-provider
   outage must not stop a customer's order from going through (same
   philosophy as the transactional-email try/catch below). If creation
   fails, the failure reason is stored on order.courier.error so admins
   can see it and retry manually (see routes/shipping.js resync/create
   endpoints).
========================================= */
async function createShadowfaxShipmentForOrder(order) {
  try {
    const cfg = getShadowfaxConfig();
    if (!cfg.authToken) {
      order.courier.error = 'SHADOWFAX_AUTH_TOKEN not configured — shipment not created.';
      await order.save();
      return;
    }

    const result = await shadowfaxService.createWarehouseOrder(order);

    order.courier.awbNumber = result.awbNumber;
    order.courier.shadowfaxOrderId = result.shadowfaxOrderId;
    order.courier.status = result.status;
    order.courier.statusDisplay = result.statusDisplay;
    order.courier.actualWeightGrams = calcTotalWeightGrams(order.items, cfg.defaultItemWeightGrams);
    order.courier.error = undefined;
    order.courier.lastSyncedAt = new Date();

    // Shadowfax's order-CREATION response never includes a customer
    // tracking URL — that only comes back from their separate tracking
    // endpoint (see shadowfaxService.trackOrder). Fetch it once right away
    // so the "Track shipment" link is visible immediately instead of only
    // appearing after an admin manually hits "Resync". Best-effort: if this
    // one extra call fails (rare — the shipment itself was already created
    // successfully above), it just means the link is missing until the
    // next resync, not that the order/shipment creation failed.
    try {
      const { trackingUrl } = await shadowfaxService.trackOrder(result.awbNumber);
      if (trackingUrl) order.courier.trackingUrl = trackingUrl;
    } catch (trackErr) {
      console.warn(`Could not fetch tracking URL for order ${order._id} (AWB ${result.awbNumber}):`, trackErr.message);
    }

    await order.save();
  } catch (err) {
    console.error(`Shadowfax shipment creation failed for order ${order._id}:`, err.message);
    order.courier.error = err.message;
    await order.save().catch(() => {});
  }
}

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

    // ── Fire the Shadowfax forward order creation now that the order
    // exists. For COD this runs immediately after placement; for ONLINE
    // this runs only once paymentStatus is already 'paid' (enforced by
    // the check above), i.e. "after payment success" per the shipping
    // integration requirements. Never blocks the order response — a
    // Shadowfax outage must not prevent the customer's order from going
    // through; failures are recorded on order.courier.error for retry.
    await createShadowfaxShipmentForOrder(order);

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
