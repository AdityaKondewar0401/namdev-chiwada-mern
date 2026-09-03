/*
  Resend transactional email — sent via their HTTPS API instead of raw SMTP.

  WHY: Render blocks outbound SMTP traffic on both port 465 and 587,
  confirmed via repeated ENETUNREACH / connection timeout errors even
  after forcing IPv4 and connecting directly to Gmail's resolved IP.
  HTTPS (port 443) is never blocked, so routing email through an HTTPS
  API sidesteps the problem completely.

  Previously used Brevo — swapped to Resend after Brevo silently disabled
  sending on the account with no actionable error beyond "Your sending
  platform is currently disabled."

  SETUP REQUIRED (see .env):
  - RESEND_API_KEY: from Resend dashboard → API Keys
  - EMAIL_USER: sender address on a domain verified in Resend
    (Resend dashboard → Domains → add + verify DNS records)
*/

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const SENDER = {
  name: 'Namdev Chiwda',
  email: process.env.EMAIL_USER,
};

if (!RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY is not set — emails will fail to send.');
}

/*
  Sends a single transactional email via Resend's API.
  Throws on failure so callers can catch and log it without crashing
  the request that triggered the email (e.g. placing an order).
*/
async function sendViaResend({ to, subject, html }) {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: `${SENDER.name} <${SENDER.email}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API error (${res.status}): ${errText}`);
  }

  return res.json();
}

/*
  Startup check — confirms the API key itself is valid by listing the
  account's domains (does NOT send a real email). Logs the same
  ✅ / ❌ pattern as before, so deploy logs still tell you immediately
  whether email sending is actually working.
*/
async function verifyResendConnection() {
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    if (res.ok) {
      console.log('✅ Resend API key verified — email sending ready');
    } else {
      const errText = await res.text();
      console.error(`❌ Resend API key verification failed (${res.status}):`, errText);
    }
  } catch (err) {
    console.error('❌ Resend API verification request failed:', err.message);
  }
}

verifyResendConnection();

module.exports = { sendViaResend };
