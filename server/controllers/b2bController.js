// server/controllers/b2bController.js
//
// Business-facing B2B endpoints (Phase 2): config, own account lookup,
// apply, and self-service profile updates. Mounted at /api/b2b.

const BusinessAccount = require('../models/BusinessAccount');
const { businessConfig } = require('../config/business');
const { getAllowedStateCodes, getAllowedStateNames } = require('../utils/b2bRegion');
const { supplierTaxNote } = require('../utils/taxMode');
const { getCreditSummary } = require('../utils/b2bCredit');
const { sendB2BApplicationReceived } = require('../services/emailService');

// ──────────────────────────────────────────────────────
// GET /api/b2b/config
// ──────────────────────────────────────────────────────
exports.getConfig = async (req, res, next) => {
  try {
    res.json({
      success: true,
      config: {
        enabled: businessConfig.enabled,
        allowedStateCodes: getAllowedStateCodes(),
        allowedStateNames: getAllowedStateNames(),
        minOrderValue: businessConfig.minOrderValue,
        taxNote: supplierTaxNote(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/b2b/me
// Returns `business: null` (not 404) when the user has no application —
// the frontend uses this to decide whether to show the apply form.
// ──────────────────────────────────────────────────────
exports.getMyBusiness = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findOne({ user: req.user._id });

    if (!business) {
      return res.json({ success: true, business: null });
    }

    let creditSummary = null;
    if (business.status === 'approved') {
      creditSummary = await getCreditSummary(business._id);
    }

    res.json({ success: true, business, creditSummary });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/apply
// A rejected applicant may re-apply (resets to pending). Anyone with an
// existing pending/approved/suspended account gets 409 — the frontend
// should normally never even show the form in that state (it checks
// GET /me first), so this is mainly a race-condition safety net (e.g.
// two open tabs).
// ──────────────────────────────────────────────────────
exports.applyForBusiness = async (req, res, next) => {
  try {
    const existing = await BusinessAccount.findOne({ user: req.user._id });

    if (existing && existing.status !== 'rejected') {
      return res.status(409).json({
        success: false,
        message: 'You already have a business account.',
        status: existing.status,
      });
    }

    const {
      businessName, legalName, businessType, gstin, fssaiLicenseNo,
      contactName, phone, email, billingAddress,
    } = req.body;

    let business;

    if (existing) {
      existing.businessName = businessName;
      existing.legalName = legalName;
      existing.businessType = businessType;
      // gstin is unique+sparse — assign only when truthy, otherwise
      // unset it, so a gstin-less account never stores an explicit
      // null (see the schema comment in models/BusinessAccount.js).
      existing.gstin = gstin || undefined;
      existing.fssaiLicenseNo = fssaiLicenseNo;
      existing.contactName = contactName;
      existing.phone = phone;
      existing.email = email;
      existing.billingAddress = billingAddress;
      existing.status = 'pending';
      existing.rejectionReason = undefined;
      existing.statusHistory.push({ status: 'pending', by: req.user._id, note: 'Re-applied after rejection' });
      business = await existing.save();
    } else {
      const payload = {
        user: req.user._id,
        businessName, legalName, businessType,
        fssaiLicenseNo, contactName, phone, email, billingAddress,
        status: 'pending',
        statusHistory: [{ status: 'pending', by: req.user._id, note: 'Application submitted' }],
      };
      if (gstin) payload.gstin = gstin;
      business = await BusinessAccount.create(payload);
    }

    try {
      await sendB2BApplicationReceived(business, req.user);
    } catch (emailErr) {
      console.error('B2B application-received email failed to send:', emailErr.message);
    }

    res.status(existing ? 200 : 201).json({ success: true, business });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// PUT /api/b2b/me  (requires loadBusiness)
// Contact details + shipping addresses are always editable. businessName,
// gstin, and billingAddress are locked once the application leaves
// `pending` — changing those afterwards goes through admin instead.
// ──────────────────────────────────────────────────────
exports.updateMyBusiness = async (req, res, next) => {
  try {
    const business = req.business;
    const {
      businessName, gstin, billingAddress,
      contactName, phone, email, fssaiLicenseNo, legalName,
      shippingAddresses,
    } = req.body;

    const lockedFieldsSent = businessName !== undefined || gstin !== undefined || billingAddress !== undefined;
    if (lockedFieldsSent && business.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Business name, GSTIN, and billing address can only be changed while your application is pending. Contact us to update these.',
      });
    }

    if (business.status === 'pending') {
      if (businessName !== undefined) business.businessName = businessName;
      // Same unique+sparse concern as applyForBusiness — never assign null.
      if (gstin !== undefined) business.gstin = gstin || undefined;
      if (billingAddress !== undefined) business.billingAddress = billingAddress;
    }

    if (legalName !== undefined) business.legalName = legalName;
    if (fssaiLicenseNo !== undefined) business.fssaiLicenseNo = fssaiLicenseNo;
    if (contactName !== undefined) business.contactName = contactName;
    if (phone !== undefined) business.phone = phone;
    if (email !== undefined) business.email = email;
    if (shippingAddresses !== undefined) business.shippingAddresses = shippingAddresses;

    await business.save();

    res.json({ success: true, business });
  } catch (err) {
    next(err);
  }
};
