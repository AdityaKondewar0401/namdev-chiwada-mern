const { sendViaResend } = require('../config/email');

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
                <td style="font-size:14px; font-weight:700; color:#2d1a00;">Total paid</td>
                <td class="total-num" align="right" style="font-size:27px; font-weight:800; color:#e07000; letter-spacing:-0.01em;">
                  ₹${(order.total || 0).toLocaleString()}
                </td>
              </tr>
            </table>
            ${freeShip ? `
            <div class="pill" style="display:inline-block; background:#1ea064; color:#fff; font-size:11px; font-weight:800; padding:6px 14px; margin-top:10px;">
              🚚 FREE SHIPPING
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
  });
}

/*
  ───────────────────────────────────────────────────────────
  B2B onboarding emails (Phase 2). Same Resend transport and the same
  visual language as sendOrderConfirmation above (dark brand header,
  warm card body, dark footer with the WhatsApp contact + FSSAI line),
  via one shared shell instead of four near-duplicate HTML blocks.

  Best-effort, same convention as sendOrderConfirmation's own call site
  in orderCreation.js: callers wrap these in try/catch so a failed send
  never fails the action that triggered it (applying, approving,
  rejecting, suspending).
  ───────────────────────────────────────────────────────────
*/
const B2B_CLIENT_URL = process.env.CLIENT_URL || 'https://namdev-chiwada-mern.vercel.app';

function b2bEmailShell({ eyebrow, heading, bodyHtml, ctaText, ctaUrl }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${heading}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  body { margin:0; padding:0; background:#f2e4c8; font-family:'Poppins', Arial, Helvetica, sans-serif; }
  table { border-collapse:collapse; }
  img { border:0; display:block; }
  a { text-decoration:none; }
  .wrapper { width:100%; background:radial-gradient(circle at 50% 0%, #fbe7bd 0%, #f2e4c8 55%); padding:32px 16px; }
  .container { max-width:520px; margin:0 auto; background:#fffdf7; border-radius:24px; overflow:hidden; box-shadow:0 20px 45px rgba(45,26,0,0.16); }
  @media only screen and (max-width:480px) {
    .wrapper { padding:18px 10px; }
    .pad { padding-left:20px !important; padding-right:20px !important; }
  }
</style>
</head>
<body>
<div class="wrapper">
<table role="presentation" width="100%"><tr><td align="center">
<table role="presentation" class="container" width="520" style="width:520px;">
  <tr>
    <td style="background:#2d1a00; padding:20px 24px; text-align:center;">
      <img src="${LOGO_URL}" alt="Namdev Chiwda" width="120" style="display:inline-block; border-radius:14px;" />
      <span style="color:#f0cc5a; font-size:19px; font-weight:700; letter-spacing:0.1em; vertical-align:middle; margin-left:12px;">NAMDEV CHIWDA</span>
    </td>
  </tr>
  <tr>
    <td class="pad" style="padding:34px 32px 10px; text-align:center;">
      <div style="font-size:11px; font-weight:800; letter-spacing:0.1em; color:#c8902a; margin-bottom:10px;">${eyebrow}</div>
      <div style="font-size:22px; font-weight:800; color:#2d1a00; line-height:1.3;">${heading}</div>
    </td>
  </tr>
  <tr>
    <td class="pad" style="padding:14px 32px 8px; color:#5a4326; font-size:14px; line-height:1.7;">
      ${bodyHtml}
    </td>
  </tr>
  ${ctaUrl ? `
  <tr>
    <td class="pad" style="padding:14px 32px 34px;">
      <table role="presentation" width="100%"><tr>
        <td style="border-radius:999px; background:linear-gradient(135deg,#ff9a2e,#e07000); text-align:center; box-shadow:0 10px 22px rgba(224,112,0,0.3);">
          <a href="${ctaUrl}" style="display:block; color:#fff; font-weight:800; font-size:14px; padding:15px; letter-spacing:0.02em;">${ctaText} →</a>
        </td>
      </tr></table>
    </td>
  </tr>` : '<tr><td style="height:20px;"></td></tr>'}
  <tr>
    <td style="background:#2d1a00; padding:22px 24px; text-align:center;">
      <div style="color:rgba(255,255,255,0.55); font-size:11px; line-height:1.6;">
        Questions? WhatsApp <a href="https://wa.me/919130160491" style="color:#ff9010; font-weight:700;">+91 91301 60491</a>
      </div>
      <div style="color:rgba(255,255,255,0.35); font-size:10px; margin-top:8px;">FSSAI Lic. No: 21526041003460</div>
    </td>
  </tr>
</table>
</td></tr></table>
</div>
</body>
</html>`;
}

async function sendB2BApplicationReceived(business, user) {
  const applicantHtml = b2bEmailShell({
    eyebrow: 'WHOLESALE APPLICATION',
    heading: 'We’ve received your application',
    bodyHtml: `Thanks for applying for a Namdev Chiwda wholesale account, ${business.businessName}. Our team will review your details and get back to you shortly.`,
    ctaText: 'View application status',
    ctaUrl: `${B2B_CLIENT_URL}/b2b`,
  });

  const sends = [];
  if (user?.email) {
    sends.push(sendViaResend({ to: user.email, subject: 'Wholesale application received — Namdev Chiwda', html: applicantHtml }));
  }

  const adminEmail = process.env.B2B_ADMIN_NOTIFY_EMAIL || 'care@namdevchiwda.com';
  const adminHtml = b2bEmailShell({
    eyebrow: 'NEW APPLICATION',
    heading: `New wholesale application: ${business.businessName}`,
    bodyHtml: `${business.businessName} (${business.businessType}) just applied for a wholesale account. Contact: ${business.contactName || user?.name || '—'} · ${business.phone || user?.email || '—'}.`,
    ctaText: 'Review in admin panel',
    ctaUrl: `${B2B_CLIENT_URL}/admin`,
  });
  sends.push(sendViaResend({ to: adminEmail, subject: `New wholesale application — ${business.businessName}`, html: adminHtml }));

  // Best-effort per-recipient: one failing (e.g. a bad applicant email)
  // must never suppress the other.
  const results = await Promise.allSettled(sends);
  const failed = results.find((r) => r.status === 'rejected');
  if (failed) throw failed.reason;
}

async function sendB2BApplicationApproved(business, user) {
  if (!user?.email) return;
  const html = b2bEmailShell({
    eyebrow: 'APPLICATION APPROVED',
    heading: `You're approved, ${business.businessName}!`,
    bodyHtml: 'Your Namdev Chiwda wholesale account is now active. You can view wholesale pricing and place orders from your business dashboard.',
    ctaText: 'Go to business dashboard',
    ctaUrl: `${B2B_CLIENT_URL}/b2b`,
  });
  await sendViaResend({ to: user.email, subject: 'Your wholesale account is approved — Namdev Chiwda', html });
}

async function sendB2BApplicationRejected(business, user) {
  if (!user?.email) return;
  const reasonHtml = business.rejectionReason
    ? `<div style="margin-top:10px; padding:12px 14px; background:#fef3e0; border-radius:12px; font-size:13px; color:#7a3300;"><strong>Reason:</strong> ${business.rejectionReason}</div>`
    : '';
  const html = b2bEmailShell({
    eyebrow: 'APPLICATION UPDATE',
    heading: 'Your wholesale application was not approved',
    bodyHtml: `We're unable to approve your wholesale application for ${business.businessName} at this time.${reasonHtml}<div style="margin-top:10px;">You're welcome to update your details and re-apply.</div>`,
    ctaText: 'Re-apply',
    ctaUrl: `${B2B_CLIENT_URL}/business/apply`,
  });
  await sendViaResend({ to: user.email, subject: 'Update on your wholesale application — Namdev Chiwda', html });
}

async function sendB2BAccountSuspended(business, user) {
  if (!user?.email) return;
  const html = b2bEmailShell({
    eyebrow: 'ACCOUNT SUSPENDED',
    heading: 'Your wholesale account has been suspended',
    bodyHtml: `Your Namdev Chiwda wholesale account for ${business.businessName} has been temporarily suspended. Please contact us for details.`,
    ctaText: 'Contact us',
    ctaUrl: `${B2B_CLIENT_URL}/contact`,
  });
  await sendViaResend({ to: user.email, subject: 'Your wholesale account has been suspended — Namdev Chiwda', html });
}

/*
  ───────────────────────────────────────────────────────────
  B2B order emails (Phase 3). Same shell, same best-effort convention as
  the onboarding emails above — callers wrap these in try/catch.
  ───────────────────────────────────────────────────────────
*/
function b2bOrderItemsHtml(order) {
  return (order.items || [])
    .map((item, i) => `
    <tr>
      <td style="padding:10px 0; ${i > 0 ? 'border-top:1px solid rgba(224,112,0,0.1);' : ''} color:#2d1a00; font-size:13px;">
        ${item.name} <span style="color:#9a7c5a;">· ${item.size} · ${item.cases} case${item.cases > 1 ? 's' : ''}</span>
      </td>
      <td style="padding:10px 0; ${i > 0 ? 'border-top:1px solid rgba(224,112,0,0.1);' : ''} text-align:right; color:#2d1a00; font-size:13px; font-weight:700; white-space:nowrap;">
        ₹${item.lineTotal.toLocaleString('en-IN')}
      </td>
    </tr>`)
    .join('');
}

