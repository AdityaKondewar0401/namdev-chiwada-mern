// server/config/shadowfax.js
//
// Central config for the Shadowfax Forward Operations (Warehouse - Order
// Creation) integration. Nothing in here is secret except SHADOWFAX_AUTH_TOKEN
// and SHADOWFAX_WEBHOOK_TOKEN, both of which live in `.env` — never hardcode
// a real token here.
//
// Environment (`SHADOWFAX_ENV`) picks the base URL:
//   staging    -> https://dale.staging.shadowfax.in/api
//   production -> https://dale.shadowfax.in/api
//
// Everything else (pickup warehouse address, RTO address, max package
// weight) is also environment-driven so this file never needs to change
// when the business details change — only `.env` does.

const SHADOWFAX_STAGING_BASE_URL = 'https://dale.staging.shadowfax.in/api';
const SHADOWFAX_PRODUCTION_BASE_URL = 'https://dale.shadowfax.in/api';

function getShadowfaxConfig() {
  const env = (process.env.SHADOWFAX_ENV || 'staging').toLowerCase();
  const baseUrl =
    process.env.SHADOWFAX_BASE_URL ||
    (env === 'production' ? SHADOWFAX_PRODUCTION_BASE_URL : SHADOWFAX_STAGING_BASE_URL);

  const authToken = process.env.SHADOWFAX_AUTH_TOKEN || '';

  // Namdev Chiwda's own warehouse — this is the pickup point for every
  // forward order. There is deliberately no separate RTO address: the
  // business does not want a returns workflow, so RTO details always
  // mirror the pickup warehouse (Shadowfax's API requires an rto_details
  // object even when you don't want a distinct return flow).
  const pickup = {
    name: process.env.SHADOWFAX_PICKUP_CONTACT_NAME || 'Prashant Kondewar',
    contact: process.env.SHADOWFAX_PICKUP_CONTACT_PHONE || '9130160491',
    address_line_1:
      process.env.SHADOWFAX_PICKUP_ADDRESS_LINE1 ||
      '205/A, Suhas Bldg, Killa Road, Goldfinch Peth, near DCC Bank',
    address_line_2: process.env.SHADOWFAX_PICKUP_ADDRESS_LINE2 || '',
    city: process.env.SHADOWFAX_PICKUP_CITY || 'Solapur',
    state: process.env.SHADOWFAX_PICKUP_STATE || 'Maharashtra',
    pincode: Number(process.env.SHADOWFAX_PICKUP_PINCODE || 413007),
    unique_code: process.env.SHADOWFAX_PICKUP_UNIQUE_CODE || 'namdev-chiwada-warehouse',
  };

  const gstinNumber = process.env.SHADOWFAX_GSTIN || '';

  // Business rule: a single order/package must not exceed 7 kg. Enforced
  // both client-side (checkout UX) and server-side (authoritative, in
  // orderController.placeOrder) before an order is even created.
  const maxOrderWeightGrams = Number(process.env.SHADOWFAX_MAX_ORDER_WEIGHT_GRAMS || 7000);

  // Default per-order fallback weight (grams) used only when a cart line's
  // size string can't be parsed into a weight (should be rare/never).
  const defaultItemWeightGrams = Number(process.env.SHADOWFAX_DEFAULT_ITEM_WEIGHT_GRAMS || 250);

  return {
    env,
    baseUrl,
    authToken,
    pickup,
    // Same physical location as pickup — see note above.
    rto: { ...pickup },
    gstinNumber,
    maxOrderWeightGrams,
    defaultItemWeightGrams,
    webhookToken: process.env.SHADOWFAX_WEBHOOK_TOKEN || '',
  };
}

module.exports = { getShadowfaxConfig };
