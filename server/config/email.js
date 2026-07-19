const nodemailer = require('nodemailer');
const dns = require('dns');

/*
  Render's network has unreliable IPv6 outbound connectivity. Node's default
  DNS resolution can return Gmail's IPv6 address first, which Render then
  fails to reach (ENETUNREACH). Forcing IPv4-first resolution avoids this
  entirely — this is a Render-specific networking quirk, not a code or
  credentials issue.
*/
dns.setDefaultResultOrder('ipv4first');

/*
  Gmail SMTP transporter.

  IMPORTANT: EMAIL_PASS must be a Gmail "App Password" (16 characters),
  NOT your normal Gmail login password. Generate one at:
  https://myaccount.google.com/apppasswords
  (requires 2-Step Verification to be enabled on the account first)
*/
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // force IPv4 — belt-and-suspenders alongside dns.setDefaultResultOrder above
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Fail loudly at startup if credentials are missing/wrong, rather than
// silently failing on the first real order.
transporter.verify((err) => {
  if (err) {
    console.error('❌ Email transporter failed to verify:', err.message);
  } else {
    console.log('✅ Email transporter ready');
  }
});

module.exports = transporter;