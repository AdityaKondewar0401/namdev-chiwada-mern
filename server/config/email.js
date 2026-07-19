const nodemailer = require('nodemailer');

/*
  Gmail SMTP transporter.

  IMPORTANT: EMAIL_PASS must be a Gmail "App Password" (16 characters),
  NOT your normal Gmail login password. Generate one at:
  https://myaccount.google.com/apppasswords
  (requires 2-Step Verification to be enabled on the account first)
*/
const transporter = nodemailer.createTransport({
  service: 'gmail',
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