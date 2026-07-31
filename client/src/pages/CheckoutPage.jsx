import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, shippingAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

// Mirrors server/utils/weight.js — parses a cart line's `size` label
// ("250g", "1kg", ...) into grams so we can warn the shopper about the
// 7kg single-shipment cap before they even reach payment. The server
// re-checks this authoritatively in orderController.placeOrder; this
// copy is UX-only.
const MAX_ORDER_WEIGHT_GRAMS = 7000;
function parseWeightToGrams(sizeLabel) {
  if (typeof sizeLabel !== 'string' || !sizeLabel.trim()) return 250;
  const match = sizeLabel.trim().toLowerCase().match(/([\d.]+)\s*(kg|g|gm|gms|grams?|kgs?)?/);
  if (!match || !match[1]) return 250;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value)) return 250;
  const isKg = (match[2] || 'g').startsWith('kg');
  return Math.round(isKg ? value * 1000 : value);
}

// ─────────────────────────────────────────────
// CheckoutPage — REFINED, not rewritten
//
// This file already had a lot of careful, hard-won fixes in it (the
// visualViewport-based keyboard detection, promo re-validation on
// arrival from Cart, the marketing-consent default logic, the
// Razorpay logo path fix). None of that is touched. What's added:
//
// 1. REAL GAP FIXED — on mobile, `.checkout-right { display: none; }`
//    hid the ENTIRE order summary below 600px width. That meant a
//    mobile shopper could not see their cart items or apply a promo
//    code anywhere on this page before paying — the only cart
//    context was the compact sticky bar's total. There's now a
//    collapsible "Order Summary" card (mobile-only, same breakpoint)
//    with item thumbnails, the promo field, and the totals
//    breakdown — an actual functional gap, not just a visual one.
// 2. Native alert() replaced with toast.error() everywhere in this
//    file — this was the one page on the site still using jarring
//    blocking browser alerts instead of the toast system already
//    used on Cart/Account/Auth pages. Especially rough on mobile,
//    where a native alert takes over the whole screen.
// 3. Razorpay checkout modal's theme color was still `#4f46e5`
//    (indigo) — left over from before the payment CARDS were
//    updated to the brand's saffron accent (see the comment already
//    in the CSS above `.payment-card`). Now `#e07000`, so the actual
//    payment modal matches the rest of the checkout instead of
//    switching to an unrelated color when it opens.
// 4. Failed validation now scrolls to and focuses the first invalid
//    field instead of just outlining it in red and leaving you to
//    hunt for it — matters most on a long mobile form.
// 5. Item thumbnails added to the order summary (desktop and the new
//    mobile version) — previously text-only.
// 6. Small entrance animation on the three main cards (Framer Motion,
//    already a project dependency) instead of the page appearing all
//    at once with zero motion — everywhere else on the site has some
//    entrance motion; this page had none.
// 7. Removed the `@import` Google Fonts line from the injected
//    <style> tag — runtime-injected @import is worse for load
//    performance than a real <link>, and the project's own
//    conventions (established during the homepage work) call for
//    fonts to be added to the single <link> in index.html instead.
//    See the note at the bottom of this comment block for the exact
//    line to add.
//
// index.html action needed: this page uses Playfair Display weights
// 600/700/900 and Lora 400/500/600. Lora isn't part of the site's
// documented font set elsewhere, so add both to your existing Google
// Fonts <link> query string:
//   family=Playfair+Display:wght@600;700;900&family=Lora:wght@400;500;600
// ─────────────────────────────────────────────

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

// Shared item-list + promo + totals-breakdown body, used by BOTH the
// desktop sticky right column and the new mobile collapsible summary,
// so the two can't quietly drift apart. Stops right before the final
// divider+Total line, since the desktop panel appends a submit
// button there and the mobile version doesn't need to duplicate one
// (the sticky bottom bar already has it).
function OrderSummaryBody({ cart, promoCode, setPromoCode, applyPromo, promoLoading, promoApplied, promoError, subtotal, discount, shipping }) {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {cart.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px',
            background: 'rgba(253,243,231,0.7)',
            borderRadius: 10,
          }}>
            {item.img && (
              <img src={item.img} alt={item.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#3d2800', fontFamily: "'Lora', serif" }}>
              <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
              <div style={{ color: '#9a7c5a', fontSize: 12 }}>{item.size ? `${item.size} · ` : ''}×{item.qty}</div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#3d2800', flexShrink: 0 }}>₹{(item.price * item.qty).toLocaleString()}</span>
          </div>
        ))}
      </div>

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
      </div>
    </>
  );
}

