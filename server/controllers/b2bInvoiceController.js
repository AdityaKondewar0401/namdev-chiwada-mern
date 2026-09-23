// server/controllers/b2bInvoiceController.js
//
// Business-facing invoice/credit-note/ledger reads (Phase 4). Every
// query scoped to req.business._id — own documents only.

const Invoice = require('../models/Invoice');
const CreditNote = require('../models/CreditNote');
const { renderInvoicePdf, renderCreditNotePdf } = require('../services/invoicePdfService');
const { buildStatement, statementToCsv } = require('../utils/b2bStatement');
const { getCreditSummary } = require('../utils/b2bCredit');

exports.getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ business: req.business._id }).sort('-issuedAt');
    res.json({ success: true, invoices });
  } catch (err) {
    next(err);
  }
};

exports.getMyInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.business._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

exports.downloadMyInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.business._id })
      .populate('order', 'orderNumber paymentTermsSnapshot');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber.replace(/\//g, '-')}.pdf"`);
    renderInvoicePdf(invoice, { orderNumber: invoice.order?.orderNumber, paymentTerms: invoice.order?.paymentTermsSnapshot }).pipe(res);
  } catch (err) {
    next(err);
  }
};

exports.downloadMyCreditNotePdf = async (req, res, next) => {
  try {
    const creditNote = await CreditNote.findOne({ _id: req.params.id, business: req.business._id }).populate('invoice');
    if (!creditNote) return res.status(404).json({ success: false, message: 'Credit note not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${creditNote.creditNoteNumber.replace(/\//g, '-')}.pdf"`);
    renderCreditNotePdf(creditNote, creditNote.invoice).pipe(res);
  } catch (err) {
    next(err);
  }
};

exports.getMyLedger = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const [statement, creditSummary] = await Promise.all([
      buildStatement(req.business._id, { from, to }),
      getCreditSummary(req.business._id),
    ]);
    res.json({ success: true, ...statement, creditSummary });
  } catch (err) {
    next(err);
  }
};

exports.exportMyLedgerCsv = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const statement = await buildStatement(req.business._id, { from, to });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="statement.csv"');
    res.send(statementToCsv(statement));
  } catch (err) {
    next(err);
  }
};
