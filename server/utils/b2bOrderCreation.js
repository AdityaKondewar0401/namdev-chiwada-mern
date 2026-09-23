// server/utils/b2bOrderCreation.js
//
// Shared B2B order-placement core, extracted from b2bOrderController.js
// the same way utils/orderCreation.js is for retail (single place that
// owns the security-sensitive parts of "place this order" so there's
// exactly one implementation to audit, not one per caller).
//
// This is where the advance/remainder split actually happens. If the
// account's advancePercent is > 0, a real Razorpay payment - created via
// b2bPaymentController.createAdvancePaymentOrder, verified via the
// existing POST /api/payment/verify (unchanged, fully reused as-is) -
// must already be verified and unconsumed before an order can be
// created at all. A 0%-advance account (pure credit) skips payment
// entirely, same shape as retail's COD path in orderCreation.js.

const mongoose = require('mongoose');
const B2BOrder = require('../models/B2BOrder');
const BusinessAccount = require('../models/BusinessAccount');
const LedgerEntry = require('../models/LedgerEntry');
const PriceTier = require('../models/PriceTier');
const User = require('../models/User');
const VerifiedPayment = require('../models/VerifiedPayment');
const { priceB2BOrder } = require('./b2bPricing');
const { shouldHold } = require('./b2bCredit');
const { nextB2BOrderNumber } = require('./b2bNumbering');
const { getTaxMode } = require('./taxMode');
const { round2 } = require('./money');
const { REMAINDER_DUE_DAYS } = require('./b2bInvoicing');
const { sendB2BOrderPlaced } = require('../services/emailService');

// Same address-resolution rule as b2bOrderController.quoteOrder/placeOrder.
function resolveShippingAddress(account, shippingAddressId) {
  const addresses = account.shippingAddresses || [];
  if (shippingAddressId) {
    const found = addresses.find((a) => String(a._id) === String(shippingAddressId));
    if (found) return found;
  }
  return addresses.find((a) => a.isDefault) || addresses[0] || account.billingAddress;
}

/**
 * @param {Object} params
 * @param {string} params.businessId
 * @param {string} params.userId - the user placing the order (req.user._id)
 * @param {Array}  params.items
 * @param {string} [params.shippingAddressId]
 * @param {string} [params.razorpayOrderId] required only when the
 *   account's advancePercent > 0
 * @param {string} [params.buyerNotes]
 * @returns {Promise<
 *   {success:true, order:Object} |
 *   {success:false, statusCode:number, message:string, errors?:Array}
 * >}
 */
async function createB2BOrderForUser({ businessId, userId, items, shippingAddressId, razorpayOrderId, buyerNotes }) {
  const account = await BusinessAccount.findById(businessId);
  if (!account) {
    return { success: false, statusCode: 404, message: 'Business account not found' };
  }

  const tier = account.tier ? await PriceTier.findById(account.tier) : null;
  const shippingAddress = resolveShippingAddress(account, shippingAddressId);

  const result = await priceB2BOrder({ items, account: { _id: account._id, tier }, shippingAddress });
  if (!result.success) {
    return { success: false, statusCode: 400, errors: result.errors };
  }

  const advanceAmount = round2(result.payable * account.advancePercent / 100);
  const remainingAmount = round2(result.payable - advanceAmount);

  // SECURITY: "was the advance actually paid" is never trusted from the
  // caller - same invariant as retail's createOrderForUser. Skipped
  // entirely for a 0%-advance account, since there's nothing to collect.
  let verifiedPayment = null;
  if (advanceAmount > 0) {
    if (!razorpayOrderId) {
      return { success: false, statusCode: 400, message: 'Advance payment must be completed before placing this order.' };
    }

    verifiedPayment = await VerifiedPayment.findOne({ razorpayOrderId });
    if (
      !verifiedPayment ||
      verifiedPayment.user.toString() !== userId.toString() ||
      !verifiedPayment.verified ||
      verifiedPayment.consumedAt
    ) {
      return { success: false, statusCode: 400, message: 'We could not verify this payment. Please try paying again.' };
    }

    // B2B has no persisted cart to drift the way retail's does, but the
    // catalog/tier can still change between quote-and-pay and this call
    // (admin edits a price) - reject rather than place an order for a
    // different advance than what was actually paid.
    if (verifiedPayment.amount !== Math.round(advanceAmount * 100)) {
      return {
        success: false,
        statusCode: 400,
        message: 'Pricing changed after payment was created. Please contact support with your payment ID.',
      };
    }
  }

  // Atomically claim the payment before creating the order - the same
  // double-spend guard as retail: only the request that flips
  // consumedAt from null wins.
  if (verifiedPayment) {
    verifiedPayment = await VerifiedPayment.findOneAndUpdate(
      { _id: verifiedPayment._id, consumedAt: null },
      { consumedAt: new Date() },
      { new: true }
    );
    if (!verifiedPayment) {
      return { success: false, statusCode: 400, message: 'This payment has already been used for another order.' };
    }
  }

  const creditHold = await shouldHold(account, remainingAmount);
  const remainingDueDate = new Date(Date.now() + REMAINDER_DUE_DAYS * 24 * 60 * 60 * 1000);

  // Order + its advance-payment ledger credit commit together or not at
  // all - same "money write must be transactional" rule this codebase
  // already applies to invoice issuance (utils/b2bInvoicing.js).
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      const orderNumber = await nextB2BOrderNumber(account.isTest, session);

      const [created] = await B2BOrder.create([{
        orderNumber,
        business: account._id,
        placedBy: userId,
        items: result.lines.map((l) => ({
          catalogItem: l.catalogItem, product: l.product, name: l.name, size: l.size,
          unitsPerCase: l.unitsPerCase, cases: l.cases, units: l.units, unitPrice: l.unitPrice, lineTotal: l.lineTotal,
        })),
        billing: { businessName: account.businessName, gstin: account.gstin, address: account.billingAddress },
        shippingAddress,
        taxMode: getTaxMode(),
        totals: {
          subtotal: result.subtotal, taxTotal: result.taxTotal, grandTotal: result.grandTotal,
          roundOff: result.roundOff, payable: result.payable,
        },
        status: 'placed',
        statusHistory: [{ status: 'placed', by: userId }],
        creditHold,
        advancePercent: account.advancePercent,
        advanceAmount,
        remainingAmount,
        remainingDueDate,
        razorpayOrderId: verifiedPayment?.razorpayOrderId || undefined,
        razorpayPaymentId: verifiedPayment?.razorpayPaymentId || undefined,
        buyerNotes,
      }], { session });
      order = created;

      if (advanceAmount > 0) {
        await LedgerEntry.create([{
          business: account._id,
          date: new Date(),
          type: 'payment',
          debit: 0,
          credit: advanceAmount,
          refModel: 'B2BOrder',
          refId: order._id,
          method: 'razorpay',
          reference: verifiedPayment.razorpayPaymentId,
          note: 'Advance payment at order placement',
          recordedBy: userId,
        }], { session });
      }
    });
  } catch (createErr) {
    // Release the payment claim so the customer isn't locked out of
    // retrying with the same payment - same rollback as retail.
    if (verifiedPayment) {
      await VerifiedPayment.updateOne({ _id: verifiedPayment._id }, { consumedAt: null });
    }
    throw createErr;
  } finally {
    session.endSession();
  }

  try {
    const userForEmail = await User.findById(userId).select('email');
    await sendB2BOrderPlaced(order, account, userForEmail);
  } catch (emailErr) {
    console.error('B2B order-placed email failed to send:', emailErr.message);
  }

  return { success: true, order };
}

module.exports = { createB2BOrderForUser };
