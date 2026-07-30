// server/routes/partners.js
const express = require('express');
const router = express.Router();
const {
  getPartners,
  getPartner,
  createPartner,
  updatePartner,
  deletePartner,
  getInviteLink,
} = require('../controllers/partnerController');
const { protect, admin } = require('../middleware/auth');

/*
  ROUTE STRUCTURE (all admin-only in Phase 1):
  GET    /api/partners             → list all partners
  POST   /api/partners              → create partner
  POST   /api/partners/:id/invite-link → get/regenerate this partner's invite link
  GET    /api/partners/:id          → single partner
  PUT    /api/partners/:id          → update partner
  DELETE /api/partners/:id          → deactivate partner (soft delete)
*/

router.use(protect, admin);

router.get('/', getPartners);
router.post('/', createPartner);
router.post('/:id/invite-link', getInviteLink);
router.get('/:id', getPartner);
router.put('/:id', updatePartner);
router.delete('/:id', deletePartner);

module.exports = router;
