/*
  Brevo (formerly Sendinblue) transactional email — sent via their HTTPS
  API instead of raw SMTP.

  WHY: Render blocks outbound SMTP traffic on both port 465 and 587,
  confirmed via repeated ENETUNREACH / connection timeout errors even
  after forcing IPv4 and connecting directly to Gmail's resolved IP.
  HTTPS (port 443) is never blocked, so routing email through Brevo's
  API sidesteps the problem completely.

  SETUP REQUIRED (see .env):
  - BREVO_API_KEY: from Brevo dashboard → Settings → SMTP & API → API Keys
  - EMAIL_USER: the sender address you verified in Brevo
    (Settings → Senders, Domains & Dedicated IPs → Senders)
*/

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

const SENDER = {
  name: 'Namdev Chiwada',
  email: process.env.EMAIL_USER,
};

if (!BREVO_API_KEY) {
  console.warn('⚠️ BREVO_API_KEY is not set — emails will fail to send.');
}

/*
  Sends a single transactional email via Brevo's API.
  Throws on failure so callers can catch and log it without crashing
  the request that triggered the email (e.g. placing an order).
*/
async function sendViaBrevo({ to, subject, html }) {
  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${errText}`);
  }

  return res.json();
}

/*
  Startup check — confirms the API key itself is valid by hitting Brevo's
  account info endpoint (does NOT send a real email). Logs the same
  ✅ / ❌ pattern as the old SMTP verify() did, so deploy logs still tell
  you immediately whether email sending is actually working.
*/
async function verifyBrevoConnection() {
  try {
    const res = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': BREVO_API_KEY, accept: 'application/json' },
    });
    if (res.ok) {
      console.log('✅ Brevo API key verified — email sending ready');
    } else {
      const errText = await res.text();
      console.error(`❌ Brevo API key verification failed (${res.status}):`, errText);
    }
  } catch (err) {
    console.error('❌ Brevo API verification request failed:', err.message);
  }
}

verifyBrevoConnection();

module.exports = { sendViaBrevo };