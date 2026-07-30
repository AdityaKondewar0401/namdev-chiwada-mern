// server/utils/pricing.js
//
// Single source of truth for order-total math. Both paymentController
// (create-order amount) and orderController (placeOrder / validatePromo)
// must use this — duplicating the shipping rule / discount math in two
// places is exactly how a ₹499-vs-₹500 style mismatch happens.
//
// Promo codes live in the real `Promo` collection (server/models/Promo.js) —
// NOT an in-memory map. Deliberately does NOT increment promo.uses here;
// that only happens once an order is actually placed (see orderController),
// so merely pricing a cart (e.g. at payment-order-creation time) doesn't
// burn a use.

const Promo = require('../models/Promo');

const FREE_SHIPPING_THRESHOLD = 499;
const STANDARD_SHIPPING = 49;

/**
 * Pure function: given a subtotal and a promo doc (or null), returns the
 * discount amount and whether the promo grants free shipping.
 */
function applyPromoToSubtotal(subtotal, promo) {
  let discount = 0;
  let freeShipping = false;

  if (promo) {
    if (promo.type === 'percent') {
      discount = Math.round((subtotal * promo.value) / 100);
    } else if (promo.type === 'flat') {
      discount = promo.value;
    } else if (promo.type === 'shipping') {
      freeShipping = true;
    }
  }

  return { discount, freeShipping };
}

/**
 * @param {Array} items - cart/order item snapshots, each with `price` and `qty`
 * @param {string} [promoCode]
 * @returns {Promise<{ subtotal:number, shippingCharge:number, discount:number, total:number, promo:object|null }>}
 */
async function calculateCartTotals(items, promoCode) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  let promo = null;
  if (promoCode) {
    promo = await Promo.findOne({
      code: promoCode.toUpperCase(),
      active: true,
    });
  }

  const { discount, freeShipping } = applyPromoToSubtotal(subtotal, promo);

  const shippingCharge = freeShipping
    ? 0
    : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING);

  const total = Math.max(0, subtotal + shippingCharge - discount);

  return { subtotal, shippingCharge, discount, total, promo };
}

module.exports = {
  calculateCartTotals,
  applyPromoToSubtotal,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING,
};