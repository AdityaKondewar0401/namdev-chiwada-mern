/*
  Reminder job — checks every 'pending' Payment and sends a nudge
  (email + WhatsApp) if 3+ days have passed since the last reminder
  (or none has ever been sent). Runs daily via node-cron, and is also
  exported so an admin endpoint can trigger it on demand for testing.

  Each Payment is processed independently and each channel send is
  wrapped separately — one partner's bad email address or a WhatsApp
  failure never blocks reminders for anyone else.
*/

const cron = require('node-cron');
const Payment = require('../models/Payment');
const Consignment = require('../models/Consignment');
const Partner = require('../models/Partner');
const ReminderLog = require('../models/ReminderLog');
const { sendPaymentReminderEmail } = require('../services/emailService');
const { sendWhatsApp } = require('../services/whatsappService');

const REMINDER_INTERVAL_DAYS = 3;
const REMINDER_INTERVAL_MS = REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

async function checkAndSendReminders() {
  const cutoff = new Date(Date.now() - REMINDER_INTERVAL_MS);

  const duePayments = await Payment.find({
    status: 'pending',
    $or: [{ lastReminderSentAt: null }, { lastReminderSentAt: { $lte: cutoff } }],
  });

  let sentCount = 0;

  for (const payment of duePayments) {
    try {
      const [consignment, partner] = await Promise.all([
        Consignment.findById(payment.consignment),
        Partner.findById(payment.partner),
      ]);

      if (!consignment || !partner) continue;

      const emailResult = await sendPaymentReminderEmail(
        partner.email,
        partner.businessName,
        payment,
        consignment
      ).then(
        () => ({ success: true }),
        (err) => ({ success: false, errorMessage: err.message })
      );

      const whatsappResult = await sendWhatsApp({
        to: partner.phone,
        body: `Hi ${partner.businessName}, reminder: your ${payment.installment} payment of ₹${payment.amountDue.toLocaleString('en-IN')} is still pending for the consignment dispatched on ${new Date(consignment.dispatchDate).toLocaleDateString('en-IN')}.`,
      }).then(
        (result) => ({ success: result !== null }),
        (err) => ({ success: false, errorMessage: err.message })
      );

      await ReminderLog.insertMany([
        { payment: payment._id, channel: 'email', success: emailResult.success, errorMessage: emailResult.errorMessage },
        { payment: payment._id, channel: 'whatsapp', success: whatsappResult.success, errorMessage: whatsappResult.errorMessage },
      ]);

      payment.lastReminderSentAt = new Date();
      payment.reminderCount = (payment.reminderCount || 0) + 1;
      await payment.save();

      sentCount += 1;
    } catch (err) {
      console.error(`Reminder job failed for payment ${payment._id}:`, err.message);
    }
  }

  console.log(`🔔 Reminder job: checked ${duePayments.length} pending payment(s), sent ${sentCount} reminder(s)`);
  return { checked: duePayments.length, sent: sentCount };
}

// Runs once a day at 9:00 AM server time. Adjust the cron expression if
// you'd rather it run at a different hour.
function start() {
  cron.schedule('0 9 * * *', () => {
    checkAndSendReminders().catch((err) => console.error('Reminder job crashed:', err.message));
  });
  console.log('🔔 Payment reminder job scheduled (daily, 9:00 AM)');
}

module.exports = { start, checkAndSendReminders };
