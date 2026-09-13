// server/config/whatsapp.js
//
// Central config for the WhatsApp Cloud API (Meta) ordering bot. Nothing
// here is secret except WHATSAPP_ACCESS_TOKEN, WHATSAPP_VERIFY_TOKEN, and
// WHATSAPP_APP_SECRET, all of which live in `.env` — never hardcode a real
// value here. Mirrors config/shadowfax.js's shape: one function, reads
// everything from process.env with defaults, returns one plain object.
//
// Phase 0 (see the implementation plan): every value below is set to
// Meta's FREE TEST phone number's credentials while the bot is being
// built and tested. Cutting over to the real, already-live business
// number later is purely an env-var change on Render — no code changes.

function getWhatsAppConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';
  const appSecret = process.env.WHATSAPP_APP_SECRET || '';

  // Graph API version — pinned explicitly rather than trusting Meta's
  // unversioned default, so a future Graph API breaking change can't
  // silently start failing every call without a deliberate bump here.
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || 'v21.0';
  const graphApiBaseUrl = `https://graph.facebook.com/${graphApiVersion}`;

  // The business's own display phone number (E.164, digits only — e.g.
  // "919130160491"), used only to recognize/log which number a message
  // arrived on and for any customer-facing "message us at" copy. This is
  // NOT the same as phoneNumberId (Meta's internal id for the number).
  const displayPhoneNumber = process.env.WHATSAPP_DISPLAY_PHONE_NUMBER || '';

  return {
    phoneNumberId,
    businessAccountId,
    accessToken,
    verifyToken,
    appSecret,
    graphApiVersion,
    graphApiBaseUrl,
    displayPhoneNumber,
  };
}

module.exports = { getWhatsAppConfig };