const styles = `
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

  /* ── Mobile-only collapsible order summary — new ── */
  .mobile-order-summary {
    display: none;
  }

  /* ── Inline field row ── */
  .field-row {
    display: flex;
    gap: 12px;
  }

  /* ── Payment cards ──
     One restrained accent (the site's saffron) instead of the mismatched
     indigo/green pairing — the two options are told apart by their icon
     and copy, not by clashing color-coded panels. */
  .payment-card {
    position: relative;
    border-radius: 16px;
    padding: 16px 18px;
    cursor: pointer;
    transition: border-color 0.18s ease, background-color 0.18s ease;
    border: 1.5px solid rgba(180,120,50,0.16);
    background: rgba(255,255,255,0.55);
  }
  .payment-card:hover {
    border-color: rgba(224,112,0,0.3);
  }
  .payment-card.selected {
    border-color: #e07000;
    background: rgba(224,112,0,0.045);
  }

  .radio-dot {
    width: 20px; height: 20px;
    border-radius: 50%; border: 1.5px solid rgba(180,120,50,0.35);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: border-color 0.18s ease;
  }
  .payment-card.selected .radio-dot { border-color: #e07000; }
  .radio-dot-inner {
    width: 9px; height: 9px;
    border-radius: 50%; transition: transform 0.18s ease; transform: scale(0);
    background: #e07000;
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
    background: rgba(224,112,0,0.07);
    border: 1px solid rgba(224,112,0,0.18);
    border-radius: 20px; padding: 3px 10px;
    font-size: 10px; font-weight: 600; color: #9a5a00;
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
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
    background: rgba(224,112,0,0.08);
    transition: background-color 0.18s ease;
  }
  .payment-card.selected .payment-icon-circle {
    background: rgba(224,112,0,0.14);
  }

  .upi-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .upi-chip {
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(180,120,50,0.15);
    border-radius: 8px; padding: 4px 10px;
    font-size: 11px; color: #7a5c3a; font-weight: 600;
    font-family: 'Lora', serif;
  }

  .payment-note {
    margin-top: 12px;
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 12px;
    font-family: 'Lora', serif;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(224,112,0,0.06);
    color: #9a5a00;
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

    /* Hide desktop order summary panel on mobile — replaced by the
       collapsible .mobile-order-summary card below */
    .checkout-right { display: none; }

    /* Show the mobile-only collapsible order summary */
    .mobile-order-summary { display: block; }

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
      transition: transform 0.2s ease, opacity 0.15s ease;
    }

    /* Hide the CTA bar while a text/select field is focused, so it
       doesn't sit on top of the on-screen keyboard and block typing */
    .mobile-cta-bar.cta-hidden {
      display: none !important;
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

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cart = [], subtotal: cartTotal = 0, clearCart } = useCart();
  const { user } = useAuth();

  const formRef = useRef(null);

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

  // Mobile-only order summary accordion — see the new
  // .mobile-order-summary card near the end of the left column.
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Hides the mobile sticky "Pay" bar whenever the on-screen keyboard
  // is actually open (detected via visualViewport, see effect below), so
  // the bar doesn't sit on top of the keyboard and block the address fields.
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Marketing opt-in. Defaults to the user's EXISTING consent status
  // (so an already-opted-in customer isn't shown an unchecked box every
  // time), but never defaults to true for someone who's never consented.
  const [marketingConsent, setMarketingConsent] = useState(
    Boolean(
      user?.marketingConsent?.email ||
      user?.marketingConsent?.sms ||
      user?.marketingConsent?.whatsapp
    )
  );

  // ── Shadowfax delivery-pincode serviceability check ──
  // `serviceability` shape: { status: 'idle'|'checking'|'ok'|'unserviceable'|'unknown' }
  // 'unknown' means the check itself failed (Shadowfax outage/etc.) — we
  // don't block checkout on that, only on a confirmed 'unserviceable'.
  const [serviceability, setServiceability] = useState({ status: 'idle' });

  useEffect(() => {
    if (!/^\d{6}$/.test(address.pincode)) {
      setServiceability({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setServiceability({ status: 'checking' });
    const timer = setTimeout(async () => {
      try {
        const res = await shippingAPI.checkPincode(address.pincode);
        if (cancelled) return;
        if (res.data.serviceable === true) {
          setServiceability({ status: 'ok' });
        } else if (res.data.serviceable === false) {
          setServiceability({ status: 'unserviceable' });
        } else {
          setServiceability({ status: 'unknown' });
        }
      } catch {
        if (!cancelled) setServiceability({ status: 'unknown' });
      }
    }, 500); // debounce while typing
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address.pincode]);

  // Total order weight (grams), used to warn about Shadowfax's 7kg
  // single-shipment limit before checkout — the server enforces this
  // authoritatively in orderController.placeOrder.
  const totalWeightGrams = cart.reduce(
    (sum, item) => sum + parseWeightToGrams(item.size) * (item.qty || 1),
    0
  );
  const overWeightLimit = totalWeightGrams > MAX_ORDER_WEIGHT_GRAMS;

  // Carry a promo applied on the Cart page forward into Checkout.
  // We don't trust the discount value passed via router state —
  // we re-validate the code against the server so a disabled/expired
  // promo doesn't silently survive the navigation.
  useEffect(() => {
    const incomingCode = location.state?.promoCode;
    if (incomingCode) {
      setPromoCode(incomingCode);
      orderAPI.validatePromo({ code: incomingCode, subtotal: cartTotal })
        .then(res => {
          setPromoApplied({ discount: res.data.discount, message: res.data.message });
        })
        .catch(() => {
          setPromoCode('');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect the on-screen keyboard via the actual viewport size rather
  // than focus/blur. Focus/blur is unreliable here: Android's system back
  // button dismisses the keyboard WITHOUT blurring the focused input (the
  // field stays focused, cursor and all), so a focusout-based check never
  // fires and the bar stays wrongly hidden. Measuring visualViewport
  // catches the keyboard closing no matter how it closes — Done button,
  // tapping away, or the back button.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return; // very old browsers: bar just stays visible, no crash

    const KEYBOARD_THRESHOLD_PX = 150;

    const handleViewportChange = () => {
      const heightDiff = window.innerHeight - vv.height;
      setKeyboardOpen(heightDiff > KEYBOARD_THRESHOLD_PX);
    };

    vv.addEventListener('resize', handleViewportChange);
    handleViewportChange();
    return () => vv.removeEventListener('resize', handleViewportChange);
  }, []);

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
    else if (serviceability.status === 'unserviceable') {
      e.pincode = "Sorry, we can't deliver to this pincode yet.";
    }
    setErrors(e);

    // Scroll to and focus the first invalid field instead of leaving
    // the person to hunt for the red-outlined one — matters most on a
    // long form on a small screen.
    const firstErrorKey = Object.keys(e)[0];
    if (firstErrorKey && formRef.current) {
      const el = formRef.current.querySelector(`[name="${firstErrorKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
    }

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
        marketingConsent,
      });
      clearCart();
      navigate(`/orders/${res.data.order._id}`, { state: { success: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleRazorpayPayment() {
    setProcessing(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error('Failed to load payment gateway.'); setProcessing(false); return; }

      const rzpRes = await api.post('/api/payment/create-order', {
        promoCode: promoApplied ? promoCode : '',
      });
      const { order_id, amount, currency } = rzpRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount, currency,
        name: 'Namdev Chiwada',
        description: 'Secure Checkout',
        // Absolute URL — Razorpay's checkout can render in a different
        // context (iframe), so a relative path doesn't always resolve.
        image: `${window.location.origin}/images/logo.png`,
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
                marketingConsent,
              });
              clearCart();
              navigate(`/orders/${orderRes.data.order._id}`, { state: { success: true, paid: true } });
            } else {
              toast.error('Payment verification failed.');
            }
          } catch { toast.error('Payment verification failed.'); }
          finally { setProcessing(false); }
        },
        prefill: { name: address.fullName, contact: address.phone, email: user?.email || '' },
        notes: { address: `${address.line1}, ${address.city}` },
        // Matches the payment cards' brand accent (saffron) instead of
        // the leftover indigo this used to be — the actual Razorpay
        // modal now looks like part of the same checkout.
        theme: { color: '#e07000' },
        modal: { ondismiss: function () { setProcessing(false); } },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error?.description || 'Payment failed');
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed.');
      setProcessing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (cart.length === 0) { toast.error('Your cart is empty.'); return; }
    if (overWeightLimit) {
      toast.error(`This order weighs ${(totalWeightGrams / 1000).toFixed(2)}kg — over our 7kg single-shipment limit. Please split it into two orders.`);
      return;
    }
    if (serviceability.status === 'checking') {
      toast.error('Still checking delivery availability for your pincode — try again in a moment.');
      return;
    }
    if (paymentMethod === 'cod') {
      await placeCODOrder();
    } else {
      await handleRazorpayPayment();
    }
  }

  if (cart.length === 0) {
    return (
      <PageWrapper>
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
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
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
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              {['🚚 Fast Dispatch', '🔒 Secure Payments', '💯 Quality Assured'].map((t) => (
                <span key={t} style={{ fontSize: 11, color: '#9a5a00', fontWeight: 600, fontFamily: "'Lora', serif" }}>{t}</span>
              ))}
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="checkout-grid">

              {/* LEFT COLUMN */}
              <div className="checkout-left">

                {/* Delivery Address */}
                <motion.div className="card-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
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

                    {/* Shadowfax delivery-pincode serviceability status */}
                    {/^\d{6}$/.test(address.pincode) && !errors.pincode && (
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: -6 }}>
                        {serviceability.status === 'checking' && (
                          <span style={{ color: '#9a7c5a' }}>⏳ Checking delivery availability…</span>
                        )}
                        {serviceability.status === 'ok' && (
                          <span style={{ color: '#15803d' }}>✅ Delivery available to this pincode</span>
                        )}
                        {serviceability.status === 'unserviceable' && (
                          <span style={{ color: '#dc2626' }}>🚫 We currently can't deliver to this pincode</span>
                        )}
                        {serviceability.status === 'unknown' && (
                          <span style={{ color: '#9a7c5a' }}>⚠️ Couldn't verify delivery availability — you can still continue</span>
                        )}
                      </div>
                    )}

                    <select name="state" value={address.state} onChange={handleAddressChange} className="state-select">
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>

                    {overWeightLimit && (
                      <div style={{
                        background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
                        borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600,
                      }}>
                        ⚠️ This order weighs {(totalWeightGrams / 1000).toFixed(2)}kg, over our 7kg single-shipment limit. Please split it into two orders.
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Payment Method */}
                <motion.div className="card-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
                  <div className="section-title">
                    <span style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #eceafd, #ded9fb)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>💳</span>
                    Payment Method
                    <span className="badge-secure">🔒 Secure</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Online Payment Card */}
                    <div
                      className={`payment-card ${paymentMethod === 'razorpay' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('razorpay')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="payment-icon-circle">
                          <span style={{ fontSize: 19 }}>⚡</span>
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

                        <div className="radio-dot">
                          <div className={`radio-dot-inner ${paymentMethod === 'razorpay' ? 'visible' : ''}`} />
                        </div>
                      </div>

                      <div className="upi-chips">
                        {['🏦 Net Banking', '💳 Credit/Debit', '📱 UPI', '👛 Wallets'].map(chip => (
                          <span key={chip} className="upi-chip">{chip}</span>
                        ))}
                      </div>

                      {paymentMethod === 'razorpay' && (
                        <div className="payment-note">
                          🔒 Secured by Razorpay — 256-bit SSL encrypted
                        </div>
                      )}
                    </div>

                    {/* COD Card */}
                    <div
                      className={`payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="payment-icon-circle">
                          <span style={{ fontSize: 19 }}>💵</span>
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

                        <div className="radio-dot">
                          <div className={`radio-dot-inner ${paymentMethod === 'cod' ? 'visible' : ''}`} />
                        </div>
                      </div>

                      {paymentMethod === 'cod' && (
                        <div className="payment-note">
                          ✅ No advance payment needed — pay on delivery
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Extra space at bottom so COD card clears the sticky mobile CTA bar */}
                  <div style={{ height: 8 }} />
                </motion.div>

                {/* Marketing Consent */}
                <motion.div className="card-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      style={{ marginTop: 3, width: 16, height: 16, accentColor: '#e07000', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, color: '#7a5c3a', fontFamily: "'Lora', serif", lineHeight: 1.5 }}>
                      Send me order updates and offers via WhatsApp, SMS, and email. You can turn this off anytime from your account.
                    </span>
                  </label>
                </motion.div>

                {/* Mobile-only collapsible Order Summary — NEW, fixes the
                    gap where mobile shoppers previously couldn't see their
                    items or apply a promo code anywhere on this page. */}
                <div className="card-panel mobile-order-summary">
                  <button
                    type="button"
                    onClick={() => setMobileSummaryOpen((v) => !v)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <div className="section-title" style={{ marginBottom: 0 }}>
                      <span style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fff0dc, #ffe0b0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>🧾</span>
                      Order Summary
                      <span style={{ fontSize: 12, color: '#9a7c5a', fontWeight: 600 }}>
                        ({cart.length} item{cart.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <span style={{
                      fontSize: 20, color: '#9a5a00',
                      transform: mobileSummaryOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}>⌄</span>
                  </button>

                  <AnimatePresence initial={false}>
                    {mobileSummaryOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ marginTop: 16 }}>
                          <OrderSummaryBody
                            cart={cart}
                            promoCode={promoCode}
                            setPromoCode={setPromoCode}
                            applyPromo={applyPromo}
                            promoLoading={promoLoading}
                            promoApplied={promoApplied}
                            promoError={promoError}
                            subtotal={subtotal}
                            discount={discount}
                            shipping={shipping}
                          />
                          <div className="divider-line" />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 16, color: '#3d2800' }}>Total</span>
                            <span style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 16, color: '#e07000' }}>₹{total.toLocaleString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT COLUMN — Order Summary (desktop) */}
              <div className="checkout-right">
                <motion.div className="card-panel" style={{ position: 'sticky', top: 24 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
                  <div className="section-title">
                    <span style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fff0dc, #ffe0b0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>🧾</span>
                    Order Summary
                  </div>

                  <OrderSummaryBody
                    cart={cart}
                    promoCode={promoCode}
                    setPromoCode={setPromoCode}
                    applyPromo={applyPromo}
                    promoLoading={promoLoading}
                    promoApplied={promoApplied}
                    promoError={promoError}
                    subtotal={subtotal}
                    discount={discount}
                    shipping={shipping}
                  />

                  <div className="divider-line" />

                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', color: '#3d2800', marginBottom: 20,
                  }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 18 }}>Total</span>
                    <span style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 18, color: '#e07000', letterSpacing: '0.01em' }}>₹{total.toLocaleString()}</span>
                  </div>

                  <button type="submit" className="submit-btn" disabled={processing || overWeightLimit || serviceability.status === 'unserviceable'}>
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
                </motion.div>
              </div>

            </div>

            {/* Mobile sticky CTA bar — shown only on mobile via CSS.
                Hidden while a text/select field is focused so it doesn't
                sit on top of the on-screen keyboard while typing. */}
            <div className={`mobile-cta-bar${keyboardOpen ? ' cta-hidden' : ''}`}>
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
              <button type="submit" className="submit-btn" disabled={processing || overWeightLimit || serviceability.status === 'unserviceable'}>
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
    </PageWrapper>
  );
}

export default CheckoutPage;