const nodemailer = require('nodemailer');
const dns = require('dns');

/*
  Render's network has unreliable IPv6 outbound connectivity, and simply
  setting `family: 4` on the transporter did NOT stop Node from resolving
  and attempting an IPv6 address for smtp.gmail.com (confirmed via repeated
  ENETUNREACH errors in production logs even with family:4 set).

  The reliable fix: manually resolve Gmail's real IPv4 address ourselves
  and connect directly to that IP, skipping hostname-based resolution at
  connect-time entirely. `tls.servername` is set so the TLS certificate
  (issued for smtp.gmail.com) still validates correctly against the IP.

  Because DNS resolution is async, the transporter is created lazily and
  cached — call getTransporter() (returns a Promise) wherever you need it,
  rather than requiring a ready-made transporter object directly.
*/
dns.setDefaultResultOrder('ipv4first');

let transporterPromise = null;

function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    let host = 'smtp.gmail.com';

    try {
      const addresses = await dns.promises.resolve4('smtp.gmail.com');
      if (addresses && addresses.length > 0) {
        host = addresses[0];
      }
    } catch (err) {
      console.warn(
        '⚠️ Could not resolve IPv4 address for smtp.gmail.com, falling back to hostname (may fail on Render):',
        err.message
      );
    }

    /*
      IMPORTANT: EMAIL_PASS must be a Gmail "App Password" (16 characters),
      NOT your normal Gmail login password. Generate one at:
      https://myaccount.google.com/apppasswords
      (requires 2-Step Verification to be enabled on the account first)
    */
    const transporter = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      requireTLS: true,
      tls: {
        servername: 'smtp.gmail.com', // keeps cert validation correct despite connecting via raw IP
      },
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Fail loudly at startup if credentials/connection are wrong, rather
    // than silently failing on the first real order.
    transporter.verify((err) => {
      if (err) {
        console.error('❌ Email transporter failed to verify:', err.message);
      } else {
        console.log('✅ Email transporter ready');
      }
    });

    return transporter;
  })();

  return transporterPromise;
}

// Trigger creation (and the verify() check inside it) immediately on
// startup too, so you can confirm the connection works just from the
// deploy logs — without needing to place a real order first.
getTransporter();

module.exports = getTransporter;