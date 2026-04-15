import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'COD', label: 'Cash on Delivery', icon: '💵' },
  { id: 'UPI', label: 'UPI / GPay / PhonePe', icon: '📱' },
  { id: 'CARD', label: 'Credit / Debit Card', icon: '💳' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user } = useAuth();
  const { promoCode = '', discount = 0, freeShipping = false } = location.state || {};

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || 'Maharashtra',
    pincode: user?.address?.pincode || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const effectiveShipping = freeShipping ? 0 : shipping;
  const finalTotal = total - discount - (freeShipping ? shipping : 0);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) e.phone = 'Valid 10-digit phone required';
    if (!form.street.trim()) e.street = 'Street address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Valid 6-digit pincode required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlace = async () => {
    if (!validate()) return;
    if (!user) { toast.error('Please login to place an order'); navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await orderAPI.place({
        shippingAddress: form,
        paymentMethod,
        promoCode,
        notes: '',
      });
      await clearCart();
      toast.success('🎉 Order placed successfully!');
      navigate(`/orders/${res.data.order._id}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  const field = (name, label, placeholder, type = 'text') => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">{label}</label>
      <input type={type} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder={placeholder} className={`form-input ${errors[name] ? 'border-red-400 ring-1 ring-red-200' : ''}`} />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-16">
      {/* Header */}
      <div className="pt-12 pb-8 px-6" style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300 60%,#e07000)' }}>
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-white/50 mb-3">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>›</span>
            <Link to="/cart" className="hover:text-white">Cart</Link>
            <span>›</span>
            <span className="text-white">Checkout</span>
          </nav>
          <h1 className="font-serif font-black text-white text-3xl">Checkout</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left: Delivery + Payment */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-xl2 shadow-saffron p-6 border border-saffron/8">
              <h3 className="font-serif font-bold text-brown-dark text-lg mb-5 flex items-center gap-2">
                📍 Delivery Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('name', 'Full Name *', 'Rahul Deshmukh')}
                {field('phone', 'Phone / WhatsApp *', '9876543210', 'tel')}
                <div className="sm:col-span-2">{field('street', 'Street Address *', 'Flat No, Building, Area')}</div>
                {field('city', 'City *', 'Solapur')}
                {field('state', 'State', 'Maharashtra')}
                {field('pincode', 'Pincode *', '413001')}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl2 shadow-saffron p-6 border border-saffron/8">
              <h3 className="font-serif font-bold text-brown-dark text-lg mb-5 flex items-center gap-2">
                💳 Payment Method
              </h3>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === m.id
                        ? 'border-saffron bg-saffron-pale'
                        : 'border-saffron/15 hover:border-saffron/40 bg-white'
                    }`}>
                    <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id}
                      onChange={() => setPaymentMethod(m.id)} className="accent-saffron" />
                    <span className="text-xl">{m.icon}</span>
                    <span className="font-semibold text-brown-dark text-sm">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl2 shadow-saffron p-6 border border-saffron/8 sticky top-24">
            <h3 className="font-serif font-bold text-brown-dark text-lg mb-5">Order Summary</h3>

            <div className="space-y-3 mb-5 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item._id || item.id} className="flex gap-3 items-center text-sm">
                  <img src={item.img} alt={item.name} className="w-10 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-brown-dark truncate">{item.name}</div>
                    <div className="text-xs text-brown-mid/60">{item.size} × {item.qty}</div>
                  </div>
                  <div className="font-bold text-saffron">₹{item.price * item.qty}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-saffron/10 pt-4 space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-brown-mid/70">Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brown-mid/70">Delivery</span>
                <span className={effectiveShipping === 0 ? 'text-leaf font-semibold' : ''}>
                  {effectiveShipping === 0 ? 'FREE' : `₹${effectiveShipping}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-leaf">
                  <span>Promo Discount</span>
                  <span>−₹{discount}</span>
                </div>
              )}
              <div className="border-t border-saffron/10 pt-2 flex justify-between font-black text-brown-dark text-base">
                <span>Total</span>
                <span>₹{finalTotal}</span>
              </div>
            </div>

            <button onClick={handlePlace} disabled={loading || items.length === 0}
              className={`w-full btn-saffron py-4 font-bold text-base ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {loading ? '⏳ Placing Order...' : `Place Order · ₹${finalTotal}`}
            </button>
            <p className="text-center text-xs text-brown-mid/50 mt-3">🔒 100% Secure · Easy Returns</p>
          </div>
        </div>
      </div>
    </div>
  );
}
