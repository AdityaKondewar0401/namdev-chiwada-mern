const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { calculateCartTotals } = require('../utils/pricing');

// POST /api/payment/create-order
// SECURITY: amount is derived from the user's persisted server-side cart
// (+ a re-validated promo code, if any), never from the client. A
// tampered client request can no longer set the charge amount — this
// mirrors exactly what orderController.placeOrder will later charge for
// the same cart, via the same calculateCartTotals() helper.
exports.createPaymentOrder = async (req, res) => {
  try {
    // Initialize inside function so env vars are guaranteed to be loaded
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const { promoCode } = req.body;
    const { subtotal, shippingCharge, discount, total } = await calculateCartTotals(
      cart.items,
      promoCode
    );

    if (total < 1) {
      return res.status(400).json({ success: false, message: 'Amount must be at least ₹1' });
    }
    const amountInPaise = Math.round(total * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      // Lets the client display exactly what will be charged, without it
      // being the source of truth for the charge itself.
      breakdown: { subtotal, shippingCharge, discount, total },
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    if (err.statusCode === 401) {
      return res.status(401).json({ success: false, message: 'Razorpay authentication failed' });
    }
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

// POST /api/payment/verify
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

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

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      });
    }

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};