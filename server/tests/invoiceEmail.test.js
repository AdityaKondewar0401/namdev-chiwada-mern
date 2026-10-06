const test = require('node:test');
const assert = require('node:assert/strict');

// config/email.js pings Resend when it is first loaded, so fetch is stubbed
// before requiring anything that pulls it in.
const calls = [];
global.fetch = async (url, init = {}) => {
  calls.push({ url, init });
  return { ok: true, status: 200, json: async () => ({ id: 'email_test' }), text: async () => '' };
};

const { sendViaResend } = require('../config/email');
const { isDeliverableEmail, sendInvoiceEmail } = require('../services/emailService');

const lastSend = () => JSON.parse(calls.filter((c) => c.init.method === 'POST').pop().init.body);

test('sendViaResend attaches files as base64 and sets reply-to', async () => {
  await sendViaResend({
    to: 'customer@example.com',
    subject: 'Invoice',
    html: '<p>Hi</p>',
    replyTo: 'care@namdevchiwda.com',
    attachments: [{ filename: 'Namdev-Chiwda-Invoice-NC-26-27-0001.pdf', content: Buffer.from('%PDF-test') }],
  });
  const body = lastSend();
  assert.deepEqual(body.to, ['customer@example.com']);
  assert.equal(body.reply_to, 'care@namdevchiwda.com');
  assert.equal(body.attachments[0].filename, 'Namdev-Chiwda-Invoice-NC-26-27-0001.pdf');
  assert.equal(Buffer.from(body.attachments[0].content, 'base64').toString(), '%PDF-test');
});

test('sendViaResend without attachments keeps the original payload shape', async () => {
  await sendViaResend({ to: 'a@example.com', subject: 'S', html: 'H' });
  const body = lastSend();
  assert.equal('attachments' in body, false);
  assert.equal('reply_to' in body, false);
});

test('sendInvoiceEmail attaches the invoice PDF and escapes the personal note', async () => {
  await sendInvoiceEmail({
    to: ' buyer@example.com ',
    view: {
      number: 'NC/26-27/0007', issuedOn: '5 October 2026', total: 2225, totalLabel: 'Total paid',
      statusLabel: 'Paid', statusTone: 'paid', customer: { name: 'Semtech Pvt Ltd' },
    },
    pdf: Buffer.from('%PDF-invoice'),
    fileName: 'Namdev-Chiwda-Invoice-NC-26-27-0007.pdf',
    message: 'Thanks! <b>Bulk</b> rate applied.',
  });
  const body = lastSend();
  assert.deepEqual(body.to, ['buyer@example.com']);
  assert.match(body.subject, /NC\/26-27\/0007/);
  assert.equal(body.attachments.length, 1);
  assert.equal(body.attachments[0].filename, 'Namdev-Chiwda-Invoice-NC-26-27-0007.pdf');
  assert.match(body.html, /&lt;b&gt;Bulk&lt;\/b&gt;/);
  assert.doesNotMatch(body.html, /<b>Bulk<\/b>/);
});

test('isDeliverableEmail rejects empty and WhatsApp placeholder addresses', () => {
  assert.equal(isDeliverableEmail('customer@example.com'), true);
  assert.equal(isDeliverableEmail(''), false);
  assert.equal(isDeliverableEmail(undefined), false);
  assert.equal(isDeliverableEmail('not-an-email'), false);
  assert.equal(isDeliverableEmail('whatsapp-919876543210@wa.customers.namdevchiwda.local'), false);
});
