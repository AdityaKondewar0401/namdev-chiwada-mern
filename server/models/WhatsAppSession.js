const mongoose = require('mongoose');

// ── Attribution — where did this conversation come from? ─────────────────
// Captured once, from the FIRST inbound message of a fresh conversation,
// and never overwritten afterward (see whatsappBotService) so a customer
// who later says "hi" mid-flow doesn't wipe out how they originally found
// us. Three ways a chat can start, per the business requirement that
// customers order "through the website or through boosted Instagram or
// Meta ads", in addition to organic (typing the number in themselves):
//   - 'organic' — customer messaged the number directly (saved contact,
//                 found it themselves, etc). The default when nothing
//                 else matches.
//   - 'website' — customer tapped the site's "Order on WhatsApp" button
//                 (see client/src/components/OrderOnWhatsAppButton.jsx),
//                 which pre-fills a recognizable phrase into the wa.me
//                 link (parsed in whatsappBotService.detectWebsiteEntry).
//   - 'ad'      — a Meta "Click-to-WhatsApp" ad. Meta includes a
//                 `referral` object on the first inbound message in this
//                 case — see https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components#referral-messages
const attributionSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['organic', 'website', 'ad'],
    default: 'organic',
  },
  // Which product the customer was looking at when they tapped the
  // website CTA (slug) — lets the bot jump straight to that product's
  // size picker instead of showing the generic 2-item menu.
  entryProductSlug: { type: String },
  // Populated only when source === 'ad', straight from Meta's inbound
  // `referral` object — kept as a flat mirror of Meta's own field names
  // (snake_case) so it's easy to cross-reference against Ads Manager /
  // Events Manager without a name-mapping table.
  referral: {
    source_type: { type: String },   // "ad" | "post" | ...
    source_id: { type: String },     // Meta ad id
    source_url: { type: String },
    headline: { type: String },
    body: { type: String },
    media_type: { type: String },
    image_url: { type: String },
    video_url: { type: String },
    thumbnail_url: { type: String },
    ctwa_clid: { type: String },     // Click-to-WhatsApp click id — the actual ad-conversion join key
  },
}, { _id: false });

const whatsAppSessionSchema = new mongoose.Schema({
  // E.164 digits, no "+" (matches the `from` field Meta sends), e.g. "919876543210".
  phone: { type: String, required: true, unique: true, index: true },
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  state: {
    type: String,
    enum: ['idle', 'browsing', 'choosing_size', 'awaiting_qty', 'awaiting_address', 'confirming'],
    default: 'idle',
  },

  // Free-form scratch space for the in-progress order: productId,
  // sizeWeight, qty, draft shippingAddress fields. Cleared back to {} on
  // every order placed / cancel / restart.
  context: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },

  attribution: { type: attributionSchema, default: () => ({}) },

  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.WhatsAppSession || mongoose.model('WhatsAppSession', whatsAppSessionSchema);
