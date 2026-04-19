import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, updateQty, removeFromCart, subtotal, shipping, total, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const navigate = useNavigate();

  const handlePromo = async () => {
    if (!promoCode) return;
    try {
      const res = await orderAPI.validatePromo(promoCode, subtotal);
      setPromoDiscount(res.data.discount || 0);
      setFreeShipping(res.data.freeShipping || false);
      setPromoApplied(true);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid promo code');
    }
  };

  const effectiveShipping = freeShipping ? 0 : shipping;
  const finalTotal = total - promoDiscount - (freeShipping ? shipping : 0);

  if (items.length === 0) return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-7xl mb-6">🛒</div>
        <h2 className="font-serif font-black text-brown-dark text-2xl mb-3">Your cart is empty</h2>
        <p className="text-brown-mid/60 mb-8">Looks like you haven't added any snacks yet!</p>
        <Link to="/products" className="btn-saffron px-8 py-3.5">Browse Products →</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Page Header */}
      <div className="pt-12 pb-8 px-6" style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300 60%,#e07000)' }}>
        <div className="max-w-6xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-white/50 mb-3">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>›</span>
            <span className="text-white">Cart</span>
          </nav>
          <h1 className="font-serif font-black text-white text-3xl">Your Cart</h1>
          <p className="text-white/60 text-sm mt-1">Review your order before checkout</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Cart Items */}
          <div>
            <AnimatePresence>
              {items.map((item) => (
                  <motion.div key={item._id}

                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-saffron border border-saffron/6 p-4 mb-4 hover:shadow-saffron-lg transition-all">
                  <div className="grid grid-cols-[80px_1fr_auto] gap-4 items-center">
                    <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-serif font-bold text-brown-dark mb-0.5">{item.name}</div>
                      <div className="text-xs text-brown-mid/60 mb-3">Size: {item.size} · ₹{item.price} each</div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-cream-mid rounded-full px-1 py-0.5">
                          <button onClick={() => updateQty(item._id, item.qty - 1)}
                            className="w-7 h-7 rounded-full border border-saffron/40 text-saffron font-bold flex items-center justify-center hover:bg-saffron hover:text-white transition-all text-sm">−</button>
                          <span className="font-bold text-brown-dark w-5 text-center text-sm">{item.qty}</span>
                          <button onClick={() => updateQty(item._id, item.qty + 1)}
                            className="w-7 h-7 rounded-full border border-saffron/40 text-saffron font-bold flex items-center justify-center hover:bg-saffron hover:text-white transition-all text-sm">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item._id)}
                          className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                    <div className="font-bold text-saffron text-lg">
                      ₹{item.price * item.qty}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl2 shadow-saffron border border-saffron/8 p-6 sticky top-24">
            <h3 className="font-serif font-bold text-brown-dark text-xl mb-5">Order Summary</h3>

            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-brown-mid/70">Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span className="font-semibold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brown-mid/70">Delivery</span>
                <span className={`font-semibold ${effectiveShipping === 0 ? 'text-leaf' : ''}`}>
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

            {/* Promo Code */}
            {!promoApplied ? (
              <div className="flex gap-2 mb-5">
                <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Promo code" className="form-input py-2 rounded-xl text-sm flex-1" />
                <button onClick={handlePromo}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-saffron hover:bg-saffron-light transition-colors whitespace-nowrap">
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-leaf text-sm font-semibold bg-green-50 rounded-xl px-3 py-2 mb-5">
                <span>✅</span> Promo "{promoCode}" applied!
                <button onClick={() => { setPromoApplied(false); setPromoCode(''); setPromoDiscount(0); setFreeShipping(false); }}
                  className="ml-auto text-xs text-brown-mid/60 hover:text-red-500">✕</button>
              </div>
            )}

            <button onClick={() => navigate('/checkout', { state: { promoCode: promoApplied ? promoCode : '', discount: promoDiscount, freeShipping } })}
              className="w-full btn-saffron py-4 font-bold text-base mb-3">
              Proceed to Checkout →
            </button>

            <div className="text-center text-xs text-brown-mid/50">
              🔒 Secure Checkout · 📦 Fast Delivery
            </div>

            <div className="mt-3 text-center">
              <Link to="/products" className="text-xs text-saffron hover:text-saffron-light transition-colors font-medium">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
