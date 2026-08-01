const Partner = require('../models/Partner');
const User = require('../models/User');
const PartnerInvite = require('../models/PartnerInvite');
const { sendPartnerInviteEmail } = require('../services/emailService');
const { sendWhatsApp } = require('../services/whatsappService');

const INVITE_EXPIRY_HOURS = 72;

function buildInviteLink(token) {
  const base = process.env.CLIENT_URL || 'https://namdev-chiwada-mern.vercel.app';
  return `${base}/partner/set-password?token=${token}`;
}

// ──────────────────────────────────────────────────────
// POST /api/partners/:id/invite-link
// Returns the partner's current valid invite link, generating a fresh
// one if none exists yet or the existing one expired/was already used.
// This is the manual fallback for when email/WhatsApp delivery can't be
// relied on yet (e.g. Brevo sender/domain not verified) — the admin can
// copy this link and share it through any channel themselves.
// ──────────────────────────────────────────────────────
exports.getInviteLink = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    if (!partner.user) {
      return res.status(400).json({
        success: false,
        message: 'This partner has no linked login yet — add an email and save the partner first.',
      });
    }

    let invite = await PartnerInvite.findOne({
      user: partner.user,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!invite) {
      const token = PartnerInvite.generateToken();
      invite = await PartnerInvite.create({
        user: partner.user,
        token,
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000),
      });
    }

    const inviteLink = buildInviteLink(invite.token);

    // Best-effort resend — failures here don't matter, since the admin
    // already has the link back in the response either way.
    if (partner.email) {
      sendPartnerInviteEmail(partner.email, partner.businessName, inviteLink).catch(() => {});
    }
    if (partner.phone) {
      sendWhatsApp({
        to: partner.phone,
        body: `Hi ${partner.businessName}, here's your Namdev Chiwada partner account link: ${inviteLink}`,
      }).catch(() => {});
    }

    res.json({ success: true, inviteLink });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/partners
// List all partners (admin)
// ──────────────────────────────────────────────────────
exports.getPartners = async (req, res, next) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    res.json({ success: true, partners });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/partners/:id
// ──────────────────────────────────────────────────────
exports.getPartner = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    res.json({ success: true, partner });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/partners
// Creates the Partner profile AND a linked User account (role: 'partner',
// no password yet) AND a PartnerInvite, then emails/WhatsApps the
// set-password link. If email is missing, the invite record still exists —
// the admin can copy the link manually from the partner's detail view.
// ──────────────────────────────────────────────────────
exports.createPartner = async (req, res, next) => {
  try {
    const {
      businessName,
      type,
      contactPerson,
      phone,
      address,
      gstin,
      defaultAdvancePercent,
    } = req.body;
    // Normalize BEFORE the duplicate-check query below. The User schema
    // lowercases email only at save time, not at query time — if this
    // check queries the raw admin-typed value ("Sumzar12@Gmail.com") while
    // an existing account was stored lowercase ("sumzar12@gmail.com"), the
    // duplicate check misses it and a SECOND User document gets created
    // for what is really the same person. That second doc is what later
    // makes email/password login and Google login look like they're
    // fighting over the account: whichever doc a given lookup happens to
    // match first determines whether you see the partner's password/role
    // or the other doc's.
    const email = req.body.email ? req.body.email.trim().toLowerCase() : undefined;

    if (!businessName || !type) {
      return res.status(400).json({
        success: false,
        message: 'Business name and partner type are required',
      });
    }

    if (!['distributor', 'retailer', 'corporate'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be distributor, retailer, or corporate',
      });
    }

    let linkedUser = null;
    let inviteLink = null;

    // A login account is only created if an email was given — you can
    // still add a partner with just a phone number for now and invite
    // them later once you have their email, by editing the partner.
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists',
        });
      }

      linkedUser = await User.create({
        name: contactPerson || businessName,
        email,
        phone,
        role: 'partner',
        // No password set here — they choose their own via the invite link.
        isVerified: false,
      });
    }

    // IMPORTANT: only include `user` in this object when linkedUser exists.
    // Partner.js's sparse unique index on `user` only exempts documents
    // where the field is completely ABSENT — a document with an explicit
    // `user: null` still counts as "present" for a sparse index, so a
    // second phone-only partner (no email, no linkedUser) would collide
    // with the first one's `null` and fail with a duplicate-key error.
    // Omitting the key entirely keeps it truly unset, which is what the
    // sparse index is actually designed to allow.
    const partnerData = {
      businessName,
      type,
      contactPerson,
      phone,
      email,
      address,
      gstin,
      defaultAdvancePercent:
        defaultAdvancePercent !== undefined ? Number(defaultAdvancePercent) : 50,
    };
    if (linkedUser) {
      partnerData.user = linkedUser._id;
    }

    const partner = await Partner.create(partnerData);

    if (linkedUser) {
      const token = PartnerInvite.generateToken();
      await PartnerInvite.create({
        user: linkedUser._id,
        token,
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000),
      });
      inviteLink = buildInviteLink(token);

      // Fire-and-forget, same philosophy as order confirmation email:
      // a notification failure must never fail the partner-creation request.
      sendPartnerInviteEmail(email, businessName, inviteLink).catch(() => {});
      sendWhatsApp({
        to: phone,
        body: `Hi ${businessName}, you've been added as a partner with Namdev Chiwda. Set your password here: ${inviteLink}`,
      }).catch(() => {});
    }

    res.status(201).json({ success: true, partner, inviteLink });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// PUT /api/partners/:id
// ──────────────────────────────────────────────────────
exports.updatePartner = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const fields = [
      'businessName',
      'type',
      'contactPerson',
      'phone',
      'email',
      'address',
      'gstin',
      'defaultAdvancePercent',
      'active',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) partner[f] = req.body[f];
    });

    await partner.save();
    res.json({ success: true, partner });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// DELETE /api/partners/:id
// Soft-delete only — a partner with consignment history should never be
// hard-deleted, or every past Consignment/Payment loses its reference.
// ──────────────────────────────────────────────────────
exports.deletePartner = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    partner.active = false;
    await partner.save();
    res.json({ success: true, message: 'Partner deactivated' });
  } catch (err) {
    next(err);
  }
};