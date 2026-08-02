const Partner = require('../models/Partner');
const User = require('../models/User');

// ──────────────────────────────────────────────────────
// Self-heals a broken Partner <-> User link.
//
// A Partner document's `user` field can become orphaned — pointing at a
// User _id that no longer exists — if that User document is ever removed
// outside the app's own flow (e.g. deleted directly in the database).
// When that happens, the person can still authenticate (their email or
// Google account is unaffected), but they land back as a plain "user"
// instead of the partner they actually are, and the Partner document
// keeps pointing at a dead _id — so their consignments never show up,
// no matter which login method they use.
//
// This runs on EVERY successful login/register/Google-login, for every
// account. So if this ever happens again, to anyone, it repairs itself
// the next time that person logs in — nobody has to notice, diagnose it,
// or run a script.
//
// SECURITY — two guard rails that must never be relaxed:
//
// 1. Only ever promotes a plain `role: 'user'` account. It must NEVER run
//    for an account that is already 'admin' (or already 'partner') — if
//    it did, and that account's email ever happened to match some
//    unrelated broken Partner record, this would silently overwrite an
//    admin's role and strip their admin access.
//
// 2. Only reconnects when there is real evidence a verified link
//    previously existed and then vanished — i.e. `partner.user` holds an
//    ObjectId that no longer resolves to a User. It must NOT reconnect
//    when `partner.user` was simply never set. That "never linked" state
//    is the normal, expected condition for a partner who hasn't completed
//    their invite yet — auto-promoting whoever registers or Google-logs-in
//    with a matching email in that state would let anyone who merely
//    knows/guesses a partner's business email self-serve their way into
//    that partner's consignment and payment data, with no admin approval
//    at all. That path must always go through the existing, admin-gated
//    invite-link flow (createPartner / getInviteLink) instead.
// ──────────────────────────────────────────────────────
async function reconnectPartnerIfOrphaned(user) {
  if (user.role !== 'user') return user; // never touch admin or already-partner accounts

  const partner = await Partner.findOne({ email: user.email });
  if (!partner) return user; // this email isn't a partner's business email at all

  const alreadyLinkedToThisUser =
    partner.user && partner.user.toString() === user._id.toString();

  if (!alreadyLinkedToThisUser) {
    if (!partner.user) return user; // never had a verified link — requires the admin invite flow, not auto-claim

    const stillLinkedToADifferentRealAccount = await User.exists({ _id: partner.user });
    if (stillLinkedToADifferentRealAccount) return user; // already correctly linked elsewhere — don't touch

    // partner.user points at a deleted account — genuine orphan, safe to repair.
    partner.user = user._id;
    await partner.save();
  }

  // Runs even if partner.user already matched this user (covers a crash
  // that happened between the two saves on a previous attempt, so this
  // never gets permanently stuck half-linked).
  user.role = 'partner';
  user.isVerified = true;
  await user.save();

  return user;
}

module.exports = { reconnectPartnerIfOrphaned };
