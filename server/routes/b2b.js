const express = require('express');
const router = express.Router();

const b2bController = require('../controllers/b2bController');
const { protect } = require('../middleware/auth');
const { loadBusiness } = require('../middleware/business');
const { publicLimiter, userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const b2bValidators = require('../validators/b2bValidators');

// Deliberately public (no `protect`) — deviation from the spec's §7.1
// guard column, which lists "protect" for this route. The route itself
// says "(no secrets)": just allowed delivery states + min order value.
// The public, unauthenticated /business landing page and
// /business/apply must show real delivery-region text sourced from this
// endpoint rather than hardcoding it (spec §8.3) — that's impossible
// for a logged-out visitor if this stays behind protect. Tier 2 public
// rate limit, per §3's own convention ("publicLimiter for any public read").
router.get('/config', publicLimiter, b2bController.getConfig);

// Every route below requires a valid JWT — Tier 3 (loose, per-user).
router.use(protect, userActionLimiter);

router.get('/me', b2bController.getMyBusiness);
router.post('/apply', b2bValidators.applyForBusiness, validate, b2bController.applyForBusiness);
router.put('/me', loadBusiness, b2bValidators.updateMyBusiness, validate, b2bController.updateMyBusiness);

module.exports = router;
