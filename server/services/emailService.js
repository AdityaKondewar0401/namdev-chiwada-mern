const { sendViaResend } = require('../config/email');
const BUSINESS = require('../config/business');
const { formatINR } = require('../utils/invoiceUtils');

const LOGO_URL = `${process.env.CLIENT_URL || 'https://namdev-chiwada-mern.vercel.app'}/images/logo.png`;

// WhatsApp-bot customers get a placeholder address on the `.local` TLD
// (see whatsappBotService) because User.email is required; it can never
// receive mail, so it is treated like a missing address.
function isDeliverableEmail(email) {
  return typeof email === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    && !/\.local$/i.test(email.trim());
}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/*
  Order confirmation is a TRANSACTIONAL email — it always sends regardless
  of marketingConsent, since the user needs this to know their order went
  through. marketingConsent only gates promotional/marketing sends, which
  is a separate function to build later (e.g. sendPromoEmail).

  Returns true when an email was actually sent.
*/
async function sendOrderConfirmation(order, userEmail, invoiceAttachment) {
  if (!isDeliverableEmail(userEmail)) {
    console.warn('sendOrderConfirmation: no deliverable email, skipping');
    return false;
  }

  const itemsHtml = (order.items || [])
    .map(
      (item, i) => `
    <tr>
      <td style="padding:14px 16px; color:#2d1a00; font-size:14px; font-weight:600; ${i > 0 ? 'border-top:1px solid rgba(224,112,0,0.1);' : ''}">
        ${item.name}
        ${item.size ? `<span style="color:#9a7c5a; font-weight:400; font-size:12px;"> · ${item.size}</span>` : ''}
        <span style="color:#9a7c5a; font-weight:400; font-size:12px;"> × ${item.qty}</span>
      </td>
      <td style="padding:14px 16px; text-align:right; color:#2d1a00; font-size:14px; font-weight:700; white-space:nowrap; ${i > 0 ? 'border-top:1px solid rgba(224,112,0,0.1);' : ''}">
        ₹${(item.price * item.qty).toLocaleString()}
      </td>
    </tr>`
    )
    .join('');

  const addr = order.shippingAddress || {};
  const baseUrl = process.env.CLIENT_URL || 'https://namdev-chiwada-mern.vercel.app';
  const orderShort = String(order._id).slice(-8).toUpperCase();
  const firstName = (addr.fullName || 'friend').split(' ')[0];
  const freeShip = (order.shippingCharge ?? 0) === 0;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Order Confirmed</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
<!--[if mso]>
<style>
  * { font-family: Arial, sans-serif !important; }
</style>
<![endif]-->
<style>
  body { margin:0; padding:0; background:#f2e4c8; font-family:'Poppins', Arial, Helvetica, sans-serif; }
  table { border-collapse:collapse; }
  img { border:0; display:block; }
  a { text-decoration:none; }
  h1, h2, div, td, span { font-family:'Poppins', Arial, Helvetica, sans-serif; }
  .wrapper { width:100%; background:radial-gradient(circle at 50% 0%, #fbe7bd 0%, #f2e4c8 55%); padding:32px 16px; }
  .container { max-width:560px; margin:0 auto; background:#fffdf7; border-radius:28px; overflow:hidden; box-shadow:0 20px 45px rgba(45,26,0,0.16), 0 2px 8px rgba(45,26,0,0.08); }
  .card { border-radius:18px; overflow:hidden; }
  .pill { border-radius:999px; }

  @media only screen and (max-width:480px) {
    .wrapper { padding:18px 10px; }
    .container { border-radius:20px; }
    .pad { padding-left:18px !important; padding-right:18px !important; }
    .hero-title { font-size:25px !important; }
    .hero-pad { padding:34px 18px 30px !important; }
    .total-num { font-size:24px !important; }
  }
</style>
</head>
<body>
<div class="wrapper">
<table role="presentation" width="100%">
<tr><td align="center">
<table role="presentation" class="container" width="560" style="width:560px;">

  <!-- Top brand bar -->
  <tr>
    <td style="background:#2d1a00; padding:22px 24px; text-align:center;">
      <img src="${LOGO_URL}" alt="Namdev Chiwda" width="130" style="display:inline-block; vertical-align:middle; border-radius:16px;" />
      <span style="color:#f0cc5a; font-size:23px; font-weight:700; letter-spacing:0.12em; vertical-align:middle; margin-left:14px;">NAMDEV CHIWDA</span>
    </td>
  </tr>

  <!-- Hero -->
  <tr>
    <td class="hero-pad" style="background:linear-gradient(160deg,#ff9a2e,#e07000 55%,#c85f00); background-color:#e07000; padding:46px 24px 40px; text-align:center;">
      <div style="display:inline-block; width:68px; height:68px; line-height:68px; border-radius:22px; background:rgba(255,255,255,0.18); font-size:34px; margin-bottom:18px;">🎉</div>
      <div class="hero-title" style="color:#fff; font-size:29px; font-weight:800; line-height:1.25; letter-spacing:-0.01em;">
        You're all set, ${firstName}!
      </div>
      <div class="pill" style="display:inline-block; margin-top:14px; background:rgba(255,255,255,0.16); color:#fff; font-size:12px; font-weight:700; letter-spacing:0.03em; padding:7px 16px;">
        Order #${orderShort} · Confirmed just now
      </div>
    </td>
  </tr>

  <!-- Items -->
  <tr>
    <td class="pad" style="background:#fffdf7; padding:28px 26px 22px;">
      <div style="font-size:11px; font-weight:800; letter-spacing:0.08em; color:#c8902a; margin-bottom:10px;">YOUR ORDER</div>
      <table role="presentation" class="card" width="100%" style="background:#fef8ec; border:1px solid rgba(224,112,0,0.12);">
        ${itemsHtml}
      </table>
    </td>
  </tr>

  <!-- Big total -->
  <tr>
    <td class="pad" style="background:#fffdf7; padding:0 26px 26px;">
      <table role="presentation" class="card" width="100%" style="background:linear-gradient(135deg,#fff6e4,#fdecc9);">
        <tr>
          <td style="padding:18px 20px;">
            <table role="presentation" width="100%">
              <tr>
                <td style="font-size:14px; font-weight:700; color:#2d1a00;">${order.paymentMethod === 'ONLINE' ? 'Total paid' : 'Amount payable on delivery'}</td>
                <td class="total-num" align="right" style="font-size:27px; font-weight:800; color:#e07000; letter-spacing:-0.01em;">
                  ₹${(order.total || 0).toLocaleString()}
                </td>
              </tr>
            </table>
            ${freeShip ? `
            <div class="pill" style="display:inline-block; background:#1ea064; color:#fff; font-size:11px; font-weight:800; padding:6px 14px; margin-top:10px;">
              🚚 FREE SHIPPING
            </div>` : ''}
            ${invoiceAttachment ? `
            <div style="font-size:12px; color:#5a4326; margin-top:12px;">
              🧾 Your invoice is attached to this email as a PDF.
            </div>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td class="pad" style="background:#fffdf7; padding:0 26px 34px;">
      <table role="presentation" width="100%">
        <tr>
          <td class="pill" style="background:linear-gradient(135deg,#ff9a2e,#e07000); background-color:#e07000; text-align:center; box-shadow:0 10px 22px rgba(224,112,0,0.35);">
            <a href="${baseUrl}/orders/${order._id}"
               style="display:block; color:#fff; font-weight:800; font-size:15px; padding:16px; letter-spacing:0.02em;">
              TRACK MY ORDER →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Delivery + payment details -->
  <tr>
    <td class="pad" style="background:#fef3e0; padding:26px;">
      <table role="presentation" class="card" width="100%" style="background:#fffdf7; border:1px solid rgba(224,112,0,0.12);">
        <tr>
          <td style="padding:18px 20px;">
            <div style="font-size:11px; font-weight:800; letter-spacing:0.08em; color:#c8902a; margin-bottom:6px;">DELIVERING TO</div>
            <div style="font-size:13px; color:#5a4326; line-height:1.6;">
              ${addr.fullName || ''}<br/>
              ${addr.line1 || ''}${addr.line2 ? `, ${addr.line2}` : ''}<br/>
              ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}
            </div>
            <div style="height:1px; background:rgba(224,112,0,0.14); margin:14px 0;"></div>
            <div style="font-size:11px; font-weight:800; letter-spacing:0.08em; color:#c8902a; margin-bottom:6px;">PAYMENT</div>
            <div style="font-size:13px; color:#5a4326;">
              ${order.paymentMethod === 'ONLINE' ? '💳 Paid Online' : '💵 Cash on Delivery'}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#2d1a00; padding:28px 24px; text-align:center;">
      <div style="color:#f0cc5a; font-size:13px; font-weight:700; margin-bottom:8px;">
        Since 1873. Still crunchy. Still Solapur. 🌾
      </div>
      <div style="color:rgba(255,255,255,0.55); font-size:11px; line-height:1.6;">
        Questions? Reply here or WhatsApp
        <a href="https://wa.me/919130160491" style="color:#ff9010; font-weight:700;">+91 91301 60491</a>
      </div>
      <div style="color:rgba(255,255,255,0.35); font-size:10px; margin-top:10px;">
        FSSAI Lic. No: 21526041003460
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</div>
</body>
</html>`;

  await sendViaResend({
    to: userEmail,
    subject: `🎉 Order Confirmed — ₹${(order.total || 0).toLocaleString()} · Namdev Chiwda`,
    html,
    attachments: invoiceAttachment ? [invoiceAttachment] : undefined,
  });
  return true;
}

/**
 * Emails one invoice with its PDF attached.
 * @param {{ to: string, view: object, pdf: Buffer, fileName: string, message?: string }} args
 *   `view` is the invoice view model from invoiceService.presentInvoice().
 */
async function sendInvoiceEmail({ to, view, pdf, fileName, message }) {
  const firstName = escapeHtml((view.customer.name || 'there').split(' ')[0]);
  const note = message && message.trim()
    ? `<div style="margin:0 0 20px; padding:14px 16px; background:#fef8ec; border-left:3px solid #e07000; font-size:14px; color:#5a4326; line-height:1.6; white-space:pre-line;">${escapeHtml(message.trim())}</div>`
    : '';
  const statusColor = view.statusTone === 'paid' ? '#1e7a3c' : view.statusTone === 'cancelled' ? '#b8080e' : '#a14d00';
  const row = (label, value, extra = '') => `
    <tr>
      <td style="padding:9px 0; font-size:13px; color:#9a7c5a; border-top:1px solid rgba(224,112,0,0.1);">${label}</td>
      <td align="right" style="padding:9px 0; font-size:13px; font-weight:600; color:#2d1a00; border-top:1px solid rgba(224,112,0,0.1); ${extra}">${value}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invoice ${escapeHtml(view.number)}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  body { margin:0; padding:0; background:#f2e4c8; font-family:'Poppins', Arial, Helvetica, sans-serif; }
  table { border-collapse:collapse; }
  img { border:0; display:block; }
  div, td, span { font-family:'Poppins', Arial, Helvetica, sans-serif; }
  @media only screen and (max-width:480px) { .pad { padding-left:18px !important; padding-right:18px !important; } }
</style>
</head>
<body>
<div style="width:100%; background:#f2e4c8; padding:32px 16px; box-sizing:border-box;">
<table role="presentation" width="100%"><tr><td align="center">
<table role="presentation" width="560" style="width:100%; max-width:560px; background:#fffdf7; border-radius:24px; overflow:hidden;">
  <tr>
    <td style="background:#2d1a00; padding:22px 24px; text-align:center;">
      <img src="${LOGO_URL}" alt="Namdev Chiwda" width="120" style="display:inline-block; vertical-align:middle; border-radius:14px;" />
      <span style="color:#f0cc5a; font-size:21px; font-weight:700; letter-spacing:0.12em; vertical-align:middle; margin-left:12px;">NAMDEV CHIWDA</span>
    </td>
  </tr>
  <tr>
    <td class="pad" style="padding:32px 28px 8px;">
      <div style="font-size:20px; font-weight:700; color:#2d1a00; margin-bottom:8px;">Hi ${firstName},</div>
      <div style="font-size:14px; color:#5a4326; line-height:1.7; margin-bottom:20px;">
        Thank you for buying from ${escapeHtml(BUSINESS.brandName)}. Your invoice <strong>${escapeHtml(view.number)}</strong> is attached to this email as a PDF.
      </div>
      ${note}
      <table role="presentation" width="100%" style="margin-bottom:8px;">
        ${row('Invoice no.', escapeHtml(view.number))}
        ${row('Date', escapeHtml(view.issuedOn))}
        ${row(escapeHtml(view.totalLabel), escapeHtml(formatINR(view.total)), 'font-size:15px; color:#e07000;')}
        ${row('Status', escapeHtml(view.statusLabel), `color:${statusColor};`)}
      </table>
    </td>
  </tr>
  <tr>
    <td class="pad" style="padding:8px 28px 30px;">
      <div style="font-size:12px; color:#9a7c5a; line-height:1.6;">
        Bank: ${escapeHtml(BUSINESS.bank.name)} · A/c ${escapeHtml(BUSINESS.bank.accountNumber)} · IFSC ${escapeHtml(BUSINESS.bank.ifsc)}<br/>
        UPI: ${escapeHtml(BUSINESS.upiId)}
      </div>
    </td>
  </tr>
  <tr>
    <td style="background:#2d1a00; padding:24px; text-align:center;">
      <div style="color:#f0cc5a; font-size:13px; font-weight:700; margin-bottom:8px;">Since 1873. Still crunchy. Still Solapur.</div>
      <div style="color:rgba(255,255,255,0.6); font-size:11px; line-height:1.6;">
        Questions about this invoice? Reply to this email or WhatsApp
        <a href="https://wa.me/919130160491" style="color:#ff9010; font-weight:700; text-decoration:none;">${escapeHtml(BUSINESS.phone)}</a>
      </div>
      <div style="color:rgba(255,255,255,0.35); font-size:10px; margin-top:10px;">
        ${escapeHtml(BUSINESS.legalName)} · FSSAI Lic. No: ${escapeHtml(BUSINESS.fssai)}
      </div>
    </td>
  </tr>
</table>
</td></tr></table>
</div>
</body>
</html>`;

  return sendViaResend({
    to: to.trim(),
    subject: `Your invoice ${view.number} from ${BUSINESS.brandName}`,
    html,
    replyTo: BUSINESS.email,
    attachments: [{ filename: fileName, content: pdf }],
  });
}

module.exports = {
  sendOrderConfirmation,
  sendInvoiceEmail,
  isDeliverableEmail,
};
