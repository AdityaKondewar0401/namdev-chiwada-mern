// server/middleware/accountRateLimiter.js
//
// Per-ACCOUNT exponential backoff for auth routes, stacked on top of the
// per-IP limiters in middleware/rateLimiter.js. This is what stops a
// distributed or IP-rotating attacker from brute-forcing one specific
// account even when no single IP ever trips the IP-based limit.
//
// Design: a soft, growing delay rather than a hard lockout.
//   - The first `freeAttempts` failures are allowed at normal speed —
//     a real user who fat-fingers their password a couple of times never
//     notices this exists.
//   - Every failure after that doubles the required wait
//     (baseDelayMs * 2^(attempts - freeAttempts)), capped at maxDelayMs.
//   - A single SUCCESS resets the account back to zero.
//   - There is no permanent lockout state and no admin unlock needed —
//     the delay always eventually expires on its own.
//
// Usage in a route:
//   router.post('/login', ipAuthLimiter, accountLimiter('login'), login);
// Usage in the controller:
//   on failure: await recordFailure(req);
//   on success: await recordSuccess(req);

const RateLimitAttempt = require('../models/RateLimitAttempt');
const { rateLimitConfig } = require('../config/rateLimits');

function backoffDelayMs(attempts, cfg) {
  const overage = Math.max(0, attempts - cfg.freeAttempts);
  const delay = cfg.baseDelayMs * Math.pow(2, overage);
  return Math.min(delay, cfg.maxDelayMs);
}

// Which field in req.body identifies the account for a given purpose.
// Every current auth route identifies by email; this map exists so a
// future purpose (e.g. a phone-based reset flow) can plug in cleanly.
const IDENTIFIER_FIELD = {
  login: 'email',
  register: 'email',
  passwordReset: 'email',
};

/**
 * Express middleware factory. Blocks the request with 429 if this
 * account is currently in its backoff window; otherwise lets it through
 * and stashes the lookup key on `req` for recordFailure/recordSuccess to
 * use later in the same request.
 */
function accountLimiter(purpose) {
  const cfg = rateLimitConfig.account[purpose];
  const field = IDENTIFIER_FIELD[purpose] || 'email';

  if (!cfg) {
    throw new Error(`accountLimiter: unknown purpose "${purpose}"`);
  }

  return async function (req, res, next) {
    try {
      const raw = req.body?.[field];
      const identifier = typeof raw === 'string' ? raw.trim().toLowerCase() : '';

      // No identifier yet — let normal request validation in the
      // controller handle the missing-field case; nothing to key on here.
      if (!identifier) return next();

      const key = `${purpose}:${identifier}`;
      req.accountRateLimitKey = key;

      const record = await RateLimitAttempt.findOne({ key });
      if (record?.nextAllowedAt && record.nextAllowedAt.getTime() > Date.now()) {
        const retryAfterSeconds = Math.ceil((record.nextAllowedAt.getTime() - Date.now()) / 1000);
        res.set('Retry-After', String(retryAfterSeconds));
        return res.status(429).json({
          success: false,
          message: `Too many attempts for this account. Please try again in ${retryAfterSeconds}s.`,
          retryAfterSeconds,
        });
      }

      next();
    } catch (err) {
      // Fail OPEN: a bug or DB hiccup in the rate limiter must never be
      // able to lock every user out of login. Log it and let the request
      // proceed — the per-IP limiter still applies as a backstop.
      console.error(`accountLimiter(${purpose}) check failed:`, err.message);
      next();
    }
  };
}

/**
 * Call from a controller after a failed auth attempt (wrong password,
 * duplicate-email registration probe, etc.) for the account checked by
 * accountLimiter() earlier in this same request.
 */
async function recordFailure(req) {
  const key = req.accountRateLimitKey;
  if (!key) return;

  const purpose = key.slice(0, key.indexOf(':'));
  const cfg = rateLimitConfig.account[purpose];
  if (!cfg) return;

  try {
    const now = new Date();
    const record = await RateLimitAttempt.findOneAndUpdate(
      { key },
      { $setOnInsert: { firstAttemptAt: now } },
      { upsert: true, new: true }
    );

    record.attempts += 1;
    record.lastAttemptAt = now;

    if (record.attempts > cfg.freeAttempts) {
      const delayMs = backoffDelayMs(record.attempts, cfg);
      record.nextAllowedAt = new Date(now.getTime() + delayMs);
    }

    await record.save();
  } catch (err) {
    console.error('accountRateLimiter.recordFailure failed:', err.message);
  }
}

/**
 * Call from a controller after a SUCCESSFUL auth attempt for the account
 * checked earlier in this same request — clears its backoff entirely.
 */
async function recordSuccess(req) {
  const key = req.accountRateLimitKey;
  if (!key) return;

  try {
    await RateLimitAttempt.deleteOne({ key });
  } catch (err) {
    console.error('accountRateLimiter.recordSuccess failed:', err.message);
  }
}

module.exports = { accountLimiter, recordFailure, recordSuccess };
