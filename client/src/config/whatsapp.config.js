// client/src/config/whatsapp.config.js
//
// Single source of truth for the website's "Order on WhatsApp" entry
// point — the site-side half of the WhatsApp ordering bot (the other half
// is server/services/whatsappBotService.js).
//
// VITE_WHATSAPP_BOT_NUMBER is deliberately its OWN env var, separate from
// WhatsAppFloat's `phone` prop (919130160491 — the real number, already
// live in the regular WhatsApp Business app for support chats). Phase 0 of
// the bot plan builds and tests everything against Meta's FREE TEST
// number first, since migrating the real number to the Cloud API is a
// one-way step. Pointing this button at the real number before the bot is
// actually running there would silently send real customers' order
// attempts into a plain WhatsApp Business inbox with no bot listening.
// So: no hardcoded fallback to the real number here — if this env var
// isn't set yet, the button hides itself (see OrderOnWhatsAppButton.jsx)
// rather than guessing wrong. Once Phase 0's real-number cutover happens,
// this is a one-line env var change on Vercel — no code changes.
export const WHATSAPP_BOT_NUMBER = import.meta.env.VITE_WHATSAPP_BOT_NUMBER || '';

// Recognized by whatsappBotService.findEntryProduct on the backend — the
// bot looks for `(<slug>)` anywhere in the customer's first message and,
// if it matches a real product, jumps straight to that product's size
// picker instead of showing the generic 2-item menu. Keep this in sync
// with that regex if the format ever changes.
export function buildWhatsAppOrderLink(product) {
  const text = product
    ? `Hi! I'd like to order ${product.name} (${product.slug}) via WhatsApp.`
    : "Hi! I'd like to place an order via WhatsApp.";
  return `https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${encodeURIComponent(text)}`;
}
