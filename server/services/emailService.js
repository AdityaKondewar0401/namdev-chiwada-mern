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
      <td style="padding:14px 0; color:#1a1a1a; font-size:15px; font-weight:600;">
        ${item.name}
        ${item.size ? `<span style="color:#aaa; font-weight:400; font-size:13px;"> · ${item.size}</span>` : ''}
        <span style="color:#aaa; font-weight:400; font-size:13px;"> × ${item.qty}</span>
      </td>
      <td style="padding:14px 0; text-align:right; color:#1a1a1a; font-size:15px; font-weight:700; white-space:nowrap;">
        ₹${(item.price * item.qty).toLocaleString()}
      </td>
    </tr>
    <tr><td colspan="2" style="border-bottom:1px solid #f0f0f0;"></td></tr>`
    )
    .join('');

  const addr = order.shippingAddress || {};
  const baseUrl = process.env.CLIENT_URL || 'https://namdev-chiwada-mern.vercel.app';
  const orderShort = String(order._id).slice(-8).toUpperCase();

  const html = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background:#faf9f6;">

  <!-- Top mini bar -->
  <table role="presentation" width="100%" style="background:#1a1a1a;">
    <tr>
      <td style="padding:14px 24px; text-align:center;">
        <img src="${LOGO_URL}" alt="Namdev Chiwda" width="36" style="vertical-align:middle; border-radius:6px;" />
        <span style="color:#fff; font-size:13px; font-weight:700; letter-spacing:0.08em; vertical-align:middle; margin-left:10px;">NAMDEV CHIWDA</span>
      </td>
    </tr>
  </table>

  <!-- HUGE bold hero -->
  <table role="presentation" width="100%" style="background:linear-gradient(135deg,#ff9010,#e07000); background-color:#e07000;">
    <tr>
      <td style="padding:52px 24px 44px; text-align:center;">
        <div style="font-size:52px; line-height:1; margin-bottom:14px;">🎉</div>
        <div style="color:#fff; font-size:34px; font-weight:900; line-height:1.15; letter-spacing:-0.02em;">
          You're all set,<br/>${(addr.fullName || 'friend').split(' ')[0]}!
        </div>
        <div style="color:rgba(255,255,255,0.9); font-size:14px; margin-top:12px; font-weight:500;">
          Order #${orderShort} · Confirmed just now
        </div>
      </td>
    </tr>
  </table>

  <!-- Status timeline strip -->
  <table role="presentation" width="100%" style="background:#fff; border-bottom:1px solid #f0f0f0;">
    <tr>
      <td style="padding:22px 16px;">
        <table role="presentation" width="100%">
          <tr>
            <td align="center" style="width:25%;">
              <div style="width:36px; height:36px; border-radius:50%; background:#1a1a1a; color:#fff; line-height:36px; font-size:16px; margin:0 auto 6px;">✓</div>
              <div style="font-size:10px; font-weight:700; color:#1a1a1a; letter-spacing:0.03em;">PLACED</div>
            </td>
            <td align="center" style="width:25%;">
              <div style="width:36px; height:36px; border-radius:50%; background:#ffe7cc; color:#e07000; line-height:36px; font-size:16px; margin:0 auto 6px;">🔥</div>
              <div style="font-size:10px; font-weight:700; color:#e07000; letter-spacing:0.03em;">PREPARING</div>
            </td>
            <td align="center" style="width:25%;">
              <div style="width:36px; height:36px; border-radius:50%; background:#f5f5f5; color:#ccc; line-height:36px; font-size:16px; margin:0 auto 6px;">🛵</div>
              <div style="font-size:10px; font-weight:700; color:#ccc; letter-spacing:0.03em;">ON THE WAY</div>
            </td>
            <td align="center" style="width:25%;">
              <div style="width:36px; height:36px; border-radius:50%; background:#f5f5f5; color:#ccc; line-height:36px; font-size:16px; margin:0 auto 6px;">📦</div>
              <div style="font-size:10px; font-weight:700; color:#ccc; letter-spacing:0.03em;">DELIVERED</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Items — minimal list, no card border -->
  <table role="presentation" width="100%" style="background:#fff;">
    <tr>
      <td style="padding:32px 28px 8px;">
        <div style="font-size:11px; font-weight:800; letter-spacing:0.1em; color:#aaa; margin-bottom:8px;">YOUR ORDER</div>
        <table role="presentation" width="100%" style="border-collapse:collapse;">
          ${itemsHtml}
        </table>
      </td>
    </tr>
  </table>

  <!-- Big total moment -->
  <table role="presentation" width="100%" style="background:#fff;">
    <tr>
      <td style="padding:20px 28px 32px;">
        <table role="presentation" width="100%">
          <tr>
            <td style="font-size:16px; font-weight:700; color:#1a1a1a;">Total paid</td>
            <td style="text-align:right; font-size:30px; font-weight:900; color:#e07000; letter-spacing:-0.02em;">
              ₹${(order.total || 0).toLocaleString()}
            </td>
          </tr>
        </table>
        ${(order.shippingCharge ?? 0) === 0 ? `
        <div style="display:inline-block; background:#e8f9f0; color:#1ea064; font-size:11px; font-weight:800; padding:5px 12px; border-radius:999px; margin-top:8px;">
          🚚 FREE SHIPPING
        </div>` : ''}
      </td>
    </tr>
  </table>

  <!-- CTA — one big bold button -->
  <table role="presentation" width="100%" style="background:#fff;">
    <tr>
      <td style="padding:0 28px 36px; text-align:center;">
        <a href="${baseUrl}/orders/${order._id}"
           style="display:block; background:#1a1a1a; color:#fff; text-decoration:none; font-weight:800; font-size:15px; padding:18px; border-radius:14px; letter-spacing:0.01em;">
          TRACK MY ORDER →
        </a>
      </td>
    </tr>
  </table>

  <!-- Delivery details, understated -->
  <table role="presentation" width="100%" style="background:#faf9f6; border-top:1px solid #f0f0f0;">
    <tr>
      <td style="padding:24px 28px;">
        <table role="presentation" width="100%">
          <tr>
            <td style="font-size:11px; font-weight:800; letter-spacing:0.08em; color:#aaa; padding-bottom:4px;">DELIVERING TO</td>
          </tr>
          <tr>
            <td style="font-size:13px; color:#666; line-height:1.6;">
              ${addr.fullName || ''}<br/>
              ${addr.line1 || ''}${addr.line2 ? `, ${addr.line2}` : ''}<br/>
              ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}
            </td>
          </tr>
          <tr>
            <td style="font-size:11px; font-weight:800; letter-spacing:0.08em; color:#aaa; padding-top:16px; padding-bottom:4px;">PAYMENT</td>
          </tr>
          <tr>
            <td style="font-size:13px; color:#666;">
              ${order.paymentMethod === 'ONLINE' ? '💳 Paid Online' : '💵 Cash on Delivery'}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Playful footer -->
  <table role="presentation" width="100%" style="background:#1a1a1a;">
    <tr>
      <td style="padding:28px 24px; text-align:center;">
        <div style="color:#fff; font-size:14px; font-weight:700; margin-bottom:4px;">
          Since 1873. Still crunchy. Still Solapur. 🌾
        </div>
        <div style="color:rgba(255,255,255,0.5); font-size:12px; margin-top:10px;">
          Questions? Reply here or WhatsApp
          <a href="https://wa.me/919975333427" style="color:#ff9010; text-decoration:none; font-weight:700;">+91 99753 33427</a>
        </div>
      </td>
    </tr>
  </table>
</div>`;

  await sendViaBrevo({
    to: userEmail,
    subject: `🎉 Order Confirmed — ₹${(order.total || 0).toLocaleString()} · Namdev Chiwda`,
    html,
  });
}

module.exports = { sendOrderConfirmation };