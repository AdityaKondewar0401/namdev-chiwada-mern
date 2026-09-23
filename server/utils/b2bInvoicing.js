// server/utils/b2bInvoicing.js
//
// Invoice issuance (spec §6.10), the one transactional write in this
// codebase besides credit notes: Invoice + a debit LedgerEntry + the
// order's `invoice` link all commit together or not at all. Exactly one
// invoice per order (Invoice.order is unique) — re-issuing is rejected,
// not silently overwritten; corrections go through a credit note.

const mongoose = require('mongoose');
const B2BOrder = require('../models/B2BOrder');
const Invoice = require('../models/Invoice');
const LedgerEntry = require('../models/LedgerEntry');
const { businessConfig, REQUIRED_FOR_INVOICING } = require('../config/business');
const { nextInvoiceNumber } = require('./b2bNumbering');
const { getTaxMode, documentTitle, supplierTaxNote } = require('./taxMode');
const { amountInWordsINR } = require('./money');

const TERM_DAYS = { prepaid: 0, net7: 7, net15: 15, net30: 30 };

function httpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * @param {string} orderId
 * @param {string} issuedByUserId - the admin (or system, for
 *   auto-issue-on-dispatch) user recorded as `recordedBy` on the ledger entry
 * @returns {Promise<import('mongoose').Document>} the created Invoice
 */
async function issueInvoiceForOrder(orderId, issuedByUserId) {
  const missing = REQUIRED_FOR_INVOICING.filter((f) => !businessConfig.seller[f]);
  if (missing.length) {
    throw httpError(
      `Cannot issue invoice: seller ${missing.join(' and ')} must be set in the environment first (see server/.env.example).`,
      500
    );
  }

  const session = await mongoose.startSession();
  let createdInvoice;

  try {
    await session.withTransaction(async () => {
      const order = await B2BOrder.findById(orderId).populate('business').session(session);
      if (!order) throw httpError('Order not found', 404);
      if (order.invoice) throw httpError('This order already has an invoice.', 400);
      if (!['confirmed', 'packed', 'dispatched'].includes(order.status)) {
        throw httpError('An invoice can only be issued once the order is confirmed.', 400);
      }

      const business = order.business;
      const { number: invoiceNumber, financialYear } = await nextInvoiceNumber(business.isTest, new Date(), session);

      const termDays = TERM_DAYS[business.paymentTerms] ?? 0;
      const dueDate = new Date(Date.now() + termDays * 24 * 60 * 60 * 1000);

      const [invoice] = await Invoice.create([{
        invoiceNumber,
        financialYear,
        issuedAt: new Date(),
        documentTitle: documentTitle('invoice'),
        taxMode: getTaxMode(),
        supplierTaxNote: supplierTaxNote(),
        order: order._id,
        business: business._id,
        seller: {
          legalName: businessConfig.seller.legalName,
          tradeName: businessConfig.seller.tradeName,
          fssaiLicenseNo: businessConfig.seller.fssaiLicenseNo,
          address: {
            line1: businessConfig.seller.addressLine1,
            line2: businessConfig.seller.addressLine2,
            city: businessConfig.seller.city,
            stateCode: businessConfig.seller.stateCode,
            pincode: businessConfig.seller.pincode,
          },
          phone: businessConfig.seller.phone,
          email: businessConfig.seller.email,
          bank: businessConfig.seller.bank,
        },
        buyer: {
          businessName: order.billing.businessName,
          gstin: order.billing.gstin,
          address: order.billing.address,
        },
        shipTo: order.shippingAddress,
        lines: order.items.map((item, i) => ({
          serialNo: i + 1,
          description: `${item.name} (${item.size})`,
          size: item.size,
          cases: item.cases,
          units: item.units,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        totals: order.totals,
        amountInWords: amountInWordsINR(order.totals.payable),
        dueDate,
        status: 'issued',
      }], { session });

      await LedgerEntry.create([{
        business: business._id,
        date: new Date(),
        type: 'invoice',
        debit: order.totals.payable,
        credit: 0,
        refModel: 'Invoice',
        refId: invoice._id,
        recordedBy: issuedByUserId,
      }], { session });

      order.invoice = invoice._id;
      await order.save({ session });

      createdInvoice = invoice;
    });
  } finally {
    session.endSession();
  }

  return createdInvoice;
}

module.exports = { issueInvoiceForOrder, TERM_DAYS };
