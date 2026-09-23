// server/controllers/b2bAdminInvoiceController.js

const Invoice = require('../models/Invoice');
const CreditNote = require('../models/CreditNote');
const { renderInvoicePdf, renderCreditNotePdf } = require('../services/invoicePdfService');
const { issueCreditNoteForInvoice } = require('../utils/b2bCreditNote');
const { sendB2BCreditNoteIssued } = require('../services/emailService');
const { advanceNoteFor } = require('../utils/b2bInvoicing');

exports.listInvoices = async (req, res, next) => {
  try {
    const { business, from, to } = req.query;
    const filter = {};
    if (business) filter.business = business;
    if (from || to) {
      filter.issuedAt = {};
      if (from) filter.issuedAt.$gte = new Date(from);
      if (to) filter.issuedAt.$lte = new Date(to);
    }
    const invoices = await Invoice.find(filter).populate('business', 'businessName isTest').sort('-issuedAt');
    res.json({ success: true, invoices });
  } catch (err) {
    next(err);
  }
};

exports.downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('order', 'orderNumber advancePercent advanceAmount');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber.replace(/\//g, '-')}.pdf"`);
    renderInvoicePdf(invoice, { orderNumber: invoice.order?.orderNumber, advanceNote: advanceNoteFor(invoice.order) }).pipe(res);
  } catch (err) {
    next(err);
  }
};

exports.createCreditNote = async (req, res, next) => {
  try {
    const creditNote = await issueCreditNoteForInvoice(req.params.id, req.body.reason, req.user._id);

    try {
      const invoice = await Invoice.findById(req.params.id).populate('business');
      await sendB2BCreditNoteIssued(creditNote, invoice, invoice.business);
    } catch (emailErr) {
      console.error('B2B credit-note email failed to send:', emailErr.message);
    }

    res.status(201).json({ success: true, creditNote });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

exports.downloadCreditNotePdf = async (req, res, next) => {
  try {
    const creditNote = await CreditNote.findById(req.params.id).populate('invoice');
    if (!creditNote) return res.status(404).json({ success: false, message: 'Credit note not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${creditNote.creditNoteNumber.replace(/\//g, '-')}.pdf"`);
    renderCreditNotePdf(creditNote, creditNote.invoice).pipe(res);
  } catch (err) {
    next(err);
  }
};
