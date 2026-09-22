// server/validators/b2bInvoiceValidators.js — business-facing invoices + ledger

const { query } = require('express-validator');
const { mongoIdParam } = require('./common');

exports.invoiceIdParam = [mongoIdParam('id')];
exports.creditNoteIdParam = [mongoIdParam('id')];

exports.ledgerQuery = [
  query('from').optional().isISO8601().withMessage('from must be a valid date'),
  query('to').optional().isISO8601().withMessage('to must be a valid date'),
];
