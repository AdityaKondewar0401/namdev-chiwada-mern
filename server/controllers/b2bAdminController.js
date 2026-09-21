// server/controllers/b2bAdminController.js
//
// Admin-facing B2B endpoints (Phase 2): account lifecycle + price tier
// CRUD. Mounted at /api/b2b/admin (protect + admin already applied by
// the router).

const User = require('../models/User');
const BusinessAccount = require('../models/BusinessAccount');
const PriceTier = require('../models/PriceTier');
const B2BOrder = require('../models/B2BOrder');
const { getCreditSummary } = require('../utils/b2bCredit');
const { enforceSingleDefaultTier, isTierInUse } = require('../utils/b2bTiers');
const {
  sendB2BApplicationApproved,
  sendB2BApplicationRejected,
  sendB2BAccountSuspended,
} = require('../services/emailService');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ──────────────────────────────────────────────────────
// GET /api/b2b/admin/accounts?status&search&page&limit
// ──────────────────────────────────────────────────────
exports.listAccounts = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const re = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ businessName: re }, { contactName: re }, { email: re }, { phone: re }];
    }

    const [accounts, total] = await Promise.all([
      BusinessAccount.find(filter)
        .populate('user', 'name email')
        .populate('tier', 'name code')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      BusinessAccount.countDocuments(filter),
    ]);

    res.json({ success: true, accounts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/b2b/admin/accounts/:id
// ──────────────────────────────────────────────────────
exports.getAccountDetail = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('tier', 'name code discountPercent');

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business account not found' });
    }

    const [creditSummary, recentOrders] = await Promise.all([
      business.status === 'approved' ? getCreditSummary(business._id) : null,
      B2BOrder.find({ business: business._id }).sort('-createdAt').limit(5),
    ]);

    res.json({ success: true, business, creditSummary, recentOrders });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/admin/accounts
// Create an account directly for an existing user, pre-approved.
// 404 if no such user; 409 (with the existing account's summary) if
// that user already has a business account.
// ──────────────────────────────────────────────────────
exports.createAccountForUser = async (req, res, next) => {
  try {
    const { email, businessName, businessType, gstin, tier, paymentTerms, creditLimit } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email.',
      });
    }

    const existing = await BusinessAccount.findOne({ user: user._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This user already has a business account.',
        accountId: existing._id,
        businessName: existing.businessName,
        status: existing.status,
      });
    }

    const payload = {
      user: user._id,
      businessName,
      businessType,
      status: 'approved',
      tier: tier || undefined,
      paymentTerms: paymentTerms || 'prepaid',
      creditLimit: creditLimit || 0,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      statusHistory: [{ status: 'approved', by: req.user._id, note: 'Created directly by admin' }],
    };
    // gstin is unique+sparse — omit the key entirely rather than storing
    // an explicit null (see the schema comment in models/BusinessAccount.js).
    if (gstin) payload.gstin = gstin;

    const business = await BusinessAccount.create(payload);

    try {
      await sendB2BApplicationApproved(business, user);
    } catch (emailErr) {
      console.error('B2B approval email failed to send:', emailErr.message);
    }

    res.status(201).json({ success: true, business });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// PUT /api/b2b/admin/accounts/:id
// ──────────────────────────────────────────────────────
exports.updateAccount = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business account not found' });
    }

    const fields = [
      'businessName', 'legalName', 'businessType', 'gstin', 'fssaiLicenseNo',
      'contactName', 'phone', 'email', 'tier', 'paymentTerms', 'creditLimit', 'adminNotes',
    ];
    for (const field of fields) {
      if (req.body[field] === undefined) continue;
      // gstin is unique+sparse — unset (undefined) rather than null.
      business[field] = field === 'gstin' ? (req.body[field] || undefined) : req.body[field];
    }

    await business.save();
    res.json({ success: true, business });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/admin/accounts/:id/approve
// ──────────────────────────────────────────────────────
exports.approveAccount = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findById(req.params.id).populate('user', 'name email');
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business account not found' });
    }
    if (business.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be approved.' });
    }

    const { tier, paymentTerms, creditLimit, note } = req.body;

    const tierDoc = await PriceTier.findById(tier);
    if (!tierDoc || !tierDoc.active) {
      return res.status(400).json({ success: false, message: 'Selected tier does not exist or is inactive.' });
    }

    business.status = 'approved';
    business.tier = tier;
    business.paymentTerms = paymentTerms;
    business.creditLimit = creditLimit || 0;
    business.approvedBy = req.user._id;
    business.approvedAt = new Date();
    business.statusHistory.push({ status: 'approved', by: req.user._id, note });
    await business.save();

    try {
      await sendB2BApplicationApproved(business, business.user);
    } catch (emailErr) {
      console.error('B2B approval email failed to send:', emailErr.message);
    }

    res.json({ success: true, business });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/admin/accounts/:id/reject
// ──────────────────────────────────────────────────────
exports.rejectAccount = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findById(req.params.id).populate('user', 'name email');
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business account not found' });
    }
    if (business.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be rejected.' });
    }

    const { reason } = req.body;
    business.status = 'rejected';
    business.rejectionReason = reason;
    business.statusHistory.push({ status: 'rejected', by: req.user._id, note: reason });
    await business.save();

    try {
      await sendB2BApplicationRejected(business, business.user);
    } catch (emailErr) {
      console.error('B2B rejection email failed to send:', emailErr.message);
    }

    res.json({ success: true, business });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/admin/accounts/:id/suspend
// ──────────────────────────────────────────────────────
exports.suspendAccount = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findById(req.params.id).populate('user', 'name email');
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business account not found' });
    }
    if (business.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved accounts can be suspended.' });
    }

    const { note } = req.body;
    business.status = 'suspended';
    business.statusHistory.push({ status: 'suspended', by: req.user._id, note });
    await business.save();

    try {
      await sendB2BAccountSuspended(business, business.user);
    } catch (emailErr) {
      console.error('B2B suspension email failed to send:', emailErr.message);
    }

    res.json({ success: true, business });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/b2b/admin/accounts/:id/reactivate
// No email — reactivation isn't in the spec's notification table.
// ──────────────────────────────────────────────────────
exports.reactivateAccount = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business account not found' });
    }
    if (business.status !== 'suspended') {
      return res.status(400).json({ success: false, message: 'Only suspended accounts can be reactivated.' });
    }

    const { note } = req.body;
    business.status = 'approved';
    business.statusHistory.push({ status: 'approved', by: req.user._id, note: note || 'Reactivated' });
    await business.save();

    res.json({ success: true, business });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// PRICE TIERS
// ──────────────────────────────────────────────────────
exports.listTiers = async (req, res, next) => {
  try {
    const tiers = await PriceTier.find().sort('discountPercent');
    res.json({ success: true, tiers });
  } catch (err) {
    next(err);
  }
};

exports.createTier = async (req, res, next) => {
  try {
    const { name, code, description, discountPercent, isDefault, active } = req.body;

    const tier = await PriceTier.create({
      name, code, description, discountPercent,
      isDefault: Boolean(isDefault),
      active: active === undefined ? true : Boolean(active),
    });

    if (tier.isDefault) {
      await enforceSingleDefaultTier(tier._id);
    }

    res.status(201).json({ success: true, tier });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A tier with this code already exists.' });
    }
    next(err);
  }
};

exports.updateTier = async (req, res, next) => {
  try {
    const tier = await PriceTier.findById(req.params.id);
    if (!tier) {
      return res.status(404).json({ success: false, message: 'Price tier not found' });
    }

    const fields = ['name', 'code', 'description', 'discountPercent', 'isDefault', 'active'];
    for (const field of fields) {
      if (req.body[field] !== undefined) tier[field] = req.body[field];
    }
    await tier.save();

    if (tier.isDefault) {
      await enforceSingleDefaultTier(tier._id);
    }

    res.json({ success: true, tier });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A tier with this code already exists.' });
    }
    next(err);
  }
};

exports.deleteTier = async (req, res, next) => {
  try {
    const tier = await PriceTier.findById(req.params.id);
    if (!tier) {
      return res.status(404).json({ success: false, message: 'Price tier not found' });
    }

    if (await isTierInUse(tier._id)) {
      return res.status(400).json({
        success: false,
        message: 'This tier is in use by a business account or catalog item. Deactivate it instead of deleting.',
      });
    }

    await tier.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