async function sendB2BOrderPlaced(order, business, user) {
  const testTag = business.isTest ? ' [TEST]' : '';
  const holdNote = order.creditHold
    ? '<div style="margin-top:10px; padding:10px 14px; background:#fef2f2; color:#991b1b; border-radius:10px; font-size:13px;"><strong>On credit hold</strong> — confirm requires an override.</div>'
    : '';

  const buyerHtml = b2bEmailShell({
    eyebrow: 'ORDER PLACED',
    heading: `Order ${order.orderNumber} received`,
    bodyHtml: `<table role="presentation" width="100%">${b2bOrderItemsHtml(order)}</table>
      <div style="margin-top:12px; font-weight:800; font-size:15px; color:#2d1a00;">Total: ₹${order.totals.payable.toLocaleString('en-IN')}</div>`,
    ctaText: 'View order',
    ctaUrl: `${B2B_CLIENT_URL}/b2b/orders/${order._id}`,
  });

  const adminHtml = b2bEmailShell({
    eyebrow: 'NEW B2B ORDER' + testTag,
    heading: `${order.orderNumber} — ${business.businessName}${testTag}`,
    bodyHtml: `<table role="presentation" width="100%">${b2bOrderItemsHtml(order)}</table>
      <div style="margin-top:12px; font-weight:800; font-size:15px; color:#2d1a00;">Total: ₹${order.totals.payable.toLocaleString('en-IN')}</div>
      ${holdNote}`,
    ctaText: 'Review in admin panel',
    ctaUrl: `${B2B_CLIENT_URL}/admin`,
  });

  const sends = [];
  if (user?.email) sends.push(sendViaResend({ to: user.email, subject: `Order ${order.orderNumber} received — Namdev Chiwda`, html: buyerHtml }));
  const adminEmail = process.env.B2B_ADMIN_NOTIFY_EMAIL || 'care@namdevchiwda.com';
  sends.push(sendViaResend({ to: adminEmail, subject: `New B2B order${testTag} — ${order.orderNumber}`, html: adminHtml }));

  const results = await Promise.allSettled(sends);
  const failed = results.find((r) => r.status === 'rejected');
  if (failed) throw failed.reason;
}

async function sendB2BOrderEdited(order, business, before, after) {
  if (!business?.user?.email && !business?.email) return;
  const to = business.user?.email || business.email;
  if (!to) return;

  const html = b2bEmailShell({
    eyebrow: 'ORDER UPDATED',
    heading: `Order ${order.orderNumber} was updated`,
    bodyHtml: `Your order's items were adjusted by our team.
      <div style="margin-top:12px; font-size:13px;">
        <div style="color:#9a7c5a;">Previous total: ₹${(before?.totals?.payable || 0).toLocaleString('en-IN')}</div>
        <div style="font-weight:800; color:#2d1a00; margin-top:4px;">New total: ₹${(after?.totals?.payable || order.totals.payable).toLocaleString('en-IN')}</div>
      </div>`,
    ctaText: 'View order',
    ctaUrl: `${B2B_CLIENT_URL}/b2b/orders/${order._id}`,
  });
  await sendViaResend({ to, subject: `Order ${order.orderNumber} updated — Namdev Chiwda`, html });
}

const STATUS_COPY = {
  confirmed: { eyebrow: 'ORDER CONFIRMED', heading: 'Your order is confirmed' },
  packed: { eyebrow: 'ORDER PACKED', heading: 'Your order has been packed' },
  dispatched: { eyebrow: 'ORDER DISPATCHED', heading: 'Your order is on its way' },
  delivered: { eyebrow: 'ORDER DELIVERED', heading: 'Your order has been delivered' },
  cancelled: { eyebrow: 'ORDER CANCELLED', heading: 'Your order was cancelled' },
  rejected: { eyebrow: 'ORDER REJECTED', heading: 'Your order was not accepted' },
};

