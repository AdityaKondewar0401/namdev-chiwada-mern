// server/controllers/b2bAdminLedgerController.js
//
// Admin ledger actions. LedgerEntry is append-only everywhere else in
// this codebase (spec §2 rule 7) — these routes only ever INSERT a new
// entry, never update/delete one. The only exception to append-only in
// the whole system is scripts/purgeB2BTestData.js, and only for isTest
// accounts.

const BusinessAccount = require('../models/BusinessAccount');
const LedgerEntry = require('../models/LedgerEntry');
const { buildStatement, statementToCsv } = require('../utils/b2bStatement');
const { sendB2BPaymentRecorded } = require('../services/emailService');

exports.getAccountLedger = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const statement = await buildStatement(req.params.id, { from, to });
    res.json({ success: true, ...statement });
  } catch (err) {
    next(err);
  }
};

exports.exportAccountLedgerCsv = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const statement = await buildStatement(req.params.id, { from, to });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="statement.csv"');
    res.send(statementToCsv(statement));
  } catch (err) {
    next(err);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findById(req.params.id).populate('user', 'name email');
    if (!business) return res.status(404).json({ success: false, message: 'Business account not found' });

    const { amount, date, method, reference, note } = req.body;
    const entry = await LedgerEntry.create({
      business: business._id,
      date: date ? new Date(date) : new Date(),
      type: 'payment',
      debit: 0,
      credit: amount,
      method,
      reference,
      note,
      recordedBy: req.user._id,
    });

    try {
      await sendB2BPaymentRecorded(business, entry);
    } catch (emailErr) {
      console.error('B2B payment-recorded email failed to send:', emailErr.message);
    }

    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
};

exports.recordAdjustment = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, message: 'Business account not found' });

    const { type, amount, note } = req.body;
    const entry = await LedgerEntry.create({
      business: business._id,
      date: new Date(),
      type: 'adjustment',
      debit: type === 'debit' ? amount : 0,
      credit: type === 'credit' ? amount : 0,
      note,
      recordedBy: req.user._id,
    });

    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
};

exports.recordOpeningBalance = async (req, res, next) => {
  try {
    const business = await BusinessAccount.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, message: 'Business account not found' });

    const existing = await LedgerEntry.exists({ business: business._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An opening balance can only be recorded once, before any other ledger entries exist.' });
    }

    const { amount, note } = req.body;
    const entry = await LedgerEntry.create({
      business: business._id,
      date: new Date(),
      type: 'opening_balance',
      debit: amount > 0 ? amount : 0,
      credit: amount < 0 ? -amount : 0,
      note,
      recordedBy: req.user._id,
    });

    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
};
