import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    shipping,
    total,
    clearCart,
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);

  const navigate = useNavigate();

  const handlePromo = async () => {
    if (!promoCode) return;

    try {
      const res = await orderAPI.validatePromo({
        code: promoCode,
        subtotal,
      });

      setPromoDiscount(res.data.discount || 0);
      setFreeShipping(res.data.freeShipping || false);
      setPromoApplied(true);

      toast.success(res.data.message);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Invalid promo code'
      );
    }
  };

  const effectiveShipping = freeShipping ? 0 : shipping;
  const finalTotal = total - promoDiscount - (freeShipping ? shipping : 0);

  if (items.length === 0) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-cream flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="font-serif font-black text-brown-dark text-2xl mb-3">
              Your cart is empty
            </h2>
            <p className="text-brown-mid/60 mb-8">
              Looks like you haven't added any snacks yet!
            </p>
            <Link to="/products" className="btn-saffron px-8 py-3.5">
              Browse Products →
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <div
          className="pt-12 pb-8 px-6"
          style={{
            background:
              'linear-gradient(135deg,#3d1c00,#7a3300 60%,#e07000)',
          }}
        >
          <div className="max-w-6xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-white/50 mb-3">
              <Link to="/" className="hover:text-white">
                Home
              </Link>
              <span>›</span>
              <span className="text-white">Cart</span>
            </nav>

            <h1 className="font-serif font-black text-white text-3xl">
              Your Cart
            </h1>

            <p className="text-white/60 text-sm mt-1">
              Review your order before checkout
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

            {/* Cart Items */}
            <div>
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item._id}
                    layout={false}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white rounded-xl shadow-saffron border border-saffron/6 p-4 mb-4"
                  >
                    <div className="flex gap-4 items-start">
                      {/* Image */}
                      <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-serif font-bold text-brown-dark truncate">
                            {item.name}
                          </div>
                          <div className="font-bold text-saffron text-lg flex-shrink-0">
                            ₹{item.price * item.qty}
                          </div>
                        </div>

                        <div className="text-xs text-brown-mid/60 mb-3">
                          Size: {item.size} · ₹{item.price} each
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-2 bg-cream-mid rounded-full px-1 py-0.5">
                            <button
                              onClick={() =>
                                item.qty === 1
                                  ? removeFromCart(item._id)
                                  : updateQuantity(
                                    item.product,
                                    item.size,
                                    item.qty - 1
                                  )
                              }
                              className="w-7 h-7 rounded-full border border-saffron/40 text-saffron font-bold flex items-center justify-center hover:bg-saffron hover:text-white transition-all text-sm"
                            >
                              −
                            </button>

                            <span className="font-bold text-brown-dark w-5 text-center text-sm">
                              {item.qty}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product,
                                  item.size,
                                  item.qty + 1
                                )
                              }
                              className="w-7 h-7 rounded-full border border-saffron/40 text-saffron font-bold flex items-center justify-center hover:bg-saffron hover:text-white transition-all text-sm"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Clear Cart */}
              <div className="flex justify-end mt-2">
                <button
                  onClick={clearCart}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(220,38,38,0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(220,38,38,0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  🗑 Clear Cart
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl2 shadow-saffron border border-saffron/8 p-6 sticky top-24">
              <h3 className="font-serif font-bold text-brown-dark text-xl mb-5">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm mb-5">
                <div className="flex justify-between">
                  <span className="text-brown-mid/70">
                    Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)
                  </span>
                  <span className="font-semibold">₹{subtotal}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-brown-mid/70">Delivery</span>
                  <span
                    className={`font-semibold ${effectiveShipping === 0 ? 'text-leaf' : ''
                      }`}
                  >
                    {effectiveShipping === 0 ? 'FREE' : `₹${effectiveShipping}`}
                  </span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-leaf">
                    <span>Promo Discount</span>
                    <span>−₹{promoDiscount}</span>
                  </div>
                )}

                {subtotal < 500 && !freeShipping && (
                  <div className="text-xs text-saffron bg-saffron-pale rounded-lg px-3 py-2">
                    🎉 Add ₹{500 - subtotal} more for FREE delivery!
                  </div>
                )}

                <div className="border-t border-saffron/10 pt-3 flex justify-between font-black text-brown-dark text-base">
                  <span>Total</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>

              {/* Promo */}
              {!promoApplied ? (
                <div className="flex gap-2 mb-5">
                  <input
                    value={promoCode}
                    onChange={(e) =>
                      setPromoCode(e.target.value.toUpperCase())
                    }
                    placeholder="Promo code"
                    className="form-input py-2 rounded-xl text-sm flex-1"
                  />
                  <button
                    onClick={handlePromo}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-saffron hover:bg-saffron-light transition-colors whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-leaf text-sm font-semibold bg-green-50 rounded-xl px-3 py-2 mb-5">
                  <span>✅</span>
                  Promo "{promoCode}" applied!
                  <button
                    onClick={() => {
                      setPromoApplied(false);
                      setPromoCode('');
                      setPromoDiscount(0);
                      setFreeShipping(false);
                    }}
                    className="ml-auto text-xs text-brown-mid/60 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              )}

              <button
                onClick={() =>
                  navigate('/checkout', {
                    state: {
                      promoCode: promoApplied ? promoCode : '',
                      discount: promoDiscount,
                      freeShipping,
                    },
                  })
                }
                className="w-full btn-saffron py-4 font-bold text-base mb-3"
              >
                Proceed to Checkout →
              </button>
              {/* Razorpay Trusted Business Badge */}
              <div className="mt-4 rounded-2xl overflow-hidden"
                style={{ border: '1.5px solid #c8d8f5', background: 'linear-gradient(135deg,#eef3fd,#f0f7ff)' }}>
                <div className="flex items-center gap-4 p-4">

                  {/* Left — Shield logo + text */}
                  <div className="flex flex-col items-center flex-shrink-0 min-w-[90px]">
                    {/* Razorpay Shield SVG */}
                    <svg width="52" height="58" viewBox="0 0 52 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M26 2L4 12V28C4 40.5 13.5 52.1 26 56C38.5 52.1 48 40.5 48 28V12L26 2Z"
                        fill="url(#shieldGrad)" />
                      <defs>
                        <linearGradient id="shieldGrad" x1="4" y1="2" x2="48" y2="56" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#34d45a" />
                          <stop offset="100%" stopColor="#1a9e38" />
                        </linearGradient>
                      </defs>
                      <path d="M26 8L8 17V29C8 39.5 16 49.2 26 52.5C36 49.2 44 39.5 44 29V17L26 8Z"
                        fill="white" fillOpacity="0.15" />
                      {/* Razorpay R lightning bolt */}
                      <path d="M22 18h8l-4 8h5L20 40l3-12h-5l4-10z"
                        fill="white" />
                    </svg>

                    <div className="mt-1 text-center">
                      <div style={{ color: '#1a3b8f', fontWeight: 800, fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Razorpay
                      </div>
                      <div style={{ color: '#2770ef', fontWeight: 700, fontSize: '0.65rem' }}>
                        Trusted Business
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-px self-stretch" style={{ background: '#c8d8f5' }} />

                  {/* Right — Trust points */}
                  <div className="flex flex-col gap-3 flex-1">

                    {/* Verified Business */}
                    <div className="flex items-center gap-2.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#2770ef" strokeWidth="1.8" />
                        <path d="M8 12l3 3 5-5" stroke="#2770ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 2C8 2 5 4 4 7" stroke="#2770ef" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                      </svg>
                      <p style={{ fontSize: '0.82rem', color: '#1a1a2e' }}>
                        <span style={{ fontWeight: 700 }}>Verified</span>
                        <span style={{ color: '#555', fontWeight: 400 }}> Business</span>
                      </p>
                    </div>

                    {/* Secured Payments */}
                    <div className="flex items-center gap-2.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z"
                          stroke="#2770ef" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M9 12l2 2 4-4" stroke="#2770ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p style={{ fontSize: '0.82rem', color: '#1a1a2e' }}>
                        <span style={{ fontWeight: 700 }}>Secured</span>
                        <span style={{ color: '#555', fontWeight: 400 }}> Payments</span>
                      </p>
                    </div>

                    {/* Prompt Support */}
                    <div className="flex items-center gap-2.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#2770ef" strokeWidth="1.8" />
                        <path d="M12 6v6l4 2" stroke="#2770ef" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <p style={{ fontSize: '0.82rem', color: '#1a1a2e' }}>
                        <span style={{ fontWeight: 700 }}>Prompt</span>
                        <span style={{ color: '#555', fontWeight: 400 }}> Support</span>
                      </p>
                    </div>

                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-brown-mid/50">
                🔒 Secure Checkout · 📦 Fast Delivery
              </div>

              <div className="mt-3 text-center">
                <Link
                  to="/products"
                  className="text-xs text-saffron hover:text-saffron-light transition-colors font-medium"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}