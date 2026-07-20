const { sendViaBrevo } = require('../config/email');

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
      <td style="padding:8px 0; color:#2d1a00; font-size:14px;">
        ${item.name}${item.size ? ` (${item.size})` : ''} × ${item.qty}
      </td>
      <td style="padding:8px 0; text-align:right; color:#2d1a00; font-size:14px;">
        ₹${(item.price * item.qty).toLocaleString()}
      </td>
    </tr>`
    )
    .join('');

  const addr = order.shippingAddress || {};

  const html = `
  <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; background:#fffdf7; border-radius:16px; overflow:hidden; border:1px solid rgba(224,112,0,0.15);">
    <div style="background: linear-gradient(135deg,#e07000,#ff9010); padding: 28px 24px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:22px; font-family: Georgia, serif;">Namdev Chiwada</h1>
      <p style="color:rgba(255,255,255,0.85); margin:4px 0 0; font-size:13px;">Since 1873 · Solapur, Maharashtra</p>
    </div>
    <div style="padding: 28px 24px;">
      <h2 style="color:#2d1a00; font-size:18px; margin:0 0 8px;">Order Confirmed! 🎉</h2>
      <p style="color:#7a5c3a; font-size:14px; line-height:1.6; margin:0 0 20px;">
        Thank you for your order, ${addr.fullName || 'valued customer'}! We're preparing your chiwda with the same care we have since 1873.
      </p>

      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
        ${itemsHtml}
      </table>

      <div style="border-top:1px solid rgba(224,112,0,0.2); padding-top:12px;">
        <table style="width:100%;">
          <tr>
            <td style="font-weight:bold; color:#2d1a00; font-size:15px;">Total</td>
            <td style="text-align:right; font-weight:bold; color:#e07000; font-size:15px;">
              ₹${(order.total || 0).toLocaleString()}
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-top:24px; padding:16px; background:rgba(224,112,0,0.05); border-radius:10px;">
        <p style="color:#7a5c3a; font-size:13px; margin:0 0 6px;"><strong>Payment method:</strong> ${order.paymentMethod || 'N/A'}</p>
        <p style="color:#7a5c3a; font-size:13px; margin:0;">
          <strong>Delivery address:</strong><br/>
          ${addr.line1 || ''}${addr.line2 ? `, ${addr.line2}` : ''}<br/>
          ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}
        </p>
      </div>

      <p style="color:#9a7c5a; font-size:12px; margin-top:24px; text-align:center;">
        Questions about your order? Reply to this email or WhatsApp us at +91 99753 33427.
      </p>
    </div>
  </div>`;

  await sendViaBrevo({
    to: userEmail,
    subject: `Order Confirmed — Namdev Chiwada (₹${(order.total || 0).toLocaleString()})`,
    html,
  });
}

module.exports = { sendOrderConfirmation };