const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const invoiceService = require('../services/invoiceService');
const { invoiceFileName } = require('../utils/invoiceUtils');

function sendPdf(res, invoice, pdf) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${invoiceFileName(invoice.invoiceNumber)}"`,
    'Content-Length': pdf.length,
    'Cache-Control': 'private, no-store',
  });
  res.send(pdf);
}

const notFound = (res, what) => res.status(404).json({ success: false, message: `${what} not found` });

const orderHasNoInvoice = (order) => order.status === 'cancelled' || order.paymentStatus === 'failed';

/* ---------- Website orders ---------- */

// GET /api/orders/:id/invoice/pdf — order owner or admin
exports.downloadOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return notFound(res, 'Order');
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (orderHasNoInvoice(order)) {
      return res.status(409).json({ success: false, message: 'There is no invoice for a cancelled order.' });
    }
    const invoice = await invoiceService.getOrCreateInvoiceForOrder(order);
    sendPdf(res, invoice, await invoiceService.renderPdfForInvoice(invoice, order));
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/invoice/send — admin
exports.sendOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return notFound(res, 'Order');
    if (orderHasNoInvoice(order)) {
      return res.status(409).json({ success: false, message: 'There is no invoice for a cancelled order.' });
    }
    const invoice = await invoiceService.getOrCreateInvoiceForOrder(order);
    const { to } = await invoiceService.emailInvoice(invoice, { to: req.body.to, message: req.body.message, by: req.user._id });
    res.json({ success: true, invoiceNumber: invoice.invoiceNumber, message: `Invoice ${invoice.invoiceNumber} sent to ${to}` });
  } catch (err) {
    next(err);
  }
};

/* ---------- Invoices (admin) ---------- */

exports.listInvoices = async (req, res, next) => {
  try {
    const { q, source, state, page = 1, limit = 20 } = req.query;
    const result = await invoiceService.listInvoices({ q, source, state, page: Number(page), limit: Number(limit) });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const [summary, unitsSold] = await Promise.all([
      invoiceService.offlineSummary(),
      invoiceService.unitsSoldByProduct(),
    ]);
    res.json({ success: true, summary: { ...summary, unitsSold } });
  } catch (err) {
    next(err);
  }
};

exports.searchCustomers = async (req, res, next) => {
  try {
    res.json({ success: true, customers: await invoiceService.recentOfflineCustomers(req.query.q) });
  } catch (err) {
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.createOfflineInvoice(req.body, req.user._id);
    res.status(201).json({
      success: true,
      invoice: invoiceService.presentInvoice(invoice, null),
      message: `Invoice ${invoice.invoiceNumber} created`,
    });
  } catch (err) {
    next(err);
  }
};

async function withInvoice(req, res, next, handler) {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return notFound(res, 'Invoice');
    await handler(invoice);
  } catch (err) {
    next(err);
  }
}

exports.getInvoice = (req, res, next) => withInvoice(req, res, next, async (invoice) => {
  res.json({ success: true, invoice: invoiceService.presentInvoice(invoice, await invoiceService.loadOrderFor(invoice)) });
});

exports.downloadInvoicePdf = (req, res, next) => withInvoice(req, res, next, async (invoice) => {
  sendPdf(res, invoice, await invoiceService.renderPdfForInvoice(invoice));
});

exports.sendInvoice = (req, res, next) => withInvoice(req, res, next, async (invoice) => {
  const { to } = await invoiceService.emailInvoice(invoice, { to: req.body.to, message: req.body.message, by: req.user._id });
  res.json({ success: true, message: `Invoice ${invoice.invoiceNumber} sent to ${to}` });
});

exports.markPaid = (req, res, next) => withInvoice(req, res, next, async (invoice) => {
  const updated = await invoiceService.markInvoicePaid(invoice, req.body);
  res.json({ success: true, invoice: invoiceService.presentInvoice(updated, null), message: `Invoice ${updated.invoiceNumber} marked as paid` });
});

exports.cancelInvoice = (req, res, next) => withInvoice(req, res, next, async (invoice) => {
  const updated = await invoiceService.cancelInvoice(invoice, req.body.reason);
  res.json({ success: true, invoice: invoiceService.presentInvoice(updated, null), message: `Invoice ${updated.invoiceNumber} cancelled` });
});
