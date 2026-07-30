/*
  WhatsApp sending via Twilio's WhatsApp API.

  WHY TWILIO: no Meta Business verification wait to start building —
  Twilio's sandbox works immediately for development, and production
  just needs a paid Twilio number approved for WhatsApp later. Swapping
  to Meta's Cloud API later only means rewriting this one file.

  SETUP REQUIRED (see .env):
  - TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN: from the Twilio console
  - TWILIO_WHATSAPP_FROM: your Twilio WhatsApp sender, e.g.
    'whatsapp:+14155238886' (the shared sandbox number until you have
    your own approved sender)

  Mirrors config/email.js's pattern exactly: warn once at startup if
  unconfigured, and every send call no-ops with a console.warn instead
  of throwing — so the rest of the app (partner invites, reminders)
  never breaks just because WhatsApp isn't set up yet.
*/

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

let client = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio configured — WhatsApp sending ready');
} else {
  console.warn('⚠️ TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN not set — WhatsApp messages will be skipped.');
}

// Accepts numbers as '9130160491', '+919130160491', or already-prefixed
// 'whatsapp:+919130160491' — normalizes to what Twilio expects.
// Defaults to +91 (India) since that's this business's market; pass a
// full +<countrycode> number for anything else.
function formatWhatsAppNumber(raw) {
  if (!raw) return null;
  if (raw.startsWith('whatsapp:')) return raw;
  const digits = raw.replace(/[^\d+]/g, '');
  const withCountryCode = digits.startsWith('+') ? digits : `+91${digits}`;
  return `whatsapp:${withCountryCode}`;
}

/*
  Sends a single WhatsApp message. Returns null (does not throw) if
  Twilio isn't configured or no phone number was provided — callers
  should treat a null return as "skipped," not as success.
*/
async function sendWhatsApp({ to, body }) {
  if (!client) {
    console.warn('sendWhatsApp: Twilio not configured, skipping');
    return null;
  }
  const formattedTo = formatWhatsAppNumber(to);
  if (!formattedTo) {
    console.warn('sendWhatsApp: no phone number provided, skipping');
    return null;
  }

  return client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: formattedTo,
    body,
  });
}

module.exports = { sendWhatsApp };
