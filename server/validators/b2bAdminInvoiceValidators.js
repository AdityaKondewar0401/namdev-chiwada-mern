// server/validators/b2bAdminInvoiceValidators.js

const { body, query } = require('express-validator');
const { mongoIdParam } = require('./common');

exports.orderIdParam = [mongoIdParam('id')];
exports.invoiceIdParam = [mongoIdParam('id')];
exports.creditNoteIdParam = [mongoIdParam('id')];

exports.listInvoicesQuery = [
  query('business').optional().isMongoId().withMessage('business must be a valid id'),
  query('from').optional().isISO8601().withMessage('from must be a valid date'),
  query('to').optional().isISO8601().withMessage('to must be a valid date'),
];

exports.createCreditNote = [
  body('reason').exists({ checkFalsy: true }).withMessage('A reason is required').bail()
    .isString().trim().isLength({ min: 3, max: 500 }),
];
