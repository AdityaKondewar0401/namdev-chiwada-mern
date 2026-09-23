const express = require('express');
const router = express.Router();

const b2bAdminController = require('../controllers/b2bAdminController');
const b2bAdminCatalogController = require('../controllers/b2bAdminCatalogController');
const b2bAdminOrderController = require('../controllers/b2bAdminOrderController');
const b2bShippingController = require('../controllers/b2bShippingController');
const b2bAdminInvoiceController = require('../controllers/b2bAdminInvoiceController');
const b2bAdminLedgerController = require('../controllers/b2bAdminLedgerController');
const b2bAdminSummaryController = require('../controllers/b2bAdminSummaryController');
const { protect, admin } = require('../middleware/auth');
const { userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const v = require('../validators/b2bAdminValidators');
const vCatalog = require('../validators/b2bAdminCatalogValidators');
const vOrder = require('../validators/b2bAdminOrderValidators');
const vInvoice = require('../validators/b2bAdminInvoiceValidators');
const vLedger = require('../validators/b2bAdminLedgerValidators');

// Every route in this router is admin-only, and NOT gated by
// B2B_ENABLED — admins must be able to set everything up (tiers,
// catalog, a test account) before flipping the switch on.
router.use(protect, userActionLimiter, admin);

/* =========================================
   BUSINESS ACCOUNTS (Phase 2)
========================================= */
router.get('/accounts', v.listAccountsQuery, validate, b2bAdminController.listAccounts);
router.post('/accounts', v.createAccount, validate, b2bAdminController.createAccountForUser);
router.get('/accounts/:id', v.accountIdParam, validate, b2bAdminController.getAccountDetail);
router.put('/accounts/:id', [...v.accountIdParam, ...v.updateAccount], validate, b2bAdminController.updateAccount);
router.post('/accounts/:id/approve', [...v.accountIdParam, ...v.approveAccount], validate, b2bAdminController.approveAccount);
router.post('/accounts/:id/reject', [...v.accountIdParam, ...v.rejectAccount], validate, b2bAdminController.rejectAccount);
router.post('/accounts/:id/suspend', [...v.accountIdParam, ...v.suspendAccount], validate, b2bAdminController.suspendAccount);
router.post('/accounts/:id/reactivate', [...v.accountIdParam, ...v.reactivateAccount], validate, b2bAdminController.reactivateAccount);

/* =========================================
   PRICE TIERS (Phase 2)
========================================= */
router.get('/tiers', b2bAdminController.listTiers);
router.post('/tiers', v.createTier, validate, b2bAdminController.createTier);
router.put('/tiers/:id', [...v.tierIdParam, ...v.updateTier], validate, b2bAdminController.updateTier);
router.delete('/tiers/:id', v.tierIdParam, validate, b2bAdminController.deleteTier);

/* =========================================
   CATALOG ITEMS (Phase 3)
========================================= */
router.get('/catalog', b2bAdminCatalogController.listCatalogItems);
router.post('/catalog', vCatalog.createCatalogItem, validate, b2bAdminCatalogController.createCatalogItem);
router.put('/catalog/:id', [...vCatalog.catalogItemIdParam, ...vCatalog.updateCatalogItem], validate, b2bAdminCatalogController.updateCatalogItem);
router.delete('/catalog/:id', vCatalog.catalogItemIdParam, validate, b2bAdminCatalogController.deleteCatalogItem);

/* =========================================
   ORDERS (Phase 3)
========================================= */
router.get('/orders', vOrder.listOrdersQuery, validate, b2bAdminOrderController.listOrders);
router.get('/orders/:id', vOrder.orderIdParam, validate, b2bAdminOrderController.getOrderDetail);
router.put('/orders/:id/items', [...vOrder.orderIdParam, ...vOrder.updateOrderItems], validate, b2bAdminOrderController.updateOrderItems);
router.post('/orders/:id/status', [...vOrder.orderIdParam, ...vOrder.updateOrderStatus], validate, b2bAdminOrderController.updateOrderStatus);
router.post('/orders/:id/override-credit-hold', [...vOrder.orderIdParam, ...vOrder.overrideCreditHold], validate, b2bAdminOrderController.overrideCreditHold);
router.post('/orders/:id/invoice', vInvoice.orderIdParam, validate, b2bAdminOrderController.issueInvoice);
router.post('/orders/:id/create-shipment', vOrder.orderIdParam, validate, b2bShippingController.createB2BShipment);
router.post('/orders/:id/cancel-shipment', [...vOrder.orderIdParam, ...vOrder.cancelShipment], validate, b2bShippingController.cancelB2BShipment);

/* =========================================
   INVOICES + CREDIT NOTES (Phase 4)
========================================= */
router.get('/invoices', vInvoice.listInvoicesQuery, validate, b2bAdminInvoiceController.listInvoices);
router.get('/invoices/:id/pdf', vInvoice.invoiceIdParam, validate, b2bAdminInvoiceController.downloadInvoicePdf);
router.post('/invoices/:id/credit-note', [...vInvoice.invoiceIdParam, ...vInvoice.createCreditNote], validate, b2bAdminInvoiceController.createCreditNote);
router.get('/credit-notes/:id/pdf', vInvoice.creditNoteIdParam, validate, b2bAdminInvoiceController.downloadCreditNotePdf);

/* =========================================
   LEDGER (Phase 4)
========================================= */
router.get('/accounts/:id/ledger', [...vLedger.accountIdParam, ...vLedger.ledgerQuery], validate, b2bAdminLedgerController.getAccountLedger);
router.get('/accounts/:id/ledger/export.csv', [...vLedger.accountIdParam, ...vLedger.ledgerQuery], validate, b2bAdminLedgerController.exportAccountLedgerCsv);
router.post('/accounts/:id/payments', [...vLedger.accountIdParam, ...vLedger.recordPayment], validate, b2bAdminLedgerController.recordPayment);
router.post('/accounts/:id/adjustments', [...vLedger.accountIdParam, ...vLedger.recordAdjustment], validate, b2bAdminLedgerController.recordAdjustment);
router.post('/accounts/:id/opening-balance', [...vLedger.accountIdParam, ...vLedger.recordOpeningBalance], validate, b2bAdminLedgerController.recordOpeningBalance);

/* =========================================
   SUMMARY (Phase 4)
========================================= */
router.get('/summary', b2bAdminSummaryController.getSummary);

module.exports = router;
