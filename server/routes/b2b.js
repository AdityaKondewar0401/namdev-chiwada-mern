const express = require('express');
const router = express.Router();

const b2bController = require('../controllers/b2bController');
const b2bCatalogController = require('../controllers/b2bCatalogController');
const b2bOrderController = require('../controllers/b2bOrderController');
const b2bInvoiceController = require('../controllers/b2bInvoiceController');
const { protect } = require('../middleware/auth');
const { loadBusiness, requireApprovedBusiness, requireB2BEnabled } = require('../middleware/business');
const { publicLimiter, userActionLimiter, b2bQuoteLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const b2bValidators = require('../validators/b2bValidators');
const b2bOrderValidators = require('../validators/b2bOrderValidators');
const b2bInvoiceValidators = require('../validators/b2bInvoiceValidators');

// Deliberately public (no `protect`) — deviation from the spec's §7.1
// guard column, which lists "protect" for this route. The route itself
// says "(no secrets)": just allowed delivery states + min order value +
// the enabled flag itself. The public, unauthenticated /business landing
// page and /business/apply must show real delivery-region text sourced
// from this endpoint rather than hardcoding it (spec §8.3) — that's
// impossible for a logged-out visitor if this stays behind protect.
// Tier 2 public rate limit, per §3's own convention.
router.get('/config', publicLimiter, b2bController.getConfig);

// Every route below requires a valid JWT — Tier 3 (loose, per-user) —
// and, except where admin (checked inside requireB2BEnabled), the
// feature switch to be on.
router.use(protect, userActionLimiter, requireB2BEnabled);

/* =========================================
   ACCOUNT (Phase 2)
========================================= */
router.get('/me', b2bController.getMyBusiness);
router.post('/apply', b2bValidators.applyForBusiness, validate, b2bController.applyForBusiness);
router.put('/me', loadBusiness, b2bValidators.updateMyBusiness, validate, b2bController.updateMyBusiness);

/* =========================================
   CATALOG (Phase 3 — approved only)
========================================= */
router.get('/catalog', loadBusiness, requireApprovedBusiness, b2bCatalogController.getCatalog);

/* =========================================
   ORDERS (Phase 3)
========================================= */
router.post(
  '/orders/quote',
  loadBusiness, requireApprovedBusiness, b2bQuoteLimiter,
  b2bOrderValidators.quoteOrder, validate,
  b2bOrderController.quoteOrder
);
router.post(
  '/orders',
  loadBusiness, requireApprovedBusiness,
  b2bOrderValidators.placeOrder, validate,
  b2bOrderController.placeOrder
);
router.get(
  '/orders',
  loadBusiness,
  b2bOrderValidators.listMyOrdersQuery, validate,
  b2bOrderController.getMyOrders
);
router.get(
  '/orders/:id',
  loadBusiness,
  b2bOrderValidators.orderIdParam, validate,
  b2bOrderController.getMyOrder
);
router.post(
  '/orders/:id/cancel',
  loadBusiness,
  [...b2bOrderValidators.orderIdParam, ...b2bOrderValidators.cancelOrder], validate,
  b2bOrderController.cancelMyOrder
);

/* =========================================
   INVOICES + CREDIT NOTES (Phase 4)
========================================= */
router.get('/invoices', loadBusiness, b2bInvoiceController.getMyInvoices);
router.get('/invoices/:id', loadBusiness, b2bInvoiceValidators.invoiceIdParam, validate, b2bInvoiceController.getMyInvoice);
router.get('/invoices/:id/pdf', loadBusiness, b2bInvoiceValidators.invoiceIdParam, validate, b2bInvoiceController.downloadMyInvoicePdf);
router.get('/credit-notes/:id/pdf', loadBusiness, b2bInvoiceValidators.creditNoteIdParam, validate, b2bInvoiceController.downloadMyCreditNotePdf);

/* =========================================
   LEDGER (Phase 4)
========================================= */
router.get('/ledger', loadBusiness, b2bInvoiceValidators.ledgerQuery, validate, b2bInvoiceController.getMyLedger);
router.get('/ledger/export.csv', loadBusiness, b2bInvoiceValidators.ledgerQuery, validate, b2bInvoiceController.exportMyLedgerCsv);

module.exports = router;
