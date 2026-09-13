// server/services/whatsappBotService.js
//
// The actual WhatsApp ordering conversation — kept separate from the thin
// webhook controller (routes/whatsapp.js), matching this codebase's
// controller-stays-thin convention (see shippingController vs
// shadowfaxService for the same split).
//
// WhatsApp's webhook is stateless — every inbound message is an
// independent HTTP call — so all "where is this customer in the flow"
// memory lives in WhatsAppSession, looked up/saved once per message.
//
// Flow (see the implementation plan's Phase 2):
//   idle -> browsing -> choosing_size -> awaiting_qty -> awaiting_address -> confirming -> (order placed) -> idle
// "cancel"/"menu"/"hi" reset to idle from any state.
//
// Entry points (the reason this system exists — see plan's newest
// requirement): a fresh conversation's origin is detected once, at
// session creation, and stored on WhatsAppSession.attribution:
//   - Meta 'referral' object on the inbound message -> a Click-to-WhatsApp
//     Instagram/Facebook ad brought them here.
//   - The message text matches the website CTA's pre-filled pattern
//     (see client/src/components/OrderOnWhatsAppButton.jsx) -> the website.
//   - Otherwise -> organic.
// Separately (and on EVERY "start a new order" message, not just the
// first ever), if the message text names a real product slug, the bot
// skips the generic 2-item menu and jumps straight to that product's size
// picker — this is what makes the website "Order on WhatsApp" button on a
// specific product page actually land the customer on that product.

const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const WhatsAppSession = require('../models/WhatsAppSession');
const { createOrderForUser } = require('../utils/orderCreation');
const { calculateCartTotals } = require('../utils/pricing');
const whatsappService = require('./whatsappService');

const GLOBAL_RESET_WORDS = new Set(['hi', 'hello', 'hey', 'menu', 'start', 'restart', 'namaste']);
const CANCEL_WORDS = new Set(['cancel', 'stop', 'no']);
const CONFIRM_WORDS = new Set(['yes', 'y', 'confirm', 'confirm order', 'ok', 'okay']);

// ── Helpers to read an inbound Meta message object ───────────────────────
function getMessageText(message) {
  return (message?.text?.body || '').trim();
}

function getReply(message) {
  // Interactive replies (list row tap / button tap) carry a stable `id` —
  // prefer that over free text since it can't be misspelled by the user.
  const listReply = message?.interactive?.list_reply;
  const buttonReply = message?.interactive?.button_reply;
  if (listReply) return { id: listReply.id, title: listReply.title };
  if (buttonReply) return { id: buttonReply.id, title: buttonReply.title };
  return null;
}

// Matches the `(product-slug)` pattern the website's "Order on WhatsApp"
// button pre-fills (see OrderOnWhatsAppButton.jsx's buildWhatsAppOrderLink).
// Deliberately tolerant of the customer editing surrounding words — only
// the parenthesized slug itself has to survive — since a pre-filled wa.me
// text field is normal, editable text, not a hidden parameter.
function extractSlugCandidates(text) {
  if (!text) return [];
  return [...text.matchAll(/\(([a-z0-9-]{3,60})\)/gi)].map((m) => m[1].toLowerCase());
}

async function findEntryProduct(text) {
  const candidates = extractSlugCandidates(text);
  if (!candidates.length) return null;
  return Product.findOne({ slug: { $in: candidates }, inStock: true });
}

