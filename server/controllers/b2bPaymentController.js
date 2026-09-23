// server/controllers/b2bPaymentController.js
//
// Creates the Razorpay order for a B2B order's ADVANCE only (not the
// full payable) - mirrors controllers/paymentController.js exactly:
// same amount-never-trusted-from-client rule, same VerifiedPayment
// record, same Razorpay SDK usage. POST /api/payment/verify (unchanged)
// is reused as-is to verify the resulting payment; this file only ever
// creates the Razorpay order + the VerifiedPayment row that proves it
// was paid, never touches B2BOrder - utils/b2bOrderCreation.js is the
// only place a verified payment gets consumed into an actual order.

const Razorpay = require('razorpay');
const PriceTier = require('../models/PriceTier');
const VerifiedPayment = require('../models/VerifiedPayment');
const { priceB2BOrder } = require('../utils/b2bPricing');
const { round2 } = require('../utils/money');

function resolveShippingAddress(account, shippingAddressId) {
  const addresses = account.shippingAddresses || [];
  if (shippingAddressId) {
    const found = addresses.find((a) => String(a._id) === String(shippingAddressId));
    if (found) return found;
  }
  return addresses.find((a) => a.isDefault) || addresses[0] || account.billingAddress;
}

// ──────────────────────────────────────────────────────
// POST /api/b2b/orders/payment/create-order  (approved only)
// ──────────────────────────────────────────────────────
exports.createAdvancePaymentOrder = async (req, res, next) => {
  try {
    const account = req.business;
    const tier = account.tier ? await PriceTier.findById(account.tier) : null;
    const shippingAddress = resolveShippingAddress(account, req.body.shippingAddressId);

    const result = await priceB2BOrder({
      items: req.body.items,
      account: { _id: account._id, tier },
      shippingAddress,
    });
    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.errors });
    }

    const advanceAmount = round2(result.payable * account.advancePercent / 100);
    if (advanceAmount < 1) {
      return res.status(400).json({
        success: false,
        message: 'No advance payment is required for this account — place the order directly.',
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountInPaise = Math.round(advanceAmount * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `b2b_receipt_${Date.now()}`,
    });

    // "Created but not yet verified" - createB2BOrderForUser requires
    // proof this exact order was paid before it will place the B2BOrder.
    await VerifiedPayment.create({
      user: req.user._id,
      razorpayOrderId: order.id,
      amount: amountInPaise,
    });

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      // Lets the client display exactly what will be charged now vs.
      // held back, without either being the source of truth for the
      // charge itself.
      breakdown: { payable: result.payable, advanceAmount, remainingAmount: round2(result.payable - advanceAmount) },
    });
  } catch (err) {
    console.error('B2B Razorpay create-order error:', err);
    if (err.statusCode === 401) {
      return res.status(401).json({ success: false, message: 'Razorpay authentication failed' });
    }
    next(err);
  }
};
