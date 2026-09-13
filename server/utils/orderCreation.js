// server/utils/orderCreation.js
//
// Shared order-placement core, extracted from orderController.placeOrder
// so the WhatsApp bot (services/whatsappBotService.js) can create real
// orders through the exact same path as the website checkout — same
// stock check, same Shadowfax preflight, same calculateCartTotals
// (single source of truth for totals), same atomic cart/payment claims.
// See the "Placing the real order" section of the WhatsApp bot plan for
// why this was extracted instead of duplicating the logic: this app's own
// utils/pricing.js is explicitly documented as the one place order totals
// are computed — a second hand-rolled path is exactly how a mismatch
// happens.
//
// This is a behavior-preserving refactor: orderController.placeOrder's
// logic is unchanged, just moved here and parameterized on `userId`
// instead of reading `req.user._id` directly, with res.status().json()
// calls turned into `{ success: false, statusCode, message }` returns so
// both an Express controller and a WhatsApp text reply can consume the
// same result shape.

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Promo = require('../models/Promo');
const Product = require('../models/Product');
const VerifiedPayment = require('../models/VerifiedPayment');
const { sendOrderConfirmation } = require('../services/emailService');
const { calculateCartTotals } = require('./pricing');
const shadowfaxService = require('../services/shadowfaxService');
const { getShadowfaxConfig } = require('../config/shadowfax');
const { calcTotalWeightGrams } = require('./weight');

/**
 * @param {Object} params
 * @param {string} params.userId
 * @param {Object} params.shippingAddress
 * @param {string} [params.paymentMethod]   'COD' | 'ONLINE' — defaults to 'COD'
 * @param {string} [params.razorpayOrderId] required when paymentMethod === 'ONLINE'
 * @param {string} [params.promoCode]
 * @param {string} [params.notes]
 * @param {boolean} [params.marketingConsent]
 * @param {Object} [params.attribution]     see models/Order.js attributionSchema;
 *   defaults to `{ channel: 'website' }` so the existing HTTP checkout
 *   call site needs no changes to keep its current behavior.
 * @returns {Promise<{success:true, order:Object}|{success:false, statusCode:number, message:string}>}
 */
