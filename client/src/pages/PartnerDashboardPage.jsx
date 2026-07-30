import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { partnerPortalAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

const TABS = [
  { id: 'timeline', icon: '📦', label: 'Orders' },
  { id: 'order', icon: '🛒', label: 'Place Order' },
];

// Same lazy-load pattern used on CheckoutPage — only fetch Razorpay's
// script the first time it's actually needed, and reuse it if a partner
// pays a second installment in the same session.
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

// ─────────────────────────────────────────────
// PartnerDashboardPage — one unified "Orders" timeline (merging what used
// to be two separate tabs: order-request status and consignment/payment
// status), a "Place Order" catalog, online payment via Razorpay, and
// one-tap reorder from any past order.
// ─────────────────────────────────────────────
export default function PartnerDashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('timeline');

  const [profile, setProfile] = useState(null);
  const [consignments, setConsignments] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  const [payingId, setPayingId] = useState(null);

  // Cart-like local state for the "Place Order" tab: { key -> { productId, name, size, qty, partnerPrice, retailPrice } }
  const [cart, setCart] = useState({});
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([
      partnerPortalAPI.getMe(),
      partnerPortalAPI.getConsignments(),
      partnerPortalAPI.getMyOrders(),
    ])
      .then(([meRes, consignmentsRes, ordersRes]) => {
        setProfile(meRes.data.partner);
        setConsignments(consignmentsRes.data.consignments || []);
        setMyOrders(ordersRes.data.orderRequests || []);
      })
      .catch(() => toast.error('Failed to load your dashboard'))
      .finally(() => setLoading(false));
  };

  const ensureProductsLoaded = async () => {
    if (products.length > 0) return products;
    setProductsLoading(true);
    try {
      const res = await partnerPortalAPI.getProducts();
      const loaded = res.data.products || [];
      setProducts(loaded);
      return loaded;
    } catch {
      toast.error('Failed to load the product catalog');
      return [];
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'order') ensureProductsLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const totalOutstanding = consignments
    .flatMap((c) => c.payments || [])
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amountDue, 0);

  const activeConsignmentsCount = consignments.filter((c) => c.status !== 'settled').length;
  const pendingOrdersCount = myOrders.filter((o) => o.status === 'pending').length;

  // ── Razorpay payment flow ──
  const handlePay = async (payment) => {
    setPayingId(payment._id);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway.');
        setPayingId(null);
        return;
      }

      const orderRes = await partnerPortalAPI.createPaymentOrder(payment._id);
      const { order_id, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Namdev Chiwada',
        description: `${payment.installment === 'advance' ? 'Advance' : 'Final'} payment`,
        image: `${window.location.origin}/images/logo.png`,
        order_id,
        prefill: {
          name: profile?.contactPerson || user?.name || '',
          email: profile?.email || user?.email || '',
          contact: profile?.phone || '',
        },
        handler: async function (response) {
          try {
            const verifyRes = await partnerPortalAPI.verifyPayment(payment._id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              toast.success('Payment successful!');
              loadDashboard();
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setPayingId(null);
          }
        },
        modal: {
          ondismiss: () => setPayingId(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error?.description || 'Payment failed');
        setPayingId(null);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start payment.');
      setPayingId(null);
    }
  };

  // ── Place Order cart helpers ──
  const setQty = (product, sizeInfo, qty) => {
    const key = `${product._id}__${sizeInfo.weight}`;
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[key];
      } else {
        next[key] = {
          productId: product._id,
          name: product.name,
          size: sizeInfo.weight,
          qty,
          partnerPrice: sizeInfo.partnerPrice,
          retailPrice: sizeInfo.retailPrice,
        };
      }
      return next;
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.qty * i.partnerPrice, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Add at least one product to your order');
      return;
    }
    setSubmittingOrder(true);
    try {
      await partnerPortalAPI.createOrder({
        items: cartItems.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })),
        notes: orderNotes || undefined,
      });
      toast.success('Order request sent! The admin will review it shortly.');
      setCart({});
      setOrderNotes('');
      setActiveTab('timeline');
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit order request');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // ── Reorder: pre-fill the cart from a past order's items, using LIVE
  // catalog pricing (not the historical price), then jump to Place Order. ──
  const reorderFromItems = async (items) => {
    const catalog = await ensureProductsLoaded();
    if (catalog.length === 0) {
      toast.error('Could not load the catalog — try again in a moment.');
      return;
    }

    const newCart = {};
    const skipped = [];

    items.forEach((item) => {
      const productId = item.product?._id || item.product;

      // Prefer an exact id match; fall back to matching by product name
      // (case-insensitive) since many existing consignments — especially
      // ones the admin dispatched manually by typing item names — never
      // had a product id attached in the first place.
      let prod = productId ? catalog.find((p) => p._id === productId) : null;
      if (!prod) {
        prod = catalog.find((p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      }
      if (!prod) {
        skipped.push(item.name);
        return;
      }

      const sizeInfo = prod.sizes.find((s) => s.weight === item.size) || prod.sizes[0];
      if (!sizeInfo) {
        skipped.push(item.name);
        return;
      }
      const key = `${prod._id}__${sizeInfo.weight}`;
      newCart[key] = {
        productId: prod._id,
        name: prod.name,
        size: sizeInfo.weight,
        qty: item.qty,
        partnerPrice: sizeInfo.partnerPrice,
        retailPrice: sizeInfo.retailPrice,
      };
    });

    if (Object.keys(newCart).length === 0) {
      toast.error("None of this order's items are in the current catalog anymore.");
      return;
    }

    setCart(newCart);
    setActiveTab('order');
    if (skipped.length > 0) {
      toast.success(`Added what we could to your cart — skipped (no longer in catalog): ${skipped.join(', ')}`);
    } else {
      toast.success('Added to your cart at current pricing — review and submit below');
    }
  };

  const mostRecentConsignment = [...consignments].sort(
    (a, b) => new Date(b.dispatchDate) - new Date(a.dispatchDate)
  )[0];

  return (
    <PageWrapper>
      <div className="min-h-screen" style={{ background: '#fbf8e7' }}>
        {/* ── Branded hero header ── */}
        <div
          className="relative overflow-hidden px-4 sm:px-6 py-8 sm:py-10"
          style={{ background: 'linear-gradient(160deg, #2d1a00 0%, #3d1c00 55%, #4a2200 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{ background: 'radial-gradient(circle at 20% 20%, rgba(224,112,0,0.25), transparent 55%)' }}
          />
          <div className="relative max-w-5xl mx-auto flex items-start sm:items-center justify-between flex-wrap gap-3">
            <div className="min-w-0">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
                style={{ background: 'rgba(224,112,0,0.2)', color: '#f0cc5a', border: '1px solid rgba(212,175,55,0.3)' }}
              >
                ✦ Distributor Portal
              </div>
              <h1 className="font-serif font-black text-white text-xl sm:text-3xl truncate">
                {profile?.businessName || user?.name || 'Partner Dashboard'}
              </h1>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Track, pay, and reorder — all in one place
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {mostRecentConsignment && (
                <button
                  onClick={() => reorderFromItems(mostRecentConsignment.items)}
                  className="text-xs font-bold px-3 sm:px-4 py-2.5 rounded-xl transition-all"
                  style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', color: '#fff', minHeight: 40 }}
                >
                  🔁 <span className="hidden sm:inline">Reorder Last</span>
                </button>
              )}
              <button
                onClick={logout}
                className="text-xs font-bold px-3 sm:px-4 py-2.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', minHeight: 40 }}
              >
                🚪 <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          </div>

          {/* Stat cards */}
          {!loading && (
            <div className="relative max-w-5xl mx-auto grid grid-cols-3 gap-2 sm:gap-3 mt-6 sm:mt-7">
              <div className="rounded-2xl p-3 sm:p-4" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Outstanding
                </div>
                <div className="text-lg sm:text-2xl font-black" style={{ color: '#f0cc5a' }}>
                  ₹{totalOutstanding.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="rounded-2xl p-3 sm:p-4" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Active
                </div>
                <div className="text-lg sm:text-2xl font-black text-white">{activeConsignmentsCount}</div>
              </div>
              <div className="rounded-2xl p-3 sm:p-4" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Awaiting Review
                </div>
                <div className="text-lg sm:text-2xl font-black text-white">{pendingOrdersCount}</div>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-3 sm:px-6 -mt-5 relative">
          {/* Tab pills */}
          <div
            className="flex items-center gap-1 p-1.5 rounded-2xl mb-6 w-full sm:w-fit mx-auto sm:mx-0"
            style={{ background: '#fff', boxShadow: '0 6px 24px rgba(45,26,0,0.1)', border: '1px solid rgba(212,175,55,0.18)' }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="relative flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                style={{
                  color: activeTab === t.id ? '#fff' : '#7a5c3a',
                  background: activeTab === t.id ? 'linear-gradient(135deg,#e07000,#ff9010)' : 'transparent',
                  minHeight: 44,
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="pb-16">
            <AnimatePresence mode="wait">
              {activeTab === 'timeline' && (
                <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <OrdersTimeline
                    loading={loading}
                    consignments={consignments}
                    myOrders={myOrders}
                    payingId={payingId}
                    onPay={handlePay}
                    onReorder={reorderFromItems}
                  />
                </motion.div>
              )}

              {activeTab === 'order' && (
                <motion.div key="order" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <PlaceOrderPanel
                    loading={productsLoading}
                    products={products}
                    cart={cart}
                    setQty={setQty}
                    cartItems={cartItems}
                    cartTotal={cartTotal}
                    cartCount={cartCount}
                    notes={orderNotes}
                    setNotes={setOrderNotes}
                    submitting={submittingOrder}
                    onSubmit={handleSubmitOrder}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ─────────────────────────────────────────────
// Unified Orders Timeline — merges what used to be two separate tabs
// (order-request status + consignment/payment status) into one story
// per order, with a Reorder button on every past order.
// ─────────────────────────────────────────────
const PAYMENT_STAGE_CONFIG = {
  dispatched: { label: 'Dispatched', color: '#b45309', bg: '#fef3c7' },
  partially_settled: { label: 'Partially Paid', color: '#1d4ed8', bg: '#dbeafe' },
  settled: { label: 'Settled', color: '#15803d', bg: '#dcfce7' },
};

function Stepper({ steps }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1 flex-shrink-0">
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
              style={{
                background: step.state === 'done' ? '#15803d' : step.state === 'current' ? '#e07000' : step.state === 'failed' ? '#dc2626' : '#e5e0d3',
                color: step.state === 'pending' ? '#9a8b70' : '#fff',
              }}
            >
              {step.state === 'done' ? '✓' : step.state === 'failed' ? '✕' : i + 1}
            </div>
            <span
              className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
              style={{ color: step.state === 'pending' ? '#9a8b70' : '#5a4632' }}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-4 sm:w-8 h-0.5 flex-shrink-0 mb-4"
              style={{ background: step.state === 'done' ? '#15803d' : '#e5e0d3' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function buildSteps({ hasRequest, requestStatus, consignmentStatus }) {
  if (hasRequest && requestStatus === 'pending') {
    return [
      { label: 'Requested', state: 'done' },
      { label: 'Review', state: 'current' },
    ];
  }
  if (hasRequest && requestStatus === 'rejected') {
    return [
      { label: 'Requested', state: 'done' },
      { label: 'Declined', state: 'failed' },
    ];
  }

  // Either approved-with-consignment, or an ad-hoc admin dispatch with no
  // originating request at all — both continue through the same stages.
  const base = hasRequest
    ? [{ label: 'Requested', state: 'done' }, { label: 'Approved', state: 'done' }]
    : [];

  if (consignmentStatus === 'dispatched') {
    return [...base, { label: 'Dispatched', state: 'current' }, { label: 'Settled', state: 'pending' }];
  }
  if (consignmentStatus === 'partially_settled') {
    return [...base, { label: 'Dispatched', state: 'done' }, { label: 'Settled', state: 'current' }];
  }
  if (consignmentStatus === 'settled') {
    return [...base, { label: 'Dispatched', state: 'done' }, { label: 'Settled', state: 'done' }];
  }
  return [...base, { label: 'Dispatched', state: 'current' }];
}

function OrdersTimeline({ loading, consignments, myOrders, payingId, onPay, onReorder }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  const orderRequestByConsignmentId = {};
  myOrders.forEach((o) => {
    if (o.consignment) orderRequestByConsignmentId[o.consignment] = o;
  });

  // Consignment-backed items (approved requests + ad-hoc admin dispatches)
  const consignmentItems = consignments.map((c) => ({
    key: `c-${c._id}`,
    date: c.dispatchDate,
    consignment: c,
    orderRequest: orderRequestByConsignmentId[c._id] || null,
  }));

  // Order requests that never became a consignment (still pending, or declined)
  const standaloneRequestItems = myOrders
    .filter((o) => o.status !== 'approved')
    .map((o) => ({
      key: `o-${o._id}`,
      date: o.createdAt,
      consignment: null,
      orderRequest: o,
    }));

  const allItems = [...consignmentItems, ...standaloneRequestItems].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  if (allItems.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-2xl"
        style={{ background: '#fff', border: '1px dashed rgba(224,112,0,0.25)' }}
      >
        <div className="text-4xl mb-3">📦</div>
        <p className="text-brown-mid/60 text-sm">
          No orders yet — try the "Place Order" tab to request your first delivery.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allItems.map(({ key, consignment: c, orderRequest: o }) => {
        const items = c ? c.items : o.items;
        const total = c ? c.totalAmount : o.estimatedTotal;
        const isEstimate = !c;
        const orderRef = (c?._id || o?._id || '').slice(-6).toUpperCase();

        const steps = buildSteps({
          hasRequest: !!o,
          requestStatus: o?.status,
          consignmentStatus: c?.status,
        });

        return (
          <div
            key={key}
            className="bg-white rounded-2xl p-4 sm:p-5 overflow-hidden relative"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.07)', border: '1px solid rgba(224,112,0,0.1)' }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: 'linear-gradient(90deg,#e07000,#d4af37)' }}
            />

            {/* Order reference + dates */}
            <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
              <div>
                <div className="text-sm font-black text-brown-dark tracking-wide">
                  Order #{orderRef}
                </div>
                <div className="text-xs text-brown-mid/60 font-medium mt-0.5 space-y-0.5">
                  {o && (
                    <div>Requested: {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  )}
                  {c && (
                    <div>Dispatched: {new Date(c.dispatchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brown-mid/50">
                  {isEstimate ? 'Estimated Total' : 'Total'}
                </div>
                <div className="text-lg font-black text-brown-dark">
                  {isEstimate ? '~' : ''}₹{total.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <Stepper steps={steps} />
            </div>

            {/* Itemized breakdown */}
            <div className="rounded-xl overflow-hidden mb-3" style={{ border: '1px solid rgba(224,112,0,0.12)' }}>
              <div
                className="hidden sm:grid text-[10px] font-bold uppercase tracking-wider text-brown-mid/60 px-3 py-2"
                style={{ gridTemplateColumns: '1fr 90px 70px 100px', background: '#fdf6e8' }}
              >
                <span>Product</span>
                <span className="text-center">Size</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Line Total</span>
              </div>
              {items.map((item, idx) => {
                const unitPrice = c ? item.unitPrice : item.estimatedUnitPrice;
                const lineTotal = unitPrice * item.qty;
                return (
                  <div
                    key={idx}
                    className="px-3 py-2.5 text-sm"
                    style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(224,112,0,0.08)' }}
                  >
                    {/* Desktop row */}
                    <div className="hidden sm:grid items-center" style={{ gridTemplateColumns: '1fr 90px 70px 100px' }}>
                      <span className="text-brown-dark font-medium truncate pr-2">{item.name}</span>
                      <span className="text-center text-brown-mid/70">{item.size || '—'}</span>
                      <span className="text-center text-brown-mid/70">× {item.qty}</span>
                      <span className="text-right font-bold text-brown-dark">₹{lineTotal.toLocaleString('en-IN')}</span>
                    </div>
                    {/* Mobile stacked row */}
                    <div className="sm:hidden flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-brown-dark truncate">{item.name}</div>
                        <div className="text-xs text-brown-mid/60">{item.size ? `${item.size} · ` : ''}₹{unitPrice}/unit × {item.qty}</div>
                      </div>
                      <span className="font-bold text-brown-dark flex-shrink-0">₹{lineTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
              <div
                className="flex items-center justify-between px-3 py-2.5 text-sm font-black text-brown-dark"
                style={{ background: '#fdf6e8', borderTop: '1px solid rgba(224,112,0,0.12)' }}
              >
                <span>{isEstimate ? 'Estimated Total' : 'Total'}</span>
                <span>{isEstimate ? '~' : ''}₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {o?.notes && (
              <div className="text-xs text-brown-mid/60 italic mb-3 px-1">📝 "{o.notes}"</div>
            )}
            {o?.status === 'rejected' && o.rejectionReason && (
              <div className="text-xs text-red-600 mb-3 px-1 font-medium">Reason declined: {o.rejectionReason}</div>
            )}

            {/* Payment split + status */}
            {c && (c.payments || []).length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brown-mid/50 mb-2 px-1">
                  Payment Split ({c.advancePercent}% advance / {100 - c.advancePercent}% final)
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.payments.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold"
                      style={{ background: payment.status === 'paid' ? '#dcfce7' : '#fef3c7' }}
                    >
                      <span>
                        <span className="capitalize">{payment.installment}</span>: ₹
                        {payment.amountDue.toLocaleString('en-IN')} —{' '}
                        {payment.status === 'paid' ? (
                          <span className="text-green-700">
                            Paid{payment.paidDate ? ` on ${new Date(payment.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                          </span>
                        ) : (
                          <span className="text-amber-700">Pending</span>
                        )}
                      </span>
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => onPay(payment)}
                          disabled={payingId === payment._id}
                          className="px-3 py-1.5 rounded-lg font-bold text-white text-xs disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 32 }}
                        >
                          {payingId === payment._id ? 'Opening…' : 'Pay Now'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => onReorder(items)}
              className="text-xs font-bold px-4 py-2 rounded-xl border transition-all"
              style={{ borderColor: 'rgba(224,112,0,0.25)', color: '#e07000', minHeight: 36 }}
            >
              🔁 Reorder these items
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Place Order tab content — wholesale catalog + running cart summary
// ─────────────────────────────────────────────
function PlaceOrderPanel({ loading, products, cart, setQty, cartItems, cartTotal, cartCount, notes, setNotes, submitting, onSubmit }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((p) => (
          <div
            key={p._id}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 4px 16px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.1)' }}
          >
            <div className="flex gap-3 p-4">
              <img
                src={p.img}
                alt={p.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                style={{ border: '1px solid rgba(224,112,0,0.15)' }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-brown-dark text-sm truncate">{p.name}</div>
                <div
                  className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={{ background: '#fff0d6', color: '#e07000' }}
                >
                  {p.partnerDiscountPercent}% off retail
                </div>
              </div>
            </div>

            <div className="border-t border-brown-mid/10 px-4 py-3 space-y-2.5">
              {p.sizes.map((s) => {
                const key = `${p._id}__${s.weight}`;
                const qty = cart[key]?.qty || 0;
                return (
                  <div key={s.weight} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-brown-dark">{s.weight}</div>
                      <div className="text-xs">
                        <span className="font-bold" style={{ color: '#e07000' }}>₹{s.partnerPrice}</span>{' '}
                        <span className="line-through text-brown-mid/40">₹{s.retailPrice}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setQty(p, s, Math.max(0, qty - 1))}
                        className="w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center"
                        style={{ background: '#fef3e0', color: '#e07000' }}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-brown-dark">{qty}</span>
                      <button
                        onClick={() => setQty(p, s, qty + 1)}
                        className="w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center text-white"
                        style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-16 text-brown-mid/50">
            No products available to order right now.
          </div>
        )}
      </div>

      {/* Order summary — sticky on desktop, pinned to bottom of viewport on mobile so it's always reachable without scrolling back up */}
      <div
        className="bg-white rounded-2xl p-5 lg:sticky lg:top-6 sticky bottom-3 z-10 mx-auto lg:mx-0 w-full"
        style={{ boxShadow: '0 -4px 24px rgba(45,26,0,0.12), 0 6px 24px rgba(45,26,0,0.1)', border: '1px solid rgba(224,112,0,0.12)' }}
      >
        <h3 className="font-serif font-black text-brown-dark text-lg mb-3">Your Order</h3>
        {cartItems.length === 0 ? (
          <p className="text-xs text-brown-mid/50 mb-4">Add products from the catalog to build your order.</p>
        ) : (
          <div className="space-y-2 mb-4 max-h-40 sm:max-h-56 overflow-y-auto pr-1">
            {cartItems.map((i) => (
              <div key={`${i.productId}__${i.size}`} className="flex items-center justify-between text-xs">
                <span className="text-brown-dark font-medium truncate pr-2">
                  {i.name} ({i.size}) × {i.qty}
                </span>
                <span className="font-bold text-brown-dark flex-shrink-0">₹{(i.qty * i.partnerPrice).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4 pt-3" style={{ borderTop: '1px solid rgba(224,112,0,0.1)' }}>
          <span className="text-sm font-bold text-brown-mid/70">{cartCount} item{cartCount === 1 ? '' : 's'}</span>
          <span className="text-lg font-black text-brown-dark">₹{cartTotal.toLocaleString('en-IN')}</span>
        </div>

        <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any delivery preferences or comments…"
          rows={2}
          className="form-input text-sm mb-4 resize-none"
        />

        <button
          onClick={onSubmit}
          disabled={submitting || cartItems.length === 0}
          className="w-full py-3 rounded-full font-bold text-white text-sm disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 46 }}
        >
          {submitting ? 'Sending…' : '📨 Submit Order Request'}
        </button>
        <p className="text-[11px] text-brown-mid/45 mt-2 text-center">
          This sends a request to the admin — pricing and final quantities are confirmed on approval.
        </p>
      </div>
    </div>
  );
}
