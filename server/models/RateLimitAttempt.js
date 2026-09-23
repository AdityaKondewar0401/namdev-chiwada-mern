// server/models/RateLimitAttempt.js
//
// Backs the per-ACCOUNT (not per-IP) exponential-backoff rate limiter in
// middleware/accountRateLimiter.js. One document per (purpose, identifier)
// pair, e.g. key = "login:aditya@example.com".
//
// Stored in Mongo rather than in-memory because:
//   - it must survive a process restart (Railway can restart the dyno)
//   - express-rate-limit's own IP limiter is intentionally separate and
//     in-memory — this collection is only for the account-keyed backoff,
//     a much smaller volume of writes (one per failed auth attempt).
//
// A TTL index auto-expires quiet records so this collection doesn't grow
// unbounded — see config/rateLimits.js `recordTtlSeconds`.

const mongoose = require('mongoose');
const { rateLimitConfig } = require('../config/rateLimits');

const rateLimitAttemptSchema = new mongoose.Schema({
  // `${purpose}:${normalizedIdentifier}`, e.g. "login:someone@example.com"
  key: { type: String, required: true, unique: true },
  attempts: { type: Number, default: 0 },
  firstAttemptAt: { type: Date, default: Date.now },
  lastAttemptAt: { type: Date, default: Date.now },
  // Earliest time the next attempt is allowed. Null/undefined = not
  // currently backed off (still within freeAttempts).
  nextAllowedAt: { type: Date, default: null },
});

// TTL cleanup — the expiry window itself is configurable via
// RATE_LIMIT_RECORD_TTL_SECONDS, but per MongoDB's TTL index semantics
// that value is fixed at index-creation time, not read live.
rateLimitAttemptSchema.index(
  { lastAttemptAt: 1 },
  { expireAfterSeconds: rateLimitConfig.recordTtlSeconds }
);

module.exports = mongoose.model('RateLimitAttempt', rateLimitAttemptSchema);