async function sendB2BOrderStatusUpdate(order, business) {
  const to = business?.user?.email || business?.email;
  if (!to) return;
  const copy = STATUS_COPY[order.status];
  if (!copy) return; // 'placed' has its own function above

  let extra = '';
  if (order.status === 'dispatched' && order.dispatch) {
    extra = `<div style="margin-top:10px; font-size:13px; color:#5a4326;">
      ${order.dispatch.transporterName ? `Transporter: ${order.dispatch.transporterName}<br/>` : ''}
      ${order.dispatch.lrNumber ? `LR number: ${order.dispatch.lrNumber}<br/>` : ''}
      ${order.dispatch.vehicleNumber ? `Vehicle: ${order.dispatch.vehicleNumber}<br/>` : ''}
    </div>`;
  }
  if (order.status === 'cancelled' && order.cancelReason) {
    extra = `<div style="margin-top:10px; font-size:13px; color:#7a3300;"><strong>Reason:</strong> ${order.cancelReason}</div>`;
  }
  if (order.status === 'rejected' && order.rejectReason) {
    extra = `<div style="margin-top:10px; font-size:13px; color:#7a3300;"><strong>Reason:</strong> ${order.rejectReason}</div>`;
  }

  const html = b2bEmailShell({
    eyebrow: copy.eyebrow,
    heading: `${copy.heading} — ${order.orderNumber}`,
    bodyHtml: `Order ${order.orderNumber} for ${business.businessName || ''} is now <strong>${order.status}</strong>.${extra}`,
    ctaText: 'View order',
    ctaUrl: `${B2B_CLIENT_URL}/b2b/orders/${order._id}`,
  });
  await sendViaResend({ to, subject: `${copy.heading} — ${order.orderNumber}`, html });
}

/*
  ───────────────────────────────────────────────────────────
  B2B invoice/payment emails (Phase 4). Same shell, same best-effort
  convention as everything above.
  ───────────────────────────────────────────────────────────
*/
async function sendB2BInvoiceIssued(invoice, business) {
  const to = business?.user?.email || business?.email;
  if (!to) return;
  const testTag = business.isTest ? ' [TEST]' : '';
  const html = b2bEmailShell({
    eyebrow: 'INVOICE ISSUED' + testTag,
    heading: `Invoice ${invoice.invoiceNumber}`,
    bodyHtml: `Your invoice for ${business.businessName || ''} is ready.
      <div style="margin-top:10px; font-size:13px;">
        <div>Amount: <strong>₹${invoice.totals.payable.toLocaleString('en-IN')}</strong></div>
        <div style="margin-top:2px;">Due date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}</div>
      </div>`,
    ctaText: 'View invoices',
    ctaUrl: `${B2B_CLIENT_URL}/b2b/invoices`,
  });
  await sendViaResend({ to, subject: `Invoice ${invoice.invoiceNumber}${testTag} — Namdev Chiwda`, html });
}

async function sendB2BPaymentRecorded(business, ledgerEntry) {
  const to = business?.user?.email || business?.email;
  if (!to) return;
  const html = b2bEmailShell({
    eyebrow: 'PAYMENT RECORDED',
    heading: 'We’ve recorded your payment',
    bodyHtml: `A payment of <strong>₹${ledgerEntry.credit.toLocaleString('en-IN')}</strong> was recorded on your account
      ${ledgerEntry.reference ? ` (ref: ${ledgerEntry.reference})` : ''}.`,
    ctaText: 'View statement',
    ctaUrl: `${B2B_CLIENT_URL}/b2b/statement`,
  });
  await sendViaResend({ to, subject: 'Payment recorded — Namdev Chiwda', html });
}

async function sendB2BCreditNoteIssued(creditNote, invoice, business) {
  const to = business?.user?.email || business?.email;
  if (!to) return;
  const html = b2bEmailShell({
    eyebrow: 'CREDIT NOTE ISSUED',
    heading: `Credit note ${creditNote.creditNoteNumber}`,
    bodyHtml: `A credit note was issued against invoice ${invoice.invoiceNumber} for <strong>₹${creditNote.totals.payable.toLocaleString('en-IN')}</strong>.
      <div style="margin-top:10px; font-size:13px; color:#7a3300;"><strong>Reason:</strong> ${creditNote.reason}</div>`,
    ctaText: 'View statement',
    ctaUrl: `${B2B_CLIENT_URL}/b2b/statement`,
  });
  await sendViaResend({ to, subject: `Credit note ${creditNote.creditNoteNumber} — Namdev Chiwda`, html });
}

module.exports = {
  sendOrderConfirmation,
  sendB2BApplicationReceived,
  sendB2BApplicationApproved,
  sendB2BApplicationRejected,
  sendB2BAccountSuspended,
  sendB2BOrderPlaced,
  sendB2BOrderEdited,
  sendB2BOrderStatusUpdate,
  sendB2BInvoiceIssued,
  sendB2BPaymentRecorded,
  sendB2BCreditNoteIssued,
};
