import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import api from '../services/api';

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
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

function Field({ label, name, type = 'text', placeholder, half, value, onChange, error }) {
  return (
    <div className={half ? 'flex-1 min-w-0' : 'w-full'}>
      <label style={{
        display: 'block',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#7a5c3a',
        marginBottom: '6px',
        fontFamily: "'Playfair Display', Georgia, serif",
      }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '12px',
          border: error ? '1.5px solid #e05555' : '1.5px solid rgba(180,120,50,0.2)',
          background: error ? 'rgba(255,80,80,0.04)' : 'rgba(255,255,255,0.8)',
          color: '#3d2800',
          fontSize: '14px',
          outline: 'none',
          transition: 'all 0.2s',
          fontFamily: "'Lora', Georgia, serif",
          boxSizing: 'border-box',
          backdropFilter: 'blur(4px)',
        }}
        onFocus={e => {
          e.target.style.border = '1.5px solid #e07000';
          e.target.style.boxShadow = '0 0 0 3px rgba(224,112,0,0.12)';
          e.target.style.background = 'rgba(255,255,255,0.95)';
        }}
        onBlur={e => {
          e.target.style.border = error ? '1.5px solid #e05555' : '1.5px solid rgba(180,120,50,0.2)';
          e.target.style.boxShadow = 'none';
          e.target.style.background = error ? 'rgba(255,80,80,0.04)' : 'rgba(255,255,255,0.8)';
        }}
      />
      {error && (
        <p style={{ color: '#e05555', fontSize: '11px', marginTop: '4px', fontFamily: "'Lora', serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=Lora:wght@400;500;600&display=swap');

  * { box-sizing: border-box; }

  .checkout-bg {
    min-height: 100vh;
    background-color: #fdf3e7;
    background-image:
      radial-gradient(ellipse at 20% 10%, rgba(224,112,0,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 90%, rgba(180,100,20,0.05) 0%, transparent 50%),
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c87820' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    padding-bottom: 100px;
    font-family: 'Lora', Georgia, serif;
  }

  /* ── Two-column desktop layout ── */
  .checkout-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 28px;
    align-items: start;
  }

  .checkout-left  { display: flex; flex-direction: column; gap: 24px; }
  .checkout-right { position: sticky; top: 24px; }

  /* ── Mobile sticky CTA bar ── */
  .mobile-cta-bar {
    display: none;
  }

  /* ── Inline field row ── */
  .field-row {
    display: flex;
    gap: 12px;
  }

  /* ── Payment cards ── */
  .payment-card {
    position: relative;
    border-radius: 20px;
    padding: 20px 22px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 2px solid transparent;
    overflow: hidden;
  }
  .payment-card:hover { transform: translateY(-2px); }

  .payment-card.online {
    background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%);
    border-color: rgba(224,112,0,0.15);
    box-shadow: 0 4px 24px rgba(224,112,0,0.08);
  }
  .payment-card.online.selected {
    border-color: #e07000;
    background: linear-gradient(135deg, #fff4e6 0%, #ffecda 100%);
    box-shadow: 0 8px 32px rgba(224,112,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8);
    transform: translateY(-3px);
  }
  .payment-card.cod {
    background: linear-gradient(135deg, #f0fff8 0%, #e6faf2 100%);
    border-color: rgba(30,160,100,0.15);
    box-shadow: 0 4px 24px rgba(30,160,100,0.06);
  }
  .payment-card.cod.selected {
    border-color: #1ea064;
    background: linear-gradient(135deg, #e6faf2 0%, #d6f5e8 100%);
    box-shadow: 0 8px 32px rgba(30,160,100,0.18), inset 0 1px 0 rgba(255,255,255,0.8);
    transform: translateY(-3px);
  }

  .radio-dot {
    width: 22px; height: 22px;
    border-radius: 50%; border: 2px solid;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.25s;
  }
  .radio-dot-inner {
    width: 10px; height: 10px;
    border-radius: 50%; transition: all 0.25s; transform: scale(0);
  }
  .radio-dot-inner.visible { transform: scale(1); }

  .submit-btn {
    width: 100%; padding: 16px;
    border-radius: 50px; border: none;
    font-weight: 700; font-size: 16px; color: white;
    cursor: pointer;
    background: linear-gradient(135deg, #e07000, #ff9010);
    box-shadow: 0 8px 24px rgba(224,112,0,0.35);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    font-family: 'Lora', Georgia, serif;
    letter-spacing: 0.01em;
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 12px 32px rgba(224,112,0,0.45);
  }
  .submit-btn:active:not(:disabled) { transform: scale(0.98); }
  .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .card-panel {
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 24px; padding: 28px;
    box-shadow: 0 2px 32px rgba(120,70,0,0.07), 0 1px 0 rgba(255,255,255,0.9) inset;
    border: 1px solid rgba(224,160,80,0.12);
  }

  .section-title {
    font-family: 'Playfair Display', serif;
    font-weight: 700; color: #3d2800; font-size: 18px;
    margin-bottom: 20px;
    display: flex; align-items: center; gap: 10px;
  }

  .badge-secure {
    display: inline-flex; align-items: center; gap: 4px;
    background: linear-gradient(135deg, rgba(224,112,0,0.1), rgba(255,144,16,0.08));
    border: 1px solid rgba(224,112,0,0.2);
    border-radius: 20px; padding: 3px 10px;
    font-size: 10px; font-weight: 600; color: #c06000;
    letter-spacing: 0.05em; text-transform: uppercase;
  }

  .divider-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(180,120,50,0.15), transparent);
    margin: 16px 0;
  }

  .promo-input {
    flex: 1; padding: 12px 16px;
    border-radius: 12px 0 0 12px;
    border: 1.5px solid rgba(180,120,50,0.2); border-right: none;
    background: rgba(255,255,255,0.8);
    font-family: 'Lora', serif; font-size: 14px; color: #3d2800; outline: none;
  }
  .promo-btn {
    padding: 12px 18px;
    border-radius: 0 12px 12px 0;
    border: 1.5px solid #e07000;
    background: linear-gradient(135deg, #e07000, #ff9010);
    color: white; font-weight: 700; font-size: 13px;
    cursor: pointer; font-family: 'Playfair Display', serif;
    transition: all 0.2s; white-space: nowrap;
  }
  .promo-btn:hover { filter: brightness(1.08); }

  select.state-select {
    width: 100%; padding: 12px 16px;
    border-radius: 12px;
    border: 1.5px solid rgba(180,120,50,0.2);
    background: rgba(255,255,255,0.8);
    color: #3d2800; font-size: 14px;
    font-family: 'Lora', serif; outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23c07030' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center;
    cursor: pointer;
  }

  .payment-icon-circle {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }

  .upi-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .upi-chip {
    background: rgba(255,255,255,0.9);
    border: 1px solid rgba(180,120,50,0.15);
    border-radius: 8px; padding: 4px 10px;
    font-size: 11px; color: #7a5c3a; font-weight: 600;
    font-family: 'Lora', serif;
  }

  .empty-cart-wrap {
    min-height: 100vh; background-color: #fdf3e7;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; padding: 24px; font-family: 'Lora', serif;
  }

  /* ────────────────────────────
     TABLET  (≤ 900px)
  ──────────────────────────── */
  @media (max-width: 900px) {
    .checkout-grid {
      grid-template-columns: 1fr;
    }
    .checkout-right {
      position: static;
    }
  }

  /* ────────────────────────────
     MOBILE  (≤ 600px)
  ──────────────────────────── */
  @media (max-width: 600px) {
    .checkout-bg {
      padding-bottom: 120px; /* room for sticky bar */
    }

    .checkout-header {
      padding-top: 20px !important;
      margin-bottom: 20px !important;
    }

    .checkout-header h1 {
      font-size: 1.6rem !important;
    }

    .card-panel {
      border-radius: 18px;
      padding: 20px 16px;
    }

    .section-title {
      font-size: 16px;
      margin-bottom: 16px;
    }

    /* Stack name+phone vertically on mobile */
    .field-row-wrap {
      flex-direction: column !important;
    }

    /* Keep city+pincode side by side — they're short */
    .field-row-city { flex-direction: row !important; }

    .payment-card {
      padding: 16px 16px;
      border-radius: 16px;
    }

    .payment-icon-circle {
      width: 38px; height: 38px; font-size: 18px;
    }

    /* Hide desktop order summary panel on mobile */
    .checkout-right { display: none; }

    /* Extra bottom padding so sticky CTA bar doesn't cover last card */
    .checkout-bg { padding-bottom: 160px !important; }

    /* Show mobile sticky CTA bar */
    .mobile-cta-bar {
      display: flex;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 100;
      background: rgba(253,243,231,0.97);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid rgba(224,160,80,0.18);
      padding: 14px 16px 20px;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 -8px 32px rgba(120,70,0,0.1);
    }

    .mobile-cta-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .submit-btn {
      padding: 15px;
      font-size: 15px;
    }
  }
`;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items: cart = [], subtotal: cartTotal = 0, clearCart } = useCart();
  const { user } = useAuth();

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '', line2: '', city: '',
    state: 'Maharashtra', pincode: '',
  });

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const handleAddressChange = useCallback((e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  }, []);

  const subtotal = cartTotal;
  const discount = promoApplied?.discount || 0;
  const shipping = subtotal >= 499 ? 0 : 49;
  const total = Math.max(0, subtotal - discount + shipping);

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
      alert(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleRazorpayPayment() {
    setProcessing(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { alert('Failed to load payment gateway.'); setProcessing(false); return; }

      const rzpRes = await api.post('/api/payment/create-order', { amount: total });
      const { order_id, amount, currency } = rzpRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount, currency,
        name: 'Namdev Chiwada',
        description: 'Secure Checkout',
        image: '/logo.png',
        order_id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              const orderRes = await orderAPI.place({
                shippingAddress: address,
                paymentMethod: 'ONLINE',
                paymentStatus: 'paid',
                promoCode: promoApplied ? promoCode : '',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
              });
              clearCart();
              navigate(`/orders/${orderRes.data.order._id}`, { state: { success: true, paid: true } });
            } else {
              alert('Payment verification failed.');
            }
          } catch { alert('Payment verification failed.'); }
          finally { setProcessing(false); }
        },
        prefill: { name: address.fullName, contact: address.phone, email: user?.email || '' },
        notes: { address: `${address.line1}, ${address.city}` },
        theme: { color: '#e07000' },
        modal: { ondismiss: function () { setProcessing(false); } },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(response.error?.description || 'Payment failed');
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed.');
      setProcessing(false);
    }
  }

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

  if (cart.length === 0) {
    return (
      <>
        <style>{styles}</style>
        <div className="empty-cart-wrap">
          <div style={{ fontSize: 64 }}>🛒</div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#3d2800', fontSize: 22 }}>
            Your cart is empty
          </p>
          <button
            onClick={() => navigate('/products')}
            style={{
              padding: '14px 32px', borderRadius: 50, fontWeight: 700,
              color: 'white', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#e07000,#ff9010)',
              fontFamily: "'Playfair Display', serif", fontSize: 15,
              boxShadow: '0 8px 24px rgba(224,112,0,0.3)',
            }}
          >
            Browse Products
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="checkout-bg">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 16px 0' }}>

          {/* Header */}
          <div className="checkout-header" style={{ marginBottom: 32 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
              color: '#3d2800',
              fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Checkout
            </h1>
            <p style={{ color: '#9a7c5a', fontSize: 14, marginTop: 6, fontFamily: "'Lora', serif" }}>
              You're just one step away from deliciousness 🌿
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="checkout-grid">

              {/* LEFT COLUMN */}
              <div className="checkout-left">

                {/* Delivery Address */}
                <div className="card-panel">
                  <div className="section-title">
                    <span style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fff0dc, #ffe0b0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>📍</span>
                    Delivery Address
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="field-row field-row-wrap" style={{ display: 'flex', gap: 12 }}>
                      <Field label="Full Name" name="fullName" half value={address.fullName} onChange={handleAddressChange} placeholder="Aditya" error={errors.fullName} />
                      <Field label="Phone" name="phone" type="tel" half value={address.phone} onChange={handleAddressChange} placeholder="9876543210" error={errors.phone} />
                    </div>
                    <Field label="Address Line 1" name="line1" value={address.line1} onChange={handleAddressChange} placeholder="House no, street" error={errors.line1} />
                    <Field label="Address Line 2 (Optional)" name="line2" value={address.line2} onChange={handleAddressChange} placeholder="Landmark, area" />
                    <div className="field-row field-row-city" style={{ display: 'flex', gap: 12 }}>
                      <Field label="City" name="city" half value={address.city} onChange={handleAddressChange} placeholder="Solapur" error={errors.city} />
                      <Field label="Pincode" name="pincode" half value={address.pincode} onChange={handleAddressChange} placeholder="413001" error={errors.pincode} />
                    </div>
                    <select name="state" value={address.state} onChange={handleAddressChange} className="state-select">
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="card-panel">
                  <div className="section-title">
                    <span style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fff0dc, #ffe0b0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>💳</span>
                    Payment Method
                    <span className="badge-secure">🔒 Secure</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Online Payment Card */}
                    <div
                      className={`payment-card online ${paymentMethod === 'razorpay' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('razorpay')}
                    >
                      {paymentMethod === 'razorpay' && (
                        <div style={{
                          position: 'absolute', top: 0, right: 0,
                          background: 'linear-gradient(135deg, #e07000, #ff9010)',
                          borderRadius: '0 18px 0 14px',
                          padding: '4px 12px',
                          fontSize: 10, fontWeight: 700,
                          color: 'white', letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          fontFamily: "'Playfair Display', serif",
                        }}>
                          Selected ✓
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="payment-icon-circle" style={{
                          background: paymentMethod === 'razorpay'
                            ? 'linear-gradient(135deg, #e07000, #ff9010)'
                            : 'linear-gradient(135deg, #fff0dc, #ffe8c0)',
                        }}>
                          <span style={{ fontSize: 22 }}>⚡</span>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: "'Playfair Display', serif",
                            fontWeight: 700,
                            fontSize: 16,
                            color: '#3d2800',
                            marginBottom: 2,
                          }}>
                            Pay Online
                          </div>
                          <div style={{ fontSize: 12, color: '#9a7c5a', fontFamily: "'Lora', serif" }}>
                            UPI, Cards, Net Banking, Wallets
                          </div>
                        </div>

                        <div className="radio-dot" style={{
                          borderColor: paymentMethod === 'razorpay' ? '#e07000' : 'rgba(180,120,50,0.3)',
                          background: paymentMethod === 'razorpay' ? 'rgba(224,112,0,0.08)' : 'transparent',
                        }}>
                          <div className={`radio-dot-inner ${paymentMethod === 'razorpay' ? 'visible' : ''}`}
                            style={{ background: '#e07000' }} />
                        </div>
                      </div>

                      <div className="upi-chips" style={{ marginTop: 12 }}>
                        {['🏦 Net Banking', '💳 Credit/Debit', '📱 UPI', '👛 Wallets'].map(chip => (
                          <span key={chip} className="upi-chip">{chip}</span>
                        ))}
                      </div>

                      {paymentMethod === 'razorpay' && (
                        <div style={{
                          marginTop: 12,
                          padding: '10px 14px',
                          background: 'rgba(224,112,0,0.06)',
                          borderRadius: 10,
                          fontSize: 12,
                          color: '#c06000',
                          fontFamily: "'Lora', serif",
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          🔒 Secured by Razorpay — 256-bit SSL encrypted
                        </div>
                      )}
                    </div>

                    {/* COD Card */}
                    <div
                      className={`payment-card cod ${paymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      {paymentMethod === 'cod' && (
                        <div style={{
                          position: 'absolute', top: 0, right: 0,
                          background: 'linear-gradient(135deg, #1ea064, #2ec87a)',
                          borderRadius: '0 18px 0 14px',
                          padding: '4px 12px',
                          fontSize: 10, fontWeight: 700,
                          color: 'white', letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          fontFamily: "'Playfair Display', serif",
                        }}>
                          Selected ✓
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="payment-icon-circle" style={{
                          background: paymentMethod === 'cod'
                            ? 'linear-gradient(135deg, #1ea064, #2ec87a)'
                            : 'linear-gradient(135deg, #e6faf2, #c8f0e0)',
                        }}>
                          <span style={{ fontSize: 22 }}>💵</span>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: "'Playfair Display', serif",
                            fontWeight: 700,
                            fontSize: 16,
                            color: '#3d2800',
                            marginBottom: 2,
                          }}>
                            Cash on Delivery
                          </div>
                          <div style={{ fontSize: 12, color: '#9a7c5a', fontFamily: "'Lora', serif" }}>
                            Pay when your order arrives at your door
                          </div>
                        </div>

                        <div className="radio-dot" style={{
                          borderColor: paymentMethod === 'cod' ? '#1ea064' : 'rgba(30,160,100,0.3)',
                          background: paymentMethod === 'cod' ? 'rgba(30,160,100,0.08)' : 'transparent',
                        }}>
                          <div className={`radio-dot-inner ${paymentMethod === 'cod' ? 'visible' : ''}`}
                            style={{ background: '#1ea064' }} />
                        </div>
                      </div>

                      {paymentMethod === 'cod' && (
                        <div style={{
                          marginTop: 12,
                          padding: '10px 14px',
                          background: 'rgba(30,160,100,0.06)',
                          borderRadius: 10,
                          fontSize: 12,
                          color: '#1a8050',
                          fontFamily: "'Lora', serif",
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          ✅ No advance payment needed — pay on delivery
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Extra space at bottom so COD card clears the sticky mobile CTA bar */}
                  <div style={{ height: 8 }} />
                </div>
              </div>

              {/* RIGHT COLUMN — Order Summary */}
              <div className="checkout-right">
                <div className="card-panel" style={{ position: 'sticky', top: 24 }}>
                  <div className="section-title">
                    <span style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fff0dc, #ffe0b0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>🧾</span>
                    Order Summary
                  </div>

                  {/* Cart items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {cart.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', padding: '8px 12px',
                        background: 'rgba(253,243,231,0.7)',
                        borderRadius: 10,
                        fontSize: 13, color: '#3d2800',
                        fontFamily: "'Lora', serif",
                      }}>
                        <span>
                          <span style={{ fontWeight: 600 }}>{item.name}</span>
                          <span style={{ color: '#9a7c5a', marginLeft: 4 }}>×{item.qty}</span>
                        </span>
                        <span style={{ fontWeight: 700 }}>₹{(item.price * item.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Promo code */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: '#7a5c3a',
                      fontFamily: "'Playfair Display', serif",
                      display: 'block', marginBottom: 6,
                    }}>
                      Promo Code
                    </label>
                    <div style={{ display: 'flex' }}>
                      <input
                        className="promo-input"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                      />
                      <button type="button" className="promo-btn" onClick={applyPromo} disabled={promoLoading}>
                        {promoLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promoApplied && (
                      <p style={{ color: '#1ea064', fontSize: 12, marginTop: 6, fontFamily: "'Lora', serif" }}>
                        🎉 {promoApplied.message}
                      </p>
                    )}
                    {promoError && (
                      <p style={{ color: '#e05555', fontSize: 12, marginTop: 6, fontFamily: "'Lora', serif" }}>
                        {promoError}
                      </p>
                    )}
                  </div>

                  <div className="divider-line" />

                  {/* Totals */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7a5c3a', fontFamily: "'Lora', serif" }}>
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#1ea064', fontFamily: "'Lora', serif" }}>
                        <span>Discount 🎁</span>
                        <span>-₹{discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7a5c3a', fontFamily: "'Lora', serif" }}>
                      <span>Shipping</span>
                      <span style={{ color: shipping === 0 ? '#1ea064' : 'inherit', fontWeight: shipping === 0 ? 700 : 400 }}>
                        {shipping === 0 ? '🚚 FREE' : `₹${shipping}`}
                      </span>
                    </div>
                    {subtotal < 499 && (
                      <div style={{
                        fontSize: 11, color: '#c07030', fontFamily: "'Lora', serif",
                        background: 'rgba(224,112,0,0.06)',
                        borderRadius: 8, padding: '6px 10px',
                        textAlign: 'center',
                      }}>
                        Add ₹{499 - subtotal} more for FREE delivery!
                      </div>
                    )}

                    <div className="divider-line" />

                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', color: '#3d2800',
                    }}>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 18 }}>Total</span>
                      <span style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 18, color: '#e07000', letterSpacing: '0.01em' }}>₹{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={processing}>
                    {processing
                      ? '⏳ Processing...'
                      : paymentMethod === 'razorpay'
                        ? `⚡ Pay ₹${total.toLocaleString()}`
                        : `📦 Place Order — ₹${total.toLocaleString()}`}
                  </button>

                  <div style={{
                    marginTop: 14,
                    textAlign: 'center',
                    fontSize: 11,
                    color: '#b09070',
                    fontFamily: "'Lora', serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}>
                    🔒 Safe & Secure Checkout
                  </div>
                </div>
              </div>

            </div>

            {/* Mobile sticky CTA bar — shown only on mobile via CSS */}
            <div className="mobile-cta-bar">
              <div className="mobile-cta-total">
                <div>
                  <div style={{ fontSize: 11, color: '#9a7c5a', fontFamily: "'Lora', serif", marginBottom: 1 }}>
                    {cart.length} item{cart.length !== 1 ? 's' : ''} · {shipping === 0 ? '🚚 Free delivery' : `₹${shipping} shipping`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 15, color: '#3d2800' }}>Total</span>
                    <span style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 20, color: '#e07000' }}>₹{total.toLocaleString()}</span>
                  </div>
                </div>

              </div>
              <button type="submit" className="submit-btn" disabled={processing}>
                {processing
                  ? '⏳ Processing...'
                  : paymentMethod === 'razorpay'
                    ? `⚡ Pay ₹${total.toLocaleString()}`
                    : `📦 Place Order — ₹${total.toLocaleString()}`}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
