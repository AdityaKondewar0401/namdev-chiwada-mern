const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const User = require('../models/User');
const Partner = require('../models/Partner');
const PartnerInvite = require('../models/PartnerInvite');
const Consignment = require('../models/Consignment');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const PartnerOrderRequest = require('../models/PartnerOrderRequest');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

// ──────────────────────────────────────────────────────
// POST /api/partner/set-password
// Public — validated by a one-time invite token, not a session.
// Body: { token, password }
// ──────────────────────────────────────────────────────
exports.setPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const invite = await PartnerInvite.findOne({ token });
    if (!invite) {
      return res.status(400).json({ success: false, message: 'Invalid or unknown invite link' });
    }
    if (invite.used) {
      return res.status(400).json({ success: false, message: 'This invite link has already been used' });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This invite link has expired. Ask the admin to resend it.',
      });
    }

    const user = await User.findById(invite.user);
    if (!user || user.role !== 'partner') {
      return res.status(404).json({ success: false, message: 'Partner account not found' });
    }

    user.password = password; // pre-save hook hashes this
    user.isVerified = true;
    await user.save();

    invite.used = true;
    await invite.save();

    const token2 = signToken(user._id);
    res.json({
      success: true,
      token: token2,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/partner/me
// Protected, partnerOnly — the logged-in partner's own business profile.
// ──────────────────────────────────────────────────────
exports.getMyProfile = async (req, res, next) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found' });
    }
    res.json({ success: true, partner });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/partner/consignments
// Protected, partnerOnly — only ever returns THIS partner's own data,
// scoped by their linked Partner record, never by a client-supplied id.
// ──────────────────────────────────────────────────────
exports.getMyConsignments = async (req, res, next) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found' });
    }

    const consignments = await Consignment.find({ partner: partner._id }).sort({ dispatchDate: -1 });
    const consignmentIds = consignments.map((c) => c._id);
    const payments = await Payment.find({ consignment: { $in: consignmentIds } });

    const paymentsByConsignment = payments.reduce((acc, p) => {
      const key = p.consignment.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    const result = consignments.map((c) => ({
      ...c.toObject(),
      payments: paymentsByConsignment[c._id.toString()] || [],
    }));

    res.json({ success: true, consignments: result });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/partner/payments/:paymentId/create-order
// Protected, partnerOnly. Creates a Razorpay order for ONE installment
// (advance or final) so the partner can pay online instead of waiting
// for the admin to mark it paid manually.
// SECURITY: the amount is taken from the Payment doc itself (server-side
// truth), and we verify the payment actually belongs to THIS partner —
// never trust a paymentId alone, since any logged-in partner could guess
// another partner's payment id otherwise.
// ──────────────────────────────────────────────────────
exports.createPaymentOrder = async (req, res, next) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found' });
    }

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment || payment.partner.toString() !== partner._id.toString()) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'This installment is already paid' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountInPaise = Math.round(payment.amountDue * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `partner_payment_${payment._id}`,
    });

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Partner Razorpay create-order error:', err);
    if (err.statusCode === 401) {
      return res.status(401).json({ success: false, message: 'Razorpay authentication failed' });
    }
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/partner/payments/:paymentId/verify
// Protected, partnerOnly. Verifies the Razorpay signature, then marks
// this installment paid and rolls the parent Consignment's status up —
// same transition logic as the admin's manual markPaymentPaid.
// ──────────────────────────────────────────────────────
exports.verifyPartnerPayment = async (req, res, next) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found' });
    }

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment || payment.partner.toString() !== partner._id.toString()) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'This installment is already paid' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment fields' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature mismatch' });
    }

    payment.status = 'paid';
    payment.paidDate = new Date();
    payment.razorpayOrderId = razorpay_order_id;
    payment.razorpayPaymentId = razorpay_payment_id;
    await payment.save();

    const siblings = await Payment.find({ consignment: payment.consignment });
    const allPaid = siblings.every((p) => p.status === 'paid');
    const anyPaid = siblings.some((p) => p.status === 'paid');

    await Consignment.findByIdAndUpdate(payment.consignment, {
      status: allPaid ? 'settled' : anyPaid ? 'partially_settled' : 'dispatched',
    });

    res.json({ success: true, payment });
  } catch (err) {
    console.error('Partner Razorpay verify error:', err);
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/partner/products
// Protected, partnerOnly. Lists in-stock products with a partnerPrice
// per size, computed from each product's partnerDiscountPercent — this
// is what the partner sees when placing an order, distinct from the
// retail price shown on the public site.
// ──────────────────────────────────────────────────────
exports.getPartnerProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ inStock: true }).sort({ sortOrder: 1, name: 1 });

    const result = products.map((p) => {
      const discount = p.partnerDiscountPercent ?? 30;
      const sizes = (p.sizes && p.sizes.length > 0)
        ? p.sizes.map((s) => ({
            weight: s.weight,
            retailPrice: s.price,
            partnerPrice: Math.round(s.price * (1 - discount / 100)),
          }))
        : [{
            weight: p.weight,
            retailPrice: p.price,
            partnerPrice: Math.round(p.price * (1 - discount / 100)),
          }];

      return {
        _id: p._id,
        name: p.name,
        img: p.img,
        category: p.category,
        partnerDiscountPercent: discount,
        sizes,
      };
    });

    res.json({ success: true, products: result });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/partner/orders
// Protected, partnerOnly. A partner requests stock at their own discount —
// this does NOT create a Consignment yet. It's a request the admin must
// review and approve (possibly adjusting quantities/prices) before it
// becomes a real, binding Consignment with Payment records.
// Body: { items: [{ productId, size, qty }], notes }
// ──────────────────────────────────────────────────────
exports.createOrderRequest = async (req, res, next) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found' });
    }

    const { items, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one product to order' });
    }

    const normalizedItems = [];
    for (const item of items) {
      const qty = Number(item.qty);
      if (!item.productId || !qty || qty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each item needs a product and a qty of at least 1',
        });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      const discount = product.partnerDiscountPercent ?? 30;
      const sizeMatch = (product.sizes || []).find((s) => s.weight === item.size);
      const retailPrice = sizeMatch ? sizeMatch.price : product.price;
      const estimatedUnitPrice = Math.round(retailPrice * (1 - discount / 100));

      normalizedItems.push({
        product: product._id,
        name: product.name,
        size: item.size || sizeMatch?.weight || product.weight,
        qty,
        estimatedUnitPrice,
      });
    }

    const estimatedTotal = normalizedItems.reduce((sum, i) => sum + i.qty * i.estimatedUnitPrice, 0);

    const orderRequest = await PartnerOrderRequest.create({
      partner: partner._id,
      items: normalizedItems,
      estimatedTotal,
      notes,
    });

    res.status(201).json({ success: true, orderRequest });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/partner/orders
// Protected, partnerOnly. This partner's own order requests, newest first.
// ──────────────────────────────────────────────────────
exports.getMyOrderRequests = async (req, res, next) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found' });
    }

    const orderRequests = await PartnerOrderRequest.find({ partner: partner._id }).sort({ createdAt: -1 });
    res.json({ success: true, orderRequests });
  } catch (err) {
    next(err);
  }
};
