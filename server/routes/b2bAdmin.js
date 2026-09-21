const express = require('express');
const router = express.Router();

const b2bAdminController = require('../controllers/b2bAdminController');
const { protect, admin } = require('../middleware/auth');
const { userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const v = require('../validators/b2bAdminValidators');

// Every route in this router is admin-only.
router.use(protect, userActionLimiter, admin);

/* =========================================
   BUSINESS ACCOUNTS
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
   PRICE TIERS
========================================= */
router.get('/tiers', b2bAdminController.listTiers);
router.post('/tiers', v.createTier, validate, b2bAdminController.createTier);
router.put('/tiers/:id', [...v.tierIdParam, ...v.updateTier], validate, b2bAdminController.updateTier);
router.delete('/tiers/:id', v.tierIdParam, validate, b2bAdminController.deleteTier);

module.exports = router;
