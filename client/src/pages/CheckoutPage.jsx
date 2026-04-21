import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import api from '../services/api';

// ── Load Razorpay script dynamically ──────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items: cart = [], subtotal: cartTotal = 0, clearCart } = useCart();
  const { user } = useAuth();

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
  });

  const [promoCode, setPromoCode]       = useState('');
  const [promoApplied, setPromoApplied] = useState(null); // { discount, message }
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError]     = useState('');

  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'cod'
  const [processing, setProcessing]       = useState(false);
  const [errors, setErrors]               = useState({});

  // ── Derived totals ─────────────────────────────────
  const subtotal = cartTotal;
  const discount = promoApplied?.discount || 0;
  const shipping  = subtotal >= 499 ? 0 : 49;
  const total     = Math.max(0, subtotal - discount + shipping);

  // ── Validation ─────────────────────────────────────
  function validate() {
    const e = {};
    if (!address.fullName.trim()) e.fullName = 'Name is required';
    if (!/^\d{10}$/.test(address.phone)) e.phone = 'Enter valid 10-digit phone';
    if (!address.line1.trim()) e.line1 = 'Address is required';
    if (!address.city.trim()) e.city = 'City is required';
    if (!address.state) e.state = 'State is required';
    if (!/^\d{6}$/.test(address.pincode)) e.pincode = 'Enter valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Promo code ─────────────────────────────────────
  async function applyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await orderAPI.validatePromo({ code: promoCode, subtotal });
      setPromoApplied({ discount: res.data.discount, message: res.data.message });
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Invalid promo code');
      setPromoApplied(null);
    } finally {
      setPromoLoading(false);
    }
  }

  // ── Place COD order ────────────────────────────────
  async function placeCODOrder() {
    setProcessing(true);
    try {
      const res = await orderAPI.place({
        shippingAddress: address,
        paymentMethod: 'COD',
        promoCode: promoApplied ? promoCode : '',
      });
      clearCart();
      navigate(`/orders/${res.data.order._id}`, { state: { success: true } });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  // ── Razorpay checkout flow ─────────────────────────
  async function handleRazorpayPayment() {
    setProcessing(true);
    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway. Check your internet connection.');
        setProcessing(false);
        return;
      }

      // 2. Create order in your DB (status: pending, paymentStatus: pending)
      const orderRes = await orderAPI.place({
        shippingAddress: address,
        paymentMethod: 'ONLINE',
        promoCode: promoApplied ? promoCode : '',
      });
      const dbOrder = orderRes.data.order;

      // 3. Create Razorpay order via your backend (amount comes from DB, not frontend)
      const rzpRes = await api.post('/payment/create-order', { amount: dbOrder.total });
      if (!rzpRes.data.success) throw new Error(rzpRes.data.message);
      const { order_id, amount: rzpAmount, currency } = rzpRes.data;

      // 4. Open Razorpay modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rzpAmount,
        currency,
        name: 'Namdev Chiwada',
        description: `Order #${dbOrder._id}`,
        image: '/logo.png',
        order_id,

        handler: async function (response) {
          // 5. Verify signature on backend
          try {
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId: dbOrder._id,
            });

            if (verifyRes.data.success) {
              clearCart();
              navigate(`/orders/${dbOrder._id}`, { state: { success: true, paid: true } });
            } else {
              alert('Payment verification failed. Contact support with your payment ID: ' + response.razorpay_payment_id);
            }
          } catch {
            alert('Verification error. Please contact support.');
          }
        },

        prefill: {
          name:    address.fullName,
          contact: address.phone,
          email:   user?.email || '',
        },

        notes: {
          order_id: dbOrder._id,
          address:  `${address.line1}, ${address.city}`,
        },

        theme: { color: '#e07000' },

        modal: {
          ondismiss: function () {
            setProcessing(false);
            alert('Payment cancelled. Your order is saved — you can retry from Orders page.');
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description}. Please try again.`);
        setProcessing(false);
      });

      rzp.open();

    } catch (err) {
      console.error('Checkout error:', err);
      alert(err.response?.data?.message || 'Something went wrong. Please try again.');
      setProcessing(false);
    }
  }

  // ── Main submit ────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (cart.length === 0) { alert('Your cart is empty.'); return; }

    if (paymentMethod === 'cod') {
      await placeCODOrder();
    } else {
      await handleRazorpayPayment();
    }
  }

  // ── Field helper ───────────────────────────────────
  const Field = ({ label, name, type = 'text', placeholder, half }) => (
    <div className={half ? 'flex-1 min-w-0' : 'w-full'}>
      <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={address[name]}
        onChange={e => setAddress(p => ({ ...p, [name]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border text-sm bg-white text-brown-dark placeholder-brown-mid/40 outline-none transition-all
          ${errors[name] ? 'border-red-400 bg-red-50' : 'border-saffron/20 focus:border-saffron focus:ring-2 focus:ring-saffron/10'}`}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl">🛒</div>
        <p className="font-serif font-bold text-brown-dark text-xl">Your cart is empty</p>
        <button onClick={() => navigate('/products')}
          className="px-6 py-3 rounded-full font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">

        <h1 className="font-serif font-black text-brown-dark mb-8"
          style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)' }}>
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Left: Address + Payment ── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Delivery Address */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-saffron/8">
                <h2 className="font-serif font-bold text-brown-dark text-lg mb-5">
                  📍 Delivery Address
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Field label="Full Name" name="fullName" placeholder="Aditya Kondewar" half />
                    <Field label="Phone" name="phone" type="tel" placeholder="9876543210" half />
                  </div>
                  <Field label="Address Line 1" name="line1" placeholder="House no, Street, Area" />
                  <Field label="Address Line 2 (optional)" name="line2" placeholder="Landmark, Colony" />
                  <div className="flex gap-3">
                    <Field label="City" name="city" placeholder="Solapur" half />
                    <Field label="Pincode" name="pincode" placeholder="413001" half />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">
                      State
                    </label>
                    <select
                      value={address.state}
                      onChange={e => setAddress(p => ({ ...p, state: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-saffron/20 text-sm bg-white text-brown-dark outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all">
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-saffron/8">
                <h2 className="font-serif font-bold text-brown-dark text-lg mb-5">
                  💳 Payment Method
                </h2>
                <div className="space-y-3">

                  {/* Razorpay — Pay Online */}
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${paymentMethod === 'razorpay' ? 'border-saffron bg-saffron/5' : 'border-saffron/15 hover:border-saffron/30'}`}>
                    <input type="radio" name="payment" value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="accent-saffron w-4 h-4" />
                    <div className="flex-1">
                      <div className="font-bold text-brown-dark text-sm">
                        Pay Online
                        <span className="ml-2 text-xs font-normal text-brown-mid/60">
                          UPI · Cards · Netbanking · Wallets
                        </span>
                      </div>
                      <div className="text-xs text-brown-mid/50 mt-0.5">Powered by Razorpay · 100% Secure</div>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <span className="text-lg">💳</span>
                      <span className="text-lg">📱</span>
                    </div>
                  </label>

                  {/* COD */}
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${paymentMethod === 'cod' ? 'border-saffron bg-saffron/5' : 'border-saffron/15 hover:border-saffron/30'}`}>
                    <input type="radio" name="payment" value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-saffron w-4 h-4" />
                    <div className="flex-1">
                      <div className="font-bold text-brown-dark text-sm">Cash on Delivery</div>
                      <div className="text-xs text-brown-mid/50 mt-0.5">Pay when your order arrives</div>
                    </div>
                    <span className="text-lg">💵</span>
                  </label>

                </div>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-saffron/8 lg:sticky lg:top-24">
                <h2 className="font-serif font-bold text-brown-dark text-lg mb-5">
                  🧾 Order Summary
                </h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-5 max-h-56 overflow-y-auto pr-1">
                  {cart.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img src={item.img} alt={item.name}
                        className="w-12 h-12 rounded-lg object-contain bg-cream flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-brown-dark truncate">{item.name}</div>
                        <div className="text-xs text-brown-mid/60">{item.weight} × {item.qty}</div>
                      </div>
                      <div className="text-sm font-bold text-brown-dark">
                        ₹{(item.price * item.qty).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-saffron/10 pt-4 mb-4" />

                {/* Promo Code */}
                <div className="mb-5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError('');
                        setPromoApplied(null);
                      }}
                      placeholder="Promo code"
                      className="flex-1 px-3 py-2.5 rounded-xl border border-saffron/20 text-sm bg-white text-brown-dark outline-none focus:border-saffron transition-all" />
                    <button type="button" onClick={applyPromo} disabled={promoLoading}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-green-600 text-xs mt-1.5 font-medium">
                      ✓ {promoApplied.message} (−₹{promoApplied.discount})
                    </p>
                  )}
                  {promoError && <p className="text-red-500 text-xs mt-1.5">{promoError}</p>}
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between text-brown-mid/70">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount</span>
                      <span>−₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-brown-mid/70">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0
                        ? <span className="text-green-600 font-medium">FREE</span>
                        : `₹${shipping}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-brown-mid/50">Free shipping on orders above ₹499</p>
                  )}
                  <div className="border-t border-saffron/10 pt-2 flex justify-between font-black text-brown-dark text-base">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-4 rounded-full font-bold text-white text-base transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: processing ? '#9ca3af' : 'linear-gradient(135deg,#e07000,#ff9010)',
                    boxShadow: processing ? 'none' : '0 4px 16px rgba(224,112,0,0.35)',
                  }}>
                  {processing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Processing...
                    </>
                  ) : paymentMethod === 'razorpay' ? (
                    '🔒 Pay ₹' + total.toLocaleString()
                  ) : (
                    '📦 Place Order ₹' + total.toLocaleString()
                  )}
                </button>

                <p className="text-center text-xs text-brown-mid/40 mt-3">
                  {paymentMethod === 'razorpay' ? '🔒 Secured by Razorpay' : '✓ Pay when order arrives'}
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
