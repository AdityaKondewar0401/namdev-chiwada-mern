const { sendViaBrevo } = require('../config/email');

const LOGO_URL = `${process.env.CLIENT_URL || 'https://namdev-chiwada-mern.vercel.app'}/images/logo.png`;

/*
  Order confirmation is a TRANSACTIONAL email — it always sends regardless
  of marketingConsent, since the user needs this to know their order went
  through. marketingConsent only gates promotional/marketing sends, which
  is a separate function to build later (e.g. sendPromoEmail).
*/
async function sendOrderConfirmation(order, userEmail) {
  if (!userEmail) {
    console.warn('sendOrderConfirmation: no email provided, skipping');
    return;
  }

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding:13px 0; color:#2d1a00; font-size:14px; font-weight:600; border-bottom:1px solid rgba(224,112,0,0.1);">
        ${item.name}
        ${item.size ? `<span style="color:#9a7c5a; font-weight:400; font-size:12px;"> · ${item.size}</span>` : ''}
        <span style="color:#9a7c5a; font-weight:400; font-size:12px;"> × ${item.qty}</span>
      </td>
      <td style="padding:13px 0; text-align:right; color:#2d1a00; font-size:14px; font-weight:700; white-space:nowrap; border-bottom:1px solid rgba(224,112,0,0.1);">
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
<style>
  body { margin:0; padding:0; background:#fef3e0; }
  table { border-collapse:collapse; }
  img { border:0; display:block; }
  a { text-decoration:none; }
  .wrapper { width:100%; background:#fef3e0; padding:20px 0; }
  .container { max-width:560px; margin:0 auto; background:#fffdf7; }

  @media only screen and (max-width:480px) {
    .container { width:100% !important; }
    .pad { padding-left:18px !important; padding-right:18px !important; }
    .hero-title { font-size:26px !important; }
    .hero-pad { padding:36px 18px 32px !important; }
    .status-icon { width:32px !important; height:32px !important; font-size:14px !important; line-height:32px !important; }
    .status-label { font-size:9px !important; }
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
    <td style="background:#2d1a00; padding:16px 24px; text-align:center;">
      <img src="${LOGO_URL}" alt="Namdev Chiwada" width="34" style="display:inline-block; vertical-align:middle; border-radius:6px;" />
      <span style="color:#f0cc5a; font-size:13px; font-weight:700; letter-spacing:0.1em; vertical-align:middle; margin-left:10px;">NAMDEV CHIWADA</span>
    </td>
  </tr>

  <!-- Hero -->
  <tr>
    <td class="hero-pad" style="background:linear-gradient(135deg,#e07000,#ff9010); background-color:#e07000; padding:44px 24px 38px; text-align:center;">
      <div style="font-size:44px; line-height:1; margin-bottom:12px;">🎉</div>
      <div class="hero-title" style="color:#fff; font-size:30px; font-weight:900; line-height:1.2; letter-spacing:-0.01em; font-family:Georgia, 'Times New Roman', serif;">
        You're all set, ${firstName}!
      </div>
      <div style="color:rgba(255,255,255,0.85); font-size:13px; margin-top:10px; font-weight:600; letter-spacing:0.02em;">
        Order #${orderShort} · Confirmed just now
      </div>
    </td>
  </tr>

  <!-- Status timeline -->
  <tr>
    <td style="background:#fffdf7; border-bottom:1px solid rgba(224,112,0,0.1); padding:20px 12px;">
      <table role="presentation" width="100%">
        <tr>
          <td align="center" style="width:25%;">
            <div class="status-icon" style="width:34px; height:34px; border-radius:50%; background:#e07000; color:#fff; line-height:34px; font-size:15px; margin:0 auto 6px; font-weight:700;">✓</div>
            <div class="status-label" style="font-size:9.5px; font-weight:800; color:#2d1a00; letter-spacing:0.03em;">PLACED</div>
          </td>
          <td align="center" style="width:25%;">
            <div class="status-icon" style="width:34px; height:34px; border-radius:50%; background:#fdf3c8; color:#d4af37; line-height:34px; font-size:15px; margin:0 auto 6px;">🔥</div>
            <div class="status-label" style="font-size:9.5px; font-weight:800; color:#c8902a; letter-spacing:0.03em;">PREPARING</div>
          </td>
          <td align="center" style="width:25%;">
            <div class="status-icon" style="width:34px; height:34px; border-radius:50%; background:#fef3e0; color:#d9c4a0; line-height:34px; font-size:15px; margin:0 auto 6px;">🛵</div>
            <div class="status-label" style="font-size:9.5px; font-weight:800; color:#c0a880; letter-spacing:0.03em;">ON THE WAY</div>
          </td>
          <td align="center" style="width:25%;">
            <div class="status-icon" style="width:34px; height:34px; border-radius:50%; background:#fef3e0; color:#d9c4a0; line-height:34px; font-size:15px; margin:0 auto 6px;">📦</div>
            <div class="status-label" style="font-size:9.5px; font-weight:800; color:#c0a880; letter-spacing:0.03em;">DELIVERED</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Items -->
  <tr>
    <td class="pad" style="background:#fffdf7; padding:28px 26px 6px;">
      <div style="font-size:11px; font-weight:800; letter-spacing:0.1em; color:#c8902a; margin-bottom:8px;">YOUR ORDER</div>
      <table role="presentation" width="100%">
        ${itemsHtml}
      </table>
    </td>
  </tr>

  <!-- Big total -->
  <tr>
    <td class="pad" style="background:#fffdf7; padding:18px 26px 28px;">
      <table role="presentation" width="100%">
        <tr>
          <td style="font-size:15px; font-weight:700; color:#2d1a00;">Total paid</td>
          <td class="total-num" align="right" style="font-size:28px; font-weight:900; color:#e07000; letter-spacing:-0.01em; font-family:Georgia, 'Times New Roman', serif;">
            ₹${(order.total || 0).toLocaleString()}
          </td>
        </tr>
      </table>
      ${freeShip ? `
      <div style="display:inline-block; background:#e6faf2; color:#1ea064; font-size:11px; font-weight:800; padding:5px 12px; border-radius:999px; margin-top:8px;">
        🚚 FREE SHIPPING
      </div>` : ''}
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td class="pad" style="background:#fffdf7; padding:0 26px 32px;">
      <table role="presentation" width="100%">
        <tr>
          <td style="border-radius:999px; background:linear-gradient(135deg,#e07000,#ff9010); background-color:#e07000; text-align:center;">
            <a href="${baseUrl}/orders/${order._id}"
               style="display:block; color:#fff; font-weight:800; font-size:15px; padding:16px; letter-spacing:0.01em;">
              TRACK MY ORDER →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Delivery + payment details -->
  <tr>
    <td class="pad" style="background:#fef3e0; padding:24px 26px; border-top:1px solid rgba(224,112,0,0.12);">
      <table role="presentation" width="100%">
        <tr><td style="font-size:11px; font-weight:800; letter-spacing:0.08em; color:#c8902a; padding-bottom:4px;">DELIVERING TO</td></tr>
        <tr>
          <td style="font-size:13px; color:#7a5c3a; line-height:1.6;">
            ${addr.fullName || ''}<br/>
            ${addr.line1 || ''}${addr.line2 ? `, ${addr.line2}` : ''}<br/>
            ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}
          </td>
        </tr>
        <tr><td style="font-size:11px; font-weight:800; letter-spacing:0.08em; color:#c8902a; padding-top:16px; padding-bottom:4px;">PAYMENT</td></tr>
        <tr>
          <td style="font-size:13px; color:#7a5c3a;">
            ${order.paymentMethod === 'ONLINE' ? '💳 Paid Online' : '💵 Cash on Delivery'}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#2d1a00; padding:26px 24px; text-align:center;">
      <div style="color:#f0cc5a; font-size:13px; font-weight:700; margin-bottom:6px;">
        Since 1873. Still crunchy. Still Solapur. 🌾
      </div>
      <div style="color:rgba(255,255,255,0.5); font-size:11px; line-height:1.6;">
        Questions? Reply here or WhatsApp
        <a href="https://wa.me/919130160491" style="color:#ff9010; font-weight:700;">+91 91301 60491</a>
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</div>
</body>
</html>`;

  await sendViaBrevo({
    to: userEmail,
    subject: `🎉 Order Confirmed — ₹${(order.total || 0).toLocaleString()} · Namdev Chiwada`,
    html,
  });
}

/*
  Partner invite email — sent once, when the admin adds a new partner.
  Links to /partner/set-password?token=... where they choose their own
  password. Non-blocking by design: if this fails, the admin can still
  see the invite link in the Partners tab and resend/share it manually.
*/
async function sendPartnerInviteEmail(toEmail, businessName, inviteLink) {
  if (!toEmail) {
    console.warn('sendPartnerInviteEmail: no email provided, skipping');
    return;
  }

  const html = `
    <div style="font-family:Arial,sans-serif; max-width:480px; margin:0 auto; padding:32px 24px; background:#fffdf7;">
      <div style="text-align:center; margin-bottom:24px;">
        <span style="color:#2d1a00; font-size:16px; font-weight:800; letter-spacing:0.05em;">NAMDEV CHIWADA</span>
      </div>
      <h2 style="color:#2d1a00; font-size:20px;">You've been added as a partner</h2>
      <p style="color:#5a4632; font-size:14px; line-height:1.6;">
        Hi ${businessName}, you now have a partner account with Namdev Chiwda.
        Set your password to access your consignment and payment dashboard.
      </p>
      <div style="text-align:center; margin:28px 0;">
        <a href="${inviteLink}" style="background:#e07000; color:#fff; padding:12px 28px; border-radius:30px; text-decoration:none; font-weight:700; font-size:14px;">
          Set Your Password
        </a>
      </div>
      <p style="color:#9a7c5a; font-size:12px;">This link expires in 72 hours.</p>
    </div>
  `;

  try {
    await sendViaBrevo({
      to: toEmail,
      subject: 'Set up your Namdev Chiwda partner account',
      html,
    });
  } catch (err) {
    console.error('sendPartnerInviteEmail failed:', err.message);
  }
}

/*
  Payment reminder email — sent by the Phase 3 reminder job every 3 days
  while a Payment stays 'pending'. Kept deliberately short: the point is
  a nudge, not a full statement.
*/
async function sendPaymentReminderEmail(toEmail, businessName, { installment, amountDue }, consignment) {
  if (!toEmail) {
    console.warn('sendPaymentReminderEmail: no email provided, skipping');
    return;
  }

  const dispatchDate = new Date(consignment.dispatchDate).toLocaleDateString('en-IN');
  const itemsSummary = (consignment.items || [])
    .map((i) => `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty}`)
    .join(', ');

  const html = `
    <div style="font-family:Arial,sans-serif; max-width:480px; margin:0 auto; padding:32px 24px; background:#fffdf7;">
      <div style="text-align:center; margin-bottom:24px;">
        <span style="color:#2d1a00; font-size:16px; font-weight:800; letter-spacing:0.05em;">NAMDEV CHIWADA</span>
      </div>
      <h2 style="color:#2d1a00; font-size:20px;">Payment reminder</h2>
      <p style="color:#5a4632; font-size:14px; line-height:1.6;">
        Hi ${businessName}, this is a reminder that your <strong>${installment}</strong> payment of
        <strong>₹${amountDue.toLocaleString('en-IN')}</strong> is still pending, for the consignment
        dispatched on ${dispatchDate} (${itemsSummary}).
      </p>
      <p style="color:#9a7c5a; font-size:12px;">
        If you've already paid, please let us know so we can update our records.
      </p>
    </div>
  `;

  try {
    await sendViaBrevo({
      to: toEmail,
      subject: `Payment reminder — ₹${amountDue.toLocaleString('en-IN')} pending`,
      html,
    });
  } catch (err) {
    console.error('sendPaymentReminderEmail failed:', err.message);
  }
}

/*
  Sent the moment an admin approves a partner's own order request into a
  real Consignment — closes the loop so the partner doesn't have to keep
  checking the dashboard to know whether their order went through.
*/
async function sendOrderApprovedEmail(toEmail, businessName, consignment) {
  if (!toEmail) {
    console.warn('sendOrderApprovedEmail: no email provided, skipping');
    return;
  }

  const itemsSummary = (consignment.items || [])
    .map((i) => `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty}`)
    .join(', ');

  const html = `
    <div style="font-family:Arial,sans-serif; max-width:480px; margin:0 auto; padding:32px 24px; background:#fffdf7;">
      <div style="text-align:center; margin-bottom:24px;">
        <span style="color:#2d1a00; font-size:16px; font-weight:800; letter-spacing:0.05em;">NAMDEV CHIWADA</span>
      </div>
      <h2 style="color:#2d1a00; font-size:20px;">Your order has been approved ✅</h2>
      <p style="color:#5a4632; font-size:14px; line-height:1.6;">
        Hi ${businessName}, your order request has been approved and dispatched:
        <strong>${itemsSummary}</strong>.
      </p>
      <p style="color:#5a4632; font-size:14px; line-height:1.6;">
        Total: <strong>₹${consignment.totalAmount.toLocaleString('en-IN')}</strong>
        (${consignment.advancePercent}% advance / ${100 - consignment.advancePercent}% final).
      </p>
      <p style="color:#9a7c5a; font-size:12px;">
        You can pay your installments anytime from your partner dashboard.
      </p>
    </div>
  `;

  try {
    await sendViaBrevo({
      to: toEmail,
      subject: 'Your order was approved and dispatched',
      html,
    });
  } catch (err) {
    console.error('sendOrderApprovedEmail failed:', err.message);
  }
}

/*
  Sent when an admin declines a partner's order request — keeps the
  partner informed instead of leaving them to guess why nothing shipped.
*/
async function sendOrderRejectedEmail(toEmail, businessName, orderRequest, reason) {
  if (!toEmail) {
    console.warn('sendOrderRejectedEmail: no email provided, skipping');
    return;
  }

  const itemsSummary = (orderRequest.items || [])
    .map((i) => `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty}`)
    .join(', ');

  const html = `
    <div style="font-family:Arial,sans-serif; max-width:480px; margin:0 auto; padding:32px 24px; background:#fffdf7;">
      <div style="text-align:center; margin-bottom:24px;">
        <span style="color:#2d1a00; font-size:16px; font-weight:800; letter-spacing:0.05em;">NAMDEV CHIWADA</span>
      </div>
      <h2 style="color:#2d1a00; font-size:20px;">Your order request was declined</h2>
      <p style="color:#5a4632; font-size:14px; line-height:1.6;">
        Hi ${businessName}, your recent order request (${itemsSummary}) could not be fulfilled this time.
      </p>
      ${reason ? `<p style="color:#5a4632; font-size:14px; line-height:1.6;"><strong>Reason:</strong> ${reason}</p>` : ''}
      <p style="color:#9a7c5a; font-size:12px;">
        Feel free to submit a new order request anytime from your partner dashboard.
      </p>
    </div>
  `;

  try {
    await sendViaBrevo({
      to: toEmail,
      subject: 'Update on your order request',
      html,
    });
  } catch (err) {
    console.error('sendOrderRejectedEmail failed:', err.message);
  }
}

module.exports = {
  sendOrderConfirmation,
  sendPartnerInviteEmail,
  sendPaymentReminderEmail,
  sendOrderApprovedEmail,
  sendOrderRejectedEmail,
};