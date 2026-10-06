const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { createInvoiceWithNumber } = require('../utils/invoiceNumber');
const {
  round2, amountInWords, formatDateIST, invoiceFileName, computeTotals, istDateKey,
} = require('../utils/invoiceUtils');
const { mergeUnitsSold } = require('../utils/unitsSold');
const { renderInvoicePdf } = require('./invoicePdf');
const { sendInvoiceEmail, isDeliverableEmail } = require('./emailService');

const ORDER_PAYMENT_LABELS = { COD: 'Cash on delivery', ONLINE: 'Online payment' };
const OFFLINE_PAYMENT_LABELS = { cash: 'Cash', upi: 'UPI', bank: 'Bank transfer', card: 'Card', credit: 'Credit' };

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function addressLinesFromOrder(address = {}) {
  const pincode = address.pincode || address.zip;
  const cityLine = [[address.city, address.state].filter(Boolean).join(', '), pincode].filter(Boolean).join(' ');
  return [address.line1 || address.street, address.line2, cityLine].filter((line) => line && String(line).trim());
}

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode, expose: true });

/** Idempotent: one invoice per order, numbered the first time it is needed. */
async function getOrCreateInvoiceForOrder(order) {
  const existing = await Invoice.findOne({ order: order._id });
  if (existing) return existing;

  const user = await User.findById(order.user).select('email').lean();
  const address = order.shippingAddress || {};
  try {
    return await createInvoiceWithNumber({
      source: 'website',
      order: order._id,
      issuedAt: order.createdAt,
      customer: {
        name: address.fullName || address.name || 'Customer',
        phone: address.phone || '',
        email: isDeliverableEmail(user?.email) ? user.email : '',
        addressLines: addressLinesFromOrder(address),
      },
      items: order.items.map((item) => ({
        product: item.product,
        name: item.name,
        size: item.size || item.weight || '',
        price: item.price,
        qty: item.qty,
        amount: round2(item.price * item.qty),
      })),
      subtotal: order.subtotal,
      discount: order.discount || 0,
      discountLabel: order.promoCode ? `Discount (${order.promoCode.toUpperCase()})` : 'Discount',
      shipping: order.shippingCharge || 0,
      total: order.total,
    });
  } catch (err) {
    if (err?.code === 11000 && err.keyPattern?.order) return Invoice.findOne({ order: order._id });
    throw err;
  }
}

// Website invoices follow their order live: a cancelled order (or failed
// payment) cancels the invoice, and a delivered COD order counts as paid
// because COD orders never get paymentStatus 'paid' themselves.
function invoiceState(invoice, order) {
  if (invoice.source === 'website') {
    const cancelled = Boolean(order && (order.status === 'cancelled' || order.paymentStatus === 'failed'));
    const paid = Boolean(order && (order.paymentStatus === 'paid'
      || (order.paymentMethod === 'COD' && order.status === 'delivered')));
    return {
      cancelled,
      paid: paid && !cancelled,
      paymentMethod: ORDER_PAYMENT_LABELS[order?.paymentMethod] || order?.paymentMethod || '',
      paymentRef: order?.razorpayPaymentId || '',
      dueLabel: order?.paymentMethod === 'COD' ? 'Due on delivery' : 'Payment pending',
    };
  }
  const cancelled = invoice.status === 'cancelled';
  return {
    cancelled,
    paid: !cancelled && invoice.payment?.status === 'paid',
    paymentMethod: OFFLINE_PAYMENT_LABELS[invoice.payment?.method] || '',
    paymentRef: invoice.payment?.reference || '',
    dueLabel: 'Payment due',
  };
}

function presentInvoice(invoice, order) {
  const state = invoiceState(invoice, order);
  const allPacks = invoice.items.every((line) => line.size);
  return {
    id: String(invoice._id),
    number: invoice.invoiceNumber,
    source: invoice.source,
    orderId: invoice.order ? String(invoice.order._id || invoice.order) : null,
    issuedAt: invoice.issuedAt,
    issuedOn: formatDateIST(invoice.issuedAt),
    customer: {
      name: invoice.customer.name,
      phone: invoice.customer.phone || '',
      email: invoice.customer.email || '',
      addressLines: invoice.customer.addressLines || [],
    },
    lines: invoice.items.map(({ name, size, price, qty, amount }) => ({ name, size, price, qty, amount })),
    units: allPacks ? invoice.items.reduce((sum, line) => sum + line.qty, 0) : null,
    subtotal: invoice.subtotal,
    shipping: invoice.shipping,
    showShipping: invoice.source === 'website' || invoice.shipping > 0,
    shippingLabel: invoice.source === 'website' ? 'Shipping' : 'Delivery charge',
    discount: invoice.discount,
    discountLabel: invoice.discountLabel || 'Discount',
    total: invoice.total,
    paymentMethod: state.paymentMethod,
    paymentRef: state.paymentRef,
    paid: state.paid,
    cancelled: state.cancelled,
    statusLabel: state.cancelled ? 'Cancelled' : state.paid ? 'Paid' : state.dueLabel,
    statusTone: state.cancelled ? 'cancelled' : state.paid ? 'paid' : 'due',
    totalLabel: state.paid ? 'Total paid' : 'Amount payable',
    amountInWords: amountInWords(invoice.total),
    notes: invoice.notes || '',
    cancelReason: invoice.cancelReason || '',
    emailLog: (invoice.emailLog || []).map(({ to, at, kind, ok, error }) => ({ to, at, kind, ok, error })),
  };
}

const loadOrderFor = (invoice) => (invoice.source === 'website' ? Order.findById(invoice.order).lean() : null);

async function renderPdfForInvoice(invoice, order) {
  const linked = order !== undefined ? order : await loadOrderFor(invoice);
  return renderInvoicePdf(presentInvoice(invoice, linked));
}

/** Emails the invoice PDF and records the attempt on the invoice either way. */
async function emailInvoice(invoice, { to, message = '', by = null, kind = 'manual' }) {
  const view = presentInvoice(invoice, await loadOrderFor(invoice));
  if (view.cancelled) throw httpError(409, 'This invoice is cancelled, so it cannot be sent.');
  if (!isDeliverableEmail(to)) throw httpError(400, 'Enter a valid email address.');

  const pdf = await renderInvoicePdf(view);
  let failure = null;
  try {
    await sendInvoiceEmail({ to, view, pdf, fileName: invoiceFileName(invoice.invoiceNumber), message });
  } catch (err) {
    failure = err;
  }
  await Invoice.updateOne(
    { _id: invoice._id },
    { $push: { emailLog: { to: to.trim(), at: new Date(), by, kind, ok: !failure, error: failure?.message?.slice(0, 300) } } }
  );
  if (failure) {
    console.error(`Invoice ${invoice.invoiceNumber} email failed:`, failure.message);
    throw httpError(502, "The email couldn't be sent. Check the address and try again.");
  }
  return { to: to.trim() };
}

/**
 * Issues the invoice for a freshly placed order and returns it ready to attach
 * to the confirmation email. Never throws: checkout must not fail because of
 * invoicing, so any error is logged and the email simply goes without it.
 */
async function invoiceForNewOrder(order) {
  try {
    const invoice = await getOrCreateInvoiceForOrder(order);
    const pdf = await renderPdfForInvoice(invoice, order);
    return { invoice, attachment: { filename: invoiceFileName(invoice.invoiceNumber), content: pdf } };
  } catch (err) {
    console.error(`Invoice for order ${order._id} could not be created:`, err.message);
    return null;
  }
}

async function logInvoiceEmail(invoice, entry) {
  try {
    await Invoice.updateOne({ _id: invoice._id }, { $push: { emailLog: { at: new Date(), ...entry } } });
  } catch (err) {
    console.error(`Could not record email for invoice ${invoice.invoiceNumber}:`, err.message);
  }
}

// A past date is stamped at noon IST so it can't drift into another day in UTC.
function resolveIssuedAt(issuedOn) {
  if (!issuedOn || issuedOn === istDateKey()) return new Date();
  return new Date(`${issuedOn}T12:00:00+05:30`);
}

async function createOfflineInvoice(input, adminId) {
  const items = input.items.map((item) => ({
    product: item.product || undefined,
    name: item.name.trim(),
    size: (item.size || '').trim(),
    price: round2(item.price),
    qty: Number(item.qty),
  }));
  const discountSpec = { type: input.discountType === 'percent' ? 'percent' : 'flat', value: input.discountValue };
  const { lines, subtotal, discount, shipping, total } = computeTotals(items, discountSpec, input.shipping);
  const issuedAt = resolveIssuedAt(input.issuedOn);
  const paid = input.paymentMethod !== 'credit';

  return createInvoiceWithNumber({
    source: 'offline',
    issuedAt,
    customer: {
      name: input.customer.name.trim(),
      phone: (input.customer.phone || '').trim(),
      email: (input.customer.email || '').trim(),
      addressLines: String(input.customer.address || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 4),
    },
    items: lines,
    subtotal,
    discount,
    discountLabel: discount > 0 && discountSpec.type === 'percent' ? `Discount (${round2(discountSpec.value)}%)` : 'Discount',
    shipping,
    total,
    payment: {
      method: input.paymentMethod,
      status: paid ? 'paid' : 'due',
      reference: (input.paymentReference || '').trim(),
      paidAt: paid ? issuedAt : undefined,
    },
    notes: (input.notes || '').trim(),
    createdBy: adminId,
  });
}

function assertOfflineIssued(invoice) {
  if (invoice.source !== 'offline') {
    throw httpError(409, 'Website invoices follow their order. Cancel or update the order instead.');
  }
  if (invoice.status === 'cancelled') throw httpError(409, 'This invoice is already cancelled.');
}

async function markInvoicePaid(invoice, { method, reference }) {
  assertOfflineIssued(invoice);
  if (invoice.payment?.status === 'paid') throw httpError(409, 'This invoice is already paid.');
  invoice.payment.status = 'paid';
  invoice.payment.method = method;
  if (reference) invoice.payment.reference = reference.trim();
  invoice.payment.paidAt = new Date();
  return invoice.save();
}

async function cancelInvoice(invoice, reason) {
  assertOfflineIssued(invoice);
  invoice.status = 'cancelled';
  invoice.cancelledAt = new Date();
  invoice.cancelReason = reason.trim();
  return invoice.save();
}

// Website invoices are paid/cancelled according to their order, so both
// states are derived in the pipeline before filtering.
const STATE_STAGES = [
  { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'linkedOrder' } },
  { $addFields: { linkedOrder: { $arrayElemAt: ['$linkedOrder', 0] } } },
  {
    $addFields: {
      isCancelled: {
        $cond: [
          { $eq: ['$source', 'website'] },
          { $or: [{ $eq: ['$linkedOrder.status', 'cancelled'] }, { $eq: ['$linkedOrder.paymentStatus', 'failed'] }] },
          { $eq: ['$status', 'cancelled'] },
        ],
      },
      isPaid: {
        $cond: [
          { $eq: ['$source', 'website'] },
          {
            $or: [
              { $eq: ['$linkedOrder.paymentStatus', 'paid'] },
              { $and: [{ $eq: ['$linkedOrder.paymentMethod', 'COD'] }, { $eq: ['$linkedOrder.status', 'delivered'] }] },
            ],
          },
          { $eq: ['$payment.status', 'paid'] },
        ],
      },
    },
  },
];

async function listInvoices({ q, source, state, page = 1, limit = 20 }) {
  const match = {};
  if (source) match.source = source;
  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    match.$or = [{ invoiceNumber: rx }, { 'customer.name': rx }, { 'customer.phone': rx }, { 'customer.email': rx }];
  }
  const stateMatch = {
    paid: { isCancelled: false, isPaid: true },
    due: { isCancelled: false, isPaid: false },
    cancelled: { isCancelled: true },
  }[state] || {};

  const [result] = await Invoice.aggregate([
    { $match: match },
    ...STATE_STAGES,
    { $match: stateMatch },
    { $sort: { issuedAt: -1, seq: -1 } },
    {
      $facet: {
        rows: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'n' }],
      },
    },
  ]);

  const rows = result.rows.map((row) => {
    const view = presentInvoice(row, row.linkedOrder || null);
    const lastEmail = view.emailLog[view.emailLog.length - 1];
    return {
      id: view.id,
      number: view.number,
      source: view.source,
      orderId: view.orderId,
      issuedAt: view.issuedAt,
      customer: { name: view.customer.name, phone: view.customer.phone, email: view.customer.email },
      total: view.total,
      paymentMethod: view.paymentMethod,
      statusLabel: view.statusLabel,
      statusTone: view.statusTone,
      lastEmail: lastEmail || null,
    };
  });
  const total = result.total[0]?.n || 0;
  return { invoices: rows, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

async function offlineSummary() {
  const [row] = await Invoice.aggregate([
    { $match: { source: 'offline', status: 'issued' } },
    {
      $group: {
        _id: null,
        sales: { $sum: '$total' },
        count: { $sum: 1 },
        due: { $sum: { $cond: [{ $eq: ['$payment.status', 'due'] }, '$total', 0] } },
        dueCount: { $sum: { $cond: [{ $eq: ['$payment.status', 'due'] }, 1, 0] } },
      },
    },
  ]);
  return {
    offlineSales: round2(row?.sales || 0),
    offlineCount: row?.count || 0,
    offlineDue: round2(row?.due || 0),
    offlineDueCount: row?.dueCount || 0,
  };
}

const unitLines = (match, size) => [
  { $match: match },
  { $unwind: '$items' },
  { $group: { _id: { product: '$items.product', name: '$items.name', size }, qty: { $sum: '$items.qty' } } },
  { $project: { _id: 0, product: '$_id.product', name: '$_id.name', size: '$_id.size', qty: 1 } },
];

// Counts the same sales as the dashboard's Total Sales: delivered website and
// WhatsApp orders plus issued (not cancelled) offline invoices, credit included.
async function unitsSoldByProduct() {
  const [online, offline, products] = await Promise.all([
    Order.aggregate(unitLines({ status: 'delivered' }, { $ifNull: ['$items.size', '$items.weight'] })),
    Invoice.aggregate(unitLines({ source: 'offline', status: 'issued' }, '$items.size')),
    Product.find({}).select('name').lean(),
  ]);
  return mergeUnitsSold({ online, offline, products });
}

// One suggestion per customer (by phone, else by name), latest details first.
// A phoneless entry is dropped when the same name also appears with a phone.
async function recentOfflineCustomers(q) {
  const rx = new RegExp(escapeRegex(q.trim()), 'i');
  const customers = await Invoice.aggregate([
    { $match: { source: 'offline', $or: [{ 'customer.name': rx }, { 'customer.phone': rx }] } },
    { $sort: { issuedAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $gt: [{ $strLenCP: { $ifNull: ['$customer.phone', ''] } }, 0] },
            '$customer.phone',
            { $toLower: '$customer.name' },
          ],
        },
        customer: { $first: '$customer' },
        lastAt: { $first: '$issuedAt' },
      },
    },
    { $sort: { lastAt: -1 } },
    { $limit: 20 },
    { $replaceRoot: { newRoot: '$customer' } },
  ]);
  const namesWithPhone = new Set(customers.filter((c) => c.phone).map((c) => c.name.toLowerCase()));
  return customers.filter((c) => c.phone || !namesWithPhone.has(c.name.toLowerCase())).slice(0, 8);
}

module.exports = {
  getOrCreateInvoiceForOrder,
  invoiceForNewOrder,
  logInvoiceEmail,
  presentInvoice,
  renderPdfForInvoice,
  loadOrderFor,
  emailInvoice,
  createOfflineInvoice,
  markInvoicePaid,
  cancelInvoice,
  listInvoices,
  offlineSummary,
  unitsSoldByProduct,
  recentOfflineCustomers,
};
