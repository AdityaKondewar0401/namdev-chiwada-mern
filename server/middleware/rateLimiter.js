// server/middleware/rateLimiter.js
//
// Per-IP rate limiters, tiered by sensitivity. Every threshold is pulled
// from config/rateLimits.js (which in turn reads .env) — nothing here is
// hardcoded. See middleware/accountRateLimiter.js for the complementary
// per-ACCOUNT exponential-backoff layer used on top of the `ipAuthLimiter`
// tier for login/register.

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { rateLimitConfig } = require('../config/rateLimits');

function buildLimiter({ windowMs, max, message, keyGenerator }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    message: { success: false, message },
  });
}

// ── Tier 1: STRICT — auth routes (login, register, google, and any
// future password-reset route). Per-IP. This is the brute-force/spam
// guard that runs before any account even exists in the request, so it
// can only ever key on IP.
exports.authLimiter = buildLimiter({
  windowMs: rateLimitConfig.ip.auth.windowMs,
  max: rateLimitConfig.ip.auth.max,
  message: 'Too many attempts from this network. Please try again in a few minutes.',
});

// ── Tier 2: MODERATE — public, unauthenticated read endpoints (product
// listing/search, pincode serviceability check).
exports.publicLimiter = buildLimiter({
  windowMs: rateLimitConfig.ip.public.windowMs,
  max: rateLimitConfig.ip.public.max,
  message: 'Too many requests. Please slow down and try again shortly.',
});

// ── Tier 3: LOOSE — authenticated user actions (cart, orders, wishlist,
// payment, admin actions). Keyed by user id when available (from
// `protect`, which must run before this middleware) so one logged-in
// user's activity never eats into another user's quota on a shared IP
// (offices, NAT, mobile carriers) — falls back to IP if req.user is
// somehow missing.
exports.userActionLimiter = buildLimiter({
  windowMs: rateLimitConfig.ip.userAction.windowMs,
  max: rateLimitConfig.ip.userAction.max,
  message: 'Too many requests. Please slow down and try again shortly.',
  // Keyed by user id when available (protect() must run first). Falls
  // back to IP via express-rate-limit's own ipKeyGenerator helper rather
  // than raw req.ip — a raw IPv6 address has multiple equivalent textual
  // forms (e.g. compressed vs expanded), so keying on it directly would
  // let a user bypass the limit just by requesting through a differently
  // -formatted equivalent address. express-rate-limit enforces this at
  // startup (throws ERR_ERL_KEY_GEN_IPV6 otherwise) — see
  // https://express-rate-limit.github.io/ERR_ERL_KEY_GEN_IPV6/
  keyGenerator: (req) => (req.user?._id ? String(req.user._id) : ipKeyGenerator(req.ip)),
});

// ── Separate tier: Shadowfax push-callback webhook. Public, but
// server-to-server traffic rather than a browser — kept independent so a
// legitimate burst of courier status pushes is never confused with (or
// throttled alongside) browser abuse.
exports.webhookLimiter = buildLimiter({
  windowMs: rateLimitConfig.ip.webhook.windowMs,
  max: rateLimitConfig.ip.webhook.max,
  message: 'Too many webhook requests from this source.',
});
