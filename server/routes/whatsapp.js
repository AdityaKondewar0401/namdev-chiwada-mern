// server/routes/whatsapp.js
//
// WhatsApp Cloud API webhook — the one entry point Meta calls for both the
// one-time subscription handshake (GET) and every inbound message/status
// update (POST). Deliberately NOT behind `protect` — Meta calls this
// server-to-server, not as a logged-in user — and instead verified via
// Meta's own signature scheme (POST) / verify token (GET), the same
// "public route, verified inside the handler" shape already established
// for the Shadowfax push-callback webhook (see shippingController.
// handlePushCallback + routes/shipping.js).

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const { getWhatsAppConfig } = require('../config/whatsapp');
const whatsappService = require('../services/whatsappService');
const whatsappBotService = require('../services/whatsappBotService');
const { whatsappWebhookLimiter } = require('../middleware/rateLimiter');

/* =========================================
   GET — Meta's one-time webhook subscription handshake.
   Meta calls this when you click "Verify and Save" in the App Dashboard's
   Webhooks config. Echo back hub.challenge as plain text if hub.verify_token
   matches what's configured; otherwise refuse.
========================================= */
router.get('/webhook', whatsappWebhookLimiter, (req, res) => {
  const { verifyToken } = getWhatsAppConfig();
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (!verifyToken) {
    console.error('WhatsApp webhook verify rejected: WHATSAPP_VERIFY_TOKEN is not configured');
    return res.sendStatus(403);
  }

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/* =========================================
   POST — inbound messages + status updates.

   SECURITY: verified via Meta's X-Hub-Signature-256 header — an HMAC-
   SHA256 of the exact raw request body, keyed with the app secret. Fails
   CLOSED if no app secret is configured (same precedent as Shadowfax's
   webhook: without this, anyone could POST fake customer messages, or
   fake "message received" spoofing, straight into the bot/order flow).
   Must be computed over the raw bytes Meta sent — see server.js's
   express.json({ verify }) for where req.rawBody comes from.
========================================= */
router.post('/webhook', whatsappWebhookLimiter, async (req, res) => {
  const { appSecret } = getWhatsAppConfig();

  if (!appSecret) {
    console.error('WhatsApp webhook rejected: WHATSAPP_APP_SECRET is not configured');
    return res.sendStatus(401);
  }

  const signatureHeader = req.headers['x-hub-signature-256'] || '';
  const expectedHex = crypto
    .createHmac('sha256', appSecret)
    .update(req.rawBody || Buffer.from(''))
    .digest('hex');

  const provided = Buffer.from(signatureHeader.replace(/^sha256=/, '').trim());
  const expected = Buffer.from(expectedHex);
  const signatureValid = provided.length === expected.length && crypto.timingSafeEqual(provided, expected);

  if (!signatureValid) {
    return res.sendStatus(401);
  }

  // Meta requires a fast 200 ack — it retries (and can eventually disable
  // the webhook) if it doesn't get one quickly. Ack first, then process;
  // any error below is logged, never surfaced back to Meta as a retry-able
  // failure (that would just re-deliver the same message forever).
  res.sendStatus(200);

  try {
    const entries = req.body?.entry || [];
    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const contacts = value.contacts || [];

        for (const message of value.messages || []) {
          const contact = contacts.find((c) => c.wa_id === message.from);
          try {
            whatsappService.markAsRead(message.id).catch(() => {});
            await whatsappBotService.handleInboundMessage({
              from: message.from,
              message,
              contactName: contact?.profile?.name,
              referral: message.referral || null,
            });
          } catch (msgErr) {
            console.error(`WhatsApp bot failed handling message ${message.id}:`, msgErr.message);
          }
        }
        // value.statuses (sent/delivered/read/failed receipts for OUR
        // outbound messages) are intentionally ignored for now — nothing
        // in the v1 flow needs to react to them.
      }
    }
  } catch (err) {
    console.error('WhatsApp webhook processing failed:', err.message);
  }
});

module.exports = router;
