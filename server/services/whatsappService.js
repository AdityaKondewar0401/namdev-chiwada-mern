// server/services/whatsappService.js
//
// WhatsApp Cloud API (Meta Graph API) client — low-level message sending.
// Mirrors services/shadowfaxService.js's shape: a custom `*ApiError`
// class, one private fetch helper, and typed exported async functions.
// Uses native `fetch` (Node 24), same convention as email/Shadowfax — no
// new HTTP dependency added for this integration.
//
// Every exported function throws a WhatsAppApiError on failure so callers
// (whatsappBotService) can decide what to do — this module never swallows
// errors silently.
//
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

const { getWhatsAppConfig } = require('../config/whatsapp');

class WhatsAppApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'WhatsAppApiError';
    this.status = status;
    this.body = body;
  }
}

// ── Low-level request helper ───────────────────────────────────────────
async function waFetch(path, { method = 'POST', body } = {}) {
  const { graphApiBaseUrl, phoneNumberId, accessToken } = getWhatsAppConfig();

  if (!accessToken || !phoneNumberId) {
    throw new WhatsAppApiError(
      'WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID is not set — cannot call the WhatsApp Cloud API.'
    );
  }

  const url = `${graphApiBaseUrl}/${phoneNumberId}${path}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new WhatsAppApiError(`WhatsApp request failed: ${networkErr.message}`);
  }

  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    // Meta's error shape: { error: { message, type, code, error_subcode, fbtrace_id } }
    throw new WhatsAppApiError(
      data?.error?.message || `WhatsApp API error (${res.status})`,
      { status: res.status, body: data }
    );
  }

  return data;
}

// ── Send a plain text message ──────────────────────────────────────────
async function sendTextMessage(to, body) {
  return waFetch('/messages', {
    body: {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { preview_url: false, body },
    },
  });
}

// ── Send up to 3 quick-reply buttons (e.g. size choice, yes/no confirm) ─
// `buttons` is an array of { id, title } — title is shown to the user and
// capped at 20 chars by WhatsApp; id is what comes back in the reply
// webhook so the bot knows exactly which button was tapped (no need to
// parse free text back out of a button tap).
async function sendButtonsMessage(to, bodyText, buttons) {
  return waFetch('/messages', {
    body: {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title.slice(0, 20) },
          })),
        },
      },
    },
  });
}

// ── Send a list message (e.g. the 2-product catalog menu) ───────────────
// `sections` is [{ title, rows: [{ id, title, description }] }] — WhatsApp
// allows up to 10 rows total across all sections.
async function sendListMessage(to, { header, bodyText, buttonLabel, sections }) {
  return waFetch('/messages', {
    body: {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        ...(header ? { header: { type: 'text', text: header } } : {}),
        body: { text: bodyText },
        action: {
          button: buttonLabel.slice(0, 20),
          sections,
        },
      },
    },
  });
}

// ── Mark an inbound message as read (blue ticks) ─────────────────────────
// Best-effort UX only — never let a failure here block the actual reply.
async function markAsRead(messageId) {
  return waFetch('/messages', {
    body: {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    },
  });
}

module.exports = {
  WhatsAppApiError,
  sendTextMessage,
  sendButtonsMessage,
  sendListMessage,
  markAsRead,
};