async function createOrderForUser({
  userId,
  shippingAddress,
  paymentMethod,
  razorpayOrderId,
  promoCode,
  notes,
  marketingConsent,
  attribution,
}) {
  if (!shippingAddress) {
    return { success: false, statusCode: 400, message: 'Shipping address is required' };
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    return { success: false, statusCode: 400, message: 'Cart is empty' };
  }

  // Re-check stock at checkout time, not just at add-to-cart time — a
  // product can go out of stock while it's sitting in someone's cart.
  const cartProducts = await Product.find({
    _id: { $in: cart.items.map((item) => item.product) },
  }).select('inStock');
  const inStockById = new Map(cartProducts.map((p) => [p._id.toString(), p.inStock]));
  // A product missing from this map was deleted after being added to the
  // cart — inStockById.get(...) would return undefined, which is !== false
  // and would silently sail through the old check below. Treat "not found"
  // the same as out-of-stock so a deleted product can never be ordered.
  const outOfStockItem = cart.items.find(
    (item) => inStockById.get(item.product.toString()) !== true
  );
  if (outOfStockItem) {
    return {
      success: false,
      statusCode: 400,
      message: inStockById.has(outOfStockItem.product.toString())
        ? `"${outOfStockItem.name}" just went out of stock. Please remove it from your cart to continue.`
        : `"${outOfStockItem.name}" is no longer available. Please remove it from your cart to continue.`,
    };
  }

  // SECURITY: "was this order actually paid" is never trusted from the
  // caller. For ONLINE orders we require a VerifiedPayment record —
  // created by paymentController.createPaymentOrder and only marked
  // `verified` by paymentController.verifyPayment after a real HMAC
  // signature check — that belongs to this user, is verified, and has
  // not already been used for a different order.
  let verifiedPayment = null;
  if (paymentMethod === 'ONLINE') {
    if (!razorpayOrderId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Online payment must be completed before placing order',
      };
    }

    verifiedPayment = await VerifiedPayment.findOne({ razorpayOrderId });
    if (
      !verifiedPayment ||
      verifiedPayment.user.toString() !== userId.toString() ||
      !verifiedPayment.verified ||
      verifiedPayment.consumedAt
    ) {
      return {
        success: false,
        statusCode: 400,
        message: 'We could not verify this payment. Please try paying again.',
      };
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
    return {
      success: false,
      statusCode: 400,
      message: `This order weighs ${(totalWeightGrams / 1000).toFixed(2)}kg, which is over the ${(cfg.maxOrderWeightGrams / 1000).toFixed(1)}kg limit for a single shipment. Please split it into two orders.`,
    };
  }

  // ── Shadowfax pre-flight: delivery pincode serviceability ──
  // Re-validated here even though CheckoutPage/the bot already checks
  // this before submit — the server check is the authoritative one,
  // exactly like the pricing recalculation below.
  const deliveryPincode = shippingAddress.pincode;
  if (deliveryPincode) {
    try {
      const { serviceable } = await shadowfaxService.checkPincodeServiceability(deliveryPincode);
      if (!serviceable) {
        return {
          success: false,
          statusCode: 400,
          message: `Sorry, we currently can't deliver to pincode ${deliveryPincode}.`,
        };
      }
    } catch (svcErr) {
      // If the serviceability check itself fails (Shadowfax outage, bad
      // token, etc.), don't block checkout on it — log and continue. The
      // shipment-creation step below will surface a clearer error if the
      // pincode really is invalid.
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
    return {
      success: false,
      statusCode: 400,
      message: 'Your cart changed after payment. Please contact support with your payment ID.',
    };
  }

  // Atomically claim this payment before creating the order — two
  // concurrent requests (double-click, client retry) racing on the same
  // VerifiedPayment must not both pass the earlier read-only check above
  // and both create an order. Only the request that flips consumedAt
  // from null wins; the loser is rejected here instead of fulfilling the
  // same payment twice.
  if (verifiedPayment) {
    verifiedPayment = await VerifiedPayment.findOneAndUpdate(
      { _id: verifiedPayment._id, consumedAt: null },
      { consumedAt: new Date() },
      { new: true }
    );
    if (!verifiedPayment) {
      return {
        success: false,
        statusCode: 400,
        message: 'This payment has already been used for another order.',
      };
    }
  }

  // Atomically claim the cart, the same way the payment is claimed above
  // for ONLINE orders. COD has no VerifiedPayment record to guard it, so
  // without this, two concurrent calls (double-click, a client retry
  // after a slow response, or — for WhatsApp — the customer double-tapping
  // "confirm") both pass every check above against the same still-full
  // cart and both create a separate Order — silently duplicating it. Only
  // the request that flips the cart from "has items" to empty wins this
  // match; the other gets null back and is rejected before it can create
  // a duplicate order.
  const claimedCart = await Cart.findOneAndUpdate(
    { _id: cart._id, 'items.0': { $exists: true } },
    { items: [] },
    { new: false }
  );
  if (!claimedCart) {
    if (verifiedPayment) {
      await VerifiedPayment.updateOne({ _id: verifiedPayment._id }, { consumedAt: null });
    }
    return { success: false, statusCode: 400, message: 'This order has already been placed.' };
  }

  // Cart items store the size label under `size`; order items store it
  // under `size` too (see orderItemSchema) — map explicitly rather than
  // spreading cart.items, since Mongoose's strict schema would silently
  // drop any field name it doesn't already declare.
  const orderItems = claimedCart.items.map((item) => ({
    product: item.product,
    name: item.name,
    img: item.img,
    size: item.size,
    price: item.price,
    qty: item.qty,
  }));

  let order;
  try {
    order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,

      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'ONLINE' ? 'paid' : 'pending',

      // Left undefined (not '') for COD orders — razorpayOrderId has a
      // sparse unique index, and a plain '' would collide across every
      // COD order after the first one.
      razorpayOrderId: verifiedPayment?.razorpayOrderId || undefined,
      razorpayPaymentId: verifiedPayment?.razorpayPaymentId || undefined,

      status: paymentMethod === 'ONLINE' ? 'confirmed' : 'pending',

      subtotal,
      shippingCharge,
      discount,
      total,
      promoCode,
      notes,

      attribution: attribution || { channel: 'website' },
    });
  } catch (createErr) {
    // Order was never created — release the payment claim and restore the
    // cart items claimed above, so the customer isn't locked out of
    // retrying (with the same payment, and without having to re-add
    // everything to a cart that looks empty for no reason).
    if (verifiedPayment) {
      await VerifiedPayment.updateOne({ _id: verifiedPayment._id }, { consumedAt: null });
    }
    await Cart.updateOne({ _id: cart._id }, { items: claimedCart.items });
    throw createErr;
  }

  // Only counts against the promo's usage limit once the order it was
  // applied to actually exists.
  if (promo) {
    await Promo.findByIdAndUpdate(promo._id, { $inc: { uses: 1 } });
  }

  // Sync marketing consent captured at checkout onto the user's profile.
  // Only touches the field when the caller explicitly sent a boolean, so
  // unrelated order fields never silently reset consent.
  if (typeof marketingConsent === 'boolean') {
    const currentUser = await User.findById(userId).select('marketingConsent');
    const alreadyConsented = Boolean(
      currentUser?.marketingConsent?.email ||
      currentUser?.marketingConsent?.sms ||
      currentUser?.marketingConsent?.whatsapp
    );

    await User.findByIdAndUpdate(userId, {
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

  // Shipment creation is a deliberate admin action (see orderController) —
  // nothing to do here for Shadowfax.

  // Send order confirmation email — TRANSACTIONAL, so it always sends
  // regardless of marketingConsent. Wrapped so an email failure never
  // breaks the actual order. A WhatsApp customer may have no email (their
  // User record is created phone-first — see whatsappBotService); that's
  // just an empty `to`, which sendOrderConfirmation already has to
  // tolerate for any account created without one.
  try {
    const userForEmail = await User.findById(userId).select('email');
    await sendOrderConfirmation(order, userForEmail?.email);
  } catch (emailErr) {
    console.error('Order confirmation email failed to send:', emailErr.message);
  }

  return { success: true, order };
}

module.exports = { createOrderForUser };
