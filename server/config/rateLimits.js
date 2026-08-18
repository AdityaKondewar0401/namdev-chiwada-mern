// server/config/rateLimits.js
//
// Single source of truth for every rate-limit threshold in the app.
// Nothing here is hardcoded into the limiter middleware itself — every
// number below is read from `.env` with a sane fallback, so ops can
// retune limits (e.g. loosen public limits after a traffic spike, or
// tighten auth limits after an incident) without touching code or
// redeploying application logic.
//
// Three tiers, per the brief:
//   1. ip.auth        — strict, per-IP, on login/signup/password-reset
//   2. ip.public       — moderate, per-IP, on public read endpoints
//   3. ip.userAction    — loose, per-user (falls back to per-IP), on
//                        authenticated actions (cart, orders, wishlist...)
// Plus a fourth, orthogonal mechanism:
//   4. account.*        — per-ACCOUNT (keyed by email, not IP) exponential
//                        backoff for auth routes, stacked on top of (1).
//                        This is what stops a distributed/rotating-IP
//                        attacker from brute-forcing one specific account
//                        even though no single IP ever trips the IP limit.

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const rateLimitConfig = {
  // ── Tier 1: per-IP, auth routes (register/login/google/change-password/
  // password-reset-when-added). Deliberately strict — these are the
  // routes attackers hit to guess credentials or spam account creation.
  ip: {
    auth: {
      windowMs: envInt('RATE_LIMIT_IP_AUTH_WINDOW_MS', 15 * 60 * 1000), // 15 min
      max: envInt('RATE_LIMIT_IP_AUTH_MAX', 20),
    },

    // ── Tier 2: per-IP, public/unauthenticated read endpoints (product
    // listing/search, pincode serviceability check). Generous enough for
    // normal browsing, still blocks scraping/abuse bursts.
    public: {
      windowMs: envInt('RATE_LIMIT_IP_PUBLIC_WINDOW_MS', 60 * 1000), // 1 min
      max: envInt('RATE_LIMIT_IP_PUBLIC_MAX', 100),
    },

    // ── Tier 3: per authenticated user (falls back to per-IP if req.user
    // is somehow missing), for logged-in actions — cart, orders, wishlist,
    // payment, admin actions. Loosest tier since these users already
    // proved identity via JWT.
    userAction: {
      windowMs: envInt('RATE_LIMIT_IP_USER_WINDOW_MS', 60 * 1000), // 1 min
      max: envInt('RATE_LIMIT_IP_USER_MAX', 180),
    },

    // Shadowfax push-callback webhook — public but server-to-server, not
    // browser traffic. Separate tier so a legitimate burst of courier
    // status updates is never confused with browser abuse.
    webhook: {
      windowMs: envInt('RATE_LIMIT_IP_WEBHOOK_WINDOW_MS', 60 * 1000), // 1 min
      max: envInt('RATE_LIMIT_IP_WEBHOOK_MAX', 120),
    },
  },

  // ── Per-account exponential backoff. Keyed by normalized email, not
  // IP — stacks on top of the IP limiter above rather than replacing it.
  // `freeAttempts` failures are allowed at normal speed; every failure
  // after that doubles the required wait, capped at `maxDelayMs`. A
  // single SUCCESS resets the counter to zero. This is a soft, growing
  // delay rather than a hard lockout, so a real account owner who
  // mistypes a password a few times is never permanently locked out —
  // they just wait longer between retries the more attempts fail.
  account: {
    login: {
      freeAttempts: envInt('RATE_LIMIT_LOGIN_FREE_ATTEMPTS', 5),
      baseDelayMs: envInt('RATE_LIMIT_LOGIN_BASE_DELAY_MS', 2 * 1000), // 2s
      maxDelayMs: envInt('RATE_LIMIT_LOGIN_MAX_DELAY_MS', 15 * 60 * 1000), // 15 min
    },
    register: {
      freeAttempts: envInt('RATE_LIMIT_REGISTER_FREE_ATTEMPTS', 5),
      baseDelayMs: envInt('RATE_LIMIT_REGISTER_BASE_DELAY_MS', 5 * 1000), // 5s
      maxDelayMs: envInt('RATE_LIMIT_REGISTER_MAX_DELAY_MS', 30 * 60 * 1000), // 30 min
    },
    // Not wired to a live route yet (no password-reset endpoint exists in
    // this codebase today) — config is ready so wiring one up later is a
    // one-line addition, not a redesign.
    passwordReset: {
      freeAttempts: envInt('RATE_LIMIT_PW_RESET_FREE_ATTEMPTS', 3),
      baseDelayMs: envInt('RATE_LIMIT_PW_RESET_BASE_DELAY_MS', 5 * 1000), // 5s
      maxDelayMs: envInt('RATE_LIMIT_PW_RESET_MAX_DELAY_MS', 30 * 60 * 1000), // 30 min
    },
  },

  // How long a quiet (no new attempts) account-limit record survives
  // before MongoDB's TTL index reaps it. Keeps the collection from
  // growing forever. NOTE: since MongoDB TTL indexes bake the expiry
  // seconds into the index itself, changing this value requires dropping
  // and recreating the index (or just letting a migration handle it) —
  // it will NOT silently re-apply to an already-created index.
  recordTtlSeconds: envInt('RATE_LIMIT_RECORD_TTL_SECONDS', 24 * 60 * 60), // 24h
};

module.exports = { rateLimitConfig };