function formatSizeLabel(size) {
  return `${size.weight} · ₹${size.price}`;
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

// ── Attribution — computed once, only when a session is first created ───
async function buildAttributionForNewSession({ referral, entryText }) {
  if (referral) {
    return {
      source: 'ad',
      referral: {
        source_type: referral.source_type,
        source_id: referral.source_id,
        source_url: referral.source_url,
        headline: referral.headline,
        body: referral.body,
        media_type: referral.media_type,
        image_url: referral.image_url,
        video_url: referral.video_url,
        thumbnail_url: referral.thumbnail_url,
        ctwa_clid: referral.ctwa_clid,
      },
    };
  }

  const entryProduct = await findEntryProduct(entryText);
  if (entryProduct) {
    return { source: 'website', entryProductSlug: entryProduct.slug };
  }

  return { source: 'organic' };
}

async function resetToIdle(session) {
  session.state = 'idle';
  session.context = {};
  await session.save();
}

// ── Step senders — each returns nothing, just sends + the caller sets state ──
async function sendGreetingAndMenu(to) {
  const products = await Product.find({ inStock: true }).sort({ sortOrder: 1 });
  if (!products.length) {
    await whatsappService.sendTextMessage(to, "Sorry, we're temporarily not taking orders here. Please try again shortly! 🙏");
    return;
  }

  await whatsappService.sendListMessage(to, {
    header: 'Namdev Chiwda',
    bodyText: "Namaste! 🙏 Welcome to Namdev Chiwda — authentic Solapuri Chiwda since 1873.\n\nWhat would you like to order today?",
    buttonLabel: 'View Products',
    sections: [
      {
        title: 'Our Products',
        rows: products.map((p) => ({
          id: `product_${p.slug}`,
          title: p.name.slice(0, 24),
          // "From ₹X" only makes sense with multiple price tiers — a
          // single-size product (both are, as of the 200g-only catalog
          // correction) just gets its one price.
          description: `${p.sizes?.length > 1 ? 'From ' : ''}${money(p.price)}${p.badge ? ` · ${p.badge}` : ''}`.slice(0, 72),
        })),
      },
    ],
  });
}

async function sendSizePicker(to, product) {
  await whatsappService.sendButtonsMessage(
    to,
    `Great choice! *${product.name}* 🥨\n\nWhich size would you like?`,
    product.sizes.map((s) => ({ id: `size_${s.weight}`, title: formatSizeLabel(s) }))
  );
}

async function sendQtyPrompt(to, product, size) {
  await whatsappService.sendTextMessage(
    to,
    `*${product.name} (${size.weight})* — ${money(size.price)} each.\n\nHow many packets would you like? (Reply with a number, e.g. "2")`
  );
}

// A product with exactly one size (both products are single-size — 200g —
// as of the latest catalog correction) has nothing to actually choose, so
// asking "which size?" over a single button is pointless friction. Skip
// straight to quantity in that case; only show the size picker when there
// really is a choice to make (kept generic rather than hardcoded to 1, in
// case a multi-size product is ever added back).
async function proceedAfterProductChosen(to, session, product) {
  if (product.sizes.length === 1) {
    const only = product.sizes[0];
    session.context = { ...session.context, size: { weight: only.weight, price: only.price } };
    session.state = 'awaiting_qty';
    await session.save();
    await sendQtyPrompt(to, product, only);
    return;
  }
  session.state = 'choosing_size';
  await session.save();
  await sendSizePicker(to, product);
}

const ADDRESS_TEMPLATE =
  'Please send your delivery address as 6 lines, exactly like this:\n\n' +
  'Full Name\nPhone Number\nHouse No, Street, Area\nCity\nState\nPincode\n\n' +
  'Example:\nRahul Sharma\n9876543210\n12 MG Road, Near Bus Stand\nSolapur\nMaharashtra\n413001';

function parseAddress(text) {
  const lines = (text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 6) return null;

  const [fullName, phone, line1, city, state, pincode] = lines;
  if (!/^\d{10}$/.test(phone.replace(/\D/g, '').slice(-10))) return null;
  if (!/^\d{6}$/.test(pincode.replace(/\D/g, ''))) return null;

  return {
    fullName,
    phone: phone.replace(/\D/g, '').slice(-10),
    line1,
    city,
    state,
    pincode: pincode.replace(/\D/g, ''),
  };
}

async function sendOrderSummary(to, { product, size, qty, address }) {
  const { subtotal, shippingCharge, discount, total } = await calculateCartTotals([
    { price: size.price, qty },
  ]);

  const lines = [
    '📋 *Order Summary*',
    '',
    `${product.name} (${size.weight}) × ${qty} — ${money(size.price * qty)}`,
    '',
    `Subtotal: ${money(subtotal)}`,
    shippingCharge ? `Shipping: ${money(shippingCharge)}` : 'Shipping: FREE 🚚',
    discount ? `Discount: -${money(discount)}` : null,
    `*Total: ${money(total)}*`,
    '',
    '📍 Delivering to:',
    `${address.fullName}, ${address.phone}`,
    `${address.line1}, ${address.city}, ${address.state} - ${address.pincode}`,
    '',
    '💵 Payment: Cash on Delivery',
    '',
    'Shall I place this order?',
  ].filter(Boolean);

  await whatsappService.sendButtonsMessage(to, lines.join('\n'), [
    { id: 'confirm_yes', title: '✅ Confirm Order' },
    { id: 'confirm_no', title: '✏️ Start Over' },
  ]);
}

// ── Find-or-create a lightweight User for a WhatsApp customer ────────────
// Mirrors the existing "password optional" pattern already used for
// Google-login users (see models/User.js) — no password is ever set, so
// this account simply can't be used to log into the website with a
// password unless the customer later sets one via a real signup/reset
// flow. `email` is schema-required+unique, so a synthetic placeholder is
// used since WhatsApp never gives us a real one — same idea as any
// phone-first onboarding bolted onto an email-first user table.
// NOTE (known v1 limitation, not a bug): this matches purely on the exact
// phone digits WhatsApp sends. A customer who already has a website
// account under a differently-formatted phone number gets a second,
// separate User here rather than being merged — acceptable for launch,
// called out in the plan as a fast-follow rather than a blocker.
async function findOrCreateWhatsAppUser(phone, displayName) {
  let user = await User.findOne({ phone });
  if (user) return user;

  user = await User.create({
    name: displayName || 'WhatsApp Customer',
    email: `whatsapp-${phone}@wa.customers.namdevchiwda.local`,
    phone,
    isVerified: false,
  });
  return user;
}

// ── Main entry point — called once per inbound message by routes/whatsapp.js ──
async function handleInboundMessage({ from, message, contactName, referral }) {
  const text = getMessageText(message);
  const reply = getReply(message);
  const normalizedText = text.toLowerCase();
  const replyId = reply?.id || '';

  let session = await WhatsAppSession.findOne({ phone: from });
  if (!session) {
    const attribution = await buildAttributionForNewSession({ referral, entryText: text });
    session = await WhatsAppSession.create({ phone: from, attribution });
  }
  // Saved right away (rather than relying on one of the branches below to
  // save it) since several branches below only send a reply and return
  // without otherwise touching the session — this field would silently
  // never persist on those paths otherwise.
  session.lastMessageAt = new Date();
  await session.save();

  // ── Global commands — win over whatever state we're in ──
  if (CANCEL_WORDS.has(normalizedText) && session.state !== 'idle') {
    await resetToIdle(session);
    await whatsappService.sendTextMessage(from, "No problem, I've cancelled that. Type *menu* anytime to start a new order. 🙏");
    return;
  }

  // Starting a fresh flow: either a message naming a specific product (the
  // website CTA case — always takes the customer straight to that product,
  // regardless of state, rather than making them cancel first), the very
  // first message from a brand-new session, or an explicit "hi"/"menu".
  const entryProduct = await findEntryProduct(text);

  if (entryProduct) {
    session.context = { productId: String(entryProduct._id) };
    await proceedAfterProductChosen(from, session, entryProduct);
    return;
  }

  if (session.state === 'idle') {
    // Very first message of a session (or a returning customer after a
    // completed/cancelled order reset it back to idle).
    await sendGreetingAndMenu(from);
    session.state = 'browsing';
    await session.save();
    return;
  }

  if (GLOBAL_RESET_WORDS.has(normalizedText)) {
    // Explicit "menu"/"hi" mid-flow — restart cleanly rather than bolting
    // a new selection onto stale context.
    await resetToIdle(session);
    await sendGreetingAndMenu(from);
    session.state = 'browsing';
    await session.save();
    return;
  }

  // ── State machine ──
  switch (session.state) {
    case 'browsing': {
      const slug = replyId.startsWith('product_') ? replyId.slice('product_'.length) : null;
      const product = slug ? await Product.findOne({ slug, inStock: true }) : null;
      if (!product) {
        await whatsappService.sendTextMessage(from, "Please tap one of the products from the list above, or type *menu* to see it again.");
        return;
      }
      session.context = { productId: String(product._id) };
      await proceedAfterProductChosen(from, session, product);
      return;
    }

    case 'choosing_size': {
      const product = await Product.findById(session.context.productId);
      const weight = replyId.startsWith('size_') ? replyId.slice('size_'.length) : null;
      const size = product?.sizes?.find((s) => s.weight === weight);
      if (!product || !size) {
        await whatsappService.sendTextMessage(from, 'Please tap one of the size buttons above. 🙏');
        return;
      }
      session.context = { ...session.context, size: { weight: size.weight, price: size.price } };
      session.state = 'awaiting_qty';
      await session.save();
      await sendQtyPrompt(from, product, size);
      return;
    }

    case 'awaiting_qty': {
      const qty = parseInt(normalizedText, 10);
      if (!Number.isFinite(qty) || qty < 1 || qty > 20) {
        await whatsappService.sendTextMessage(from, 'Please reply with just the number of packets you want (1-20).');
        return;
      }
      session.context = { ...session.context, qty };
      session.state = 'awaiting_address';
      await session.save();
      await whatsappService.sendTextMessage(from, ADDRESS_TEMPLATE);
      return;
    }

    case 'awaiting_address': {
      const address = parseAddress(text);
      if (!address) {
        await whatsappService.sendTextMessage(from, "Hmm, that didn't quite match. " + ADDRESS_TEMPLATE);
        return;
      }
      const product = await Product.findById(session.context.productId);
      if (!product) {
        await resetToIdle(session);
        await whatsappService.sendTextMessage(from, "Sorry, something went wrong with that product. Type *menu* to start again.");
        return;
      }
      session.context = { ...session.context, address };
      session.state = 'confirming';
      await session.save();
      await sendOrderSummary(from, { product, size: session.context.size, qty: session.context.qty, address });
      return;
    }

    case 'confirming': {
      if (replyId === 'confirm_no' || CANCEL_WORDS.has(normalizedText)) {
        await resetToIdle(session);
        await whatsappService.sendTextMessage(from, "No problem — cancelled. Type *menu* to start over. 🙏");
        return;
      }
      if (replyId !== 'confirm_yes' && !CONFIRM_WORDS.has(normalizedText)) {
        await whatsappService.sendTextMessage(from, 'Please tap *✅ Confirm Order* to place it, or *✏️ Start Over* to cancel.');
        return;
      }

      const { productId, size, qty, address } = session.context;
      const product = await Product.findById(productId);
      if (!product) {
        await resetToIdle(session);
        await whatsappService.sendTextMessage(from, 'Sorry, something went wrong. Type *menu* to start again.');
        return;
      }

      const user = await findOrCreateWhatsAppUser(from, contactName);
      session.user = user._id;

      await Cart.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          items: [{ product: product._id, name: product.name, img: product.img, price: size.price, size: size.weight, qty }],
        },
        { upsert: true }
      );

      const result = await createOrderForUser({
        userId: user._id,
        shippingAddress: address,
        paymentMethod: 'COD',
        attribution: {
          channel: 'whatsapp',
          source: session.attribution?.source,
          referral: {
            source_id: session.attribution?.referral?.source_id,
            headline: session.attribution?.referral?.headline,
            ctwa_clid: session.attribution?.referral?.ctwa_clid,
          },
        },
      });

      if (!result.success) {
        await whatsappService.sendTextMessage(from, `Sorry, I couldn't place that order: ${result.message}\n\nType *menu* to try again.`);
        await resetToIdle(session);
        return;
      }

      const orderShort = String(result.order._id).slice(-8).toUpperCase();
      await whatsappService.sendTextMessage(
        from,
        `🎉 Order confirmed, ${address.fullName.split(' ')[0]}!\n\n` +
        `Order #${orderShort}\n${product.name} (${size.weight}) × ${qty}\n*Total: ${money(result.order.total)}* — Cash on Delivery\n\n` +
        `We'll message you once it ships. Thank you for choosing Namdev Chiwda! 🌾`
      );
      await resetToIdle(session);
      return;
    }

    default: {
      await sendGreetingAndMenu(from);
      session.state = 'browsing';
      await session.save();
    }
  }
}

module.exports = { handleInboundMessage };
