import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import PageWrapper from '../../components/PageWrapper';
import CaseStepper from '../../components/b2b/CaseStepper';
import B2BModal from '../../components/b2b/B2BModal';
import B2BStatusBadge from '../../components/b2b/B2BStatusBadge';
import Money from '../../components/b2b/Money';
import { useAuth } from '../../context/AuthContext';
import { useB2B } from '../../context/B2BContext';
import api, { b2bAPI } from '../../services/api';
import { SITE_NAME } from '../../config/seo.config';

function draftKey(userId) { return `nc_b2b_draft_${userId}`; }

// Same idempotent loader as CheckoutPage.jsx's own local copy - small
// enough (and framework-loading, not business logic) that duplicating it
// here beats adding a shared util both pages would need to import.
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

export default function B2BQuickOrderPage() {
  const { user } = useAuth();
  const { business, creditSummary, config, refresh } = useB2B();
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [draft, setDraft] = useState({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteErrors, setQuoteErrors] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [shippingAddressId, setShippingAddressId] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return;
    try {
      const raw = localStorage.getItem(draftKey(user._id));
      if (raw) setDraft(JSON.parse(raw));
    } catch { /* ignore corrupt draft */ }
    setDraftLoaded(true);
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id || !draftLoaded) return;
    try { localStorage.setItem(draftKey(user._id), JSON.stringify(draft)); } catch { /* storage may be unavailable */ }
  }, [draft, user?._id, draftLoaded]);

  useEffect(() => {
    b2bAPI.getCatalog()
      .then((res) => setCatalog(res.data.catalog))
      .catch(() => setCatalogError(true))
      .finally(() => setCatalogLoading(false));
  }, []);

  const isDeliverable = useCallback((addr) => config?.allowedStateCodes?.includes(addr.stateCode), [config]);
  const deliverableAddresses = useMemo(
    () => (business?.shippingAddresses || []).filter(isDeliverable),
    [business, isDeliverable]
  );

  useEffect(() => {
    if (shippingAddressId || deliverableAddresses.length === 0) return;
    const def = deliverableAddresses.find((a) => a.isDefault) || deliverableAddresses[0];
    setShippingAddressId(String(def._id));
  }, [deliverableAddresses, shippingAddressId]);

  const items = useMemo(
    () => Object.entries(draft).filter(([, cases]) => cases > 0).map(([catalogItemId, cases]) => ({ catalogItemId, cases })),
    [draft]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (items.length === 0 || !shippingAddressId) { setQuote(null); setQuoteErrors(null); return; }

    setQuoting(true);
    debounceRef.current = setTimeout(() => {
      b2bAPI.quoteOrder({ items, shippingAddressId })
        .then((res) => { setQuote(res.data.quote); setQuoteErrors(null); })
        .catch((err) => {
          setQuote(null);
          setQuoteErrors(err.response?.data?.errors || [{ message: err.response?.data?.message || 'Could not price this order.' }]);
        })
        .finally(() => setQuoting(false));
    }, 400);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items), shippingAddressId]);

  const setCases = (catalogItemId, cases) => {
    setDraft((d) => {
      const next = { ...d };
      if (cases <= 0) delete next[catalogItemId];
      else next[catalogItemId] = cases;
      return next;
    });
  };

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of catalog) {
      const key = item.product._id;
      if (!map.has(key)) map.set(key, { product: item.product, items: [] });
      map.get(key).items.push(item);
    }
    return Array.from(map.values());
  }, [catalog]);

  const rowError = (item) => quoteErrors?.find((e) => e.message?.includes(item.product.name));
  const nonRowErrors = quoteErrors?.filter((e) => !catalog.some((c) => e.message?.includes(c.product.name))) || [];

  const totalCases = items.reduce((sum, i) => sum + i.cases, 0);
  const totalUnits = quote?.lines?.reduce((sum, l) => sum + l.units, 0) || 0;
  const minOrderValue = config?.minOrderValue || 0;
  const progress = minOrderValue > 0 ? Math.min(100, ((quote?.subtotal || 0) / minOrderValue) * 100) : 100;

  const onOrderPlaced = (order) => {
    if (user?._id) { try { localStorage.removeItem(draftKey(user._id)); } catch { /* ignore */ } }
    setDraft({});
    toast.success('Order placed!');
    refresh();
    navigate(`/b2b/orders/${order._id}`);
  };

  // 0%-advance accounts (pure credit) place directly, same as before -
  // nothing to charge, so no Razorpay involved at all.
  const placeOrderDirect = async () => {
    setPlacing(true);
    try {
      const res = await b2bAPI.placeOrder({ items, shippingAddressId, buyerNotes: buyerNotes || undefined });
      onOrderPlaced(res.data.order);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place order');
      if (Array.isArray(err.response?.data?.errors)) setQuoteErrors(err.response.data.errors);
    } finally {
      setPlacing(false);
      setConfirmOpen(false);
    }
  };

  // Mirrors CheckoutPage.jsx's handleRazorpayPayment: create a Razorpay
  // order for the ADVANCE only, open Checkout, verify via the existing
  // (unchanged) /api/payment/verify, then place the order with proof of
  // that verified payment attached.
  const payAdvanceAndPlaceOrder = async () => {
    setPlacing(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error('Failed to load payment gateway.'); setPlacing(false); return; }

      const payRes = await b2bAPI.createAdvancePaymentOrder({ items, shippingAddressId });
      const { order_id, amount, currency } = payRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount, currency,
        name: SITE_NAME,
        description: `Advance payment — ${business.businessName}`,
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
              const res = await b2bAPI.placeOrder({
                items, shippingAddressId, buyerNotes: buyerNotes || undefined,
                razorpayOrderId: response.razorpay_order_id,
              });
              onOrderPlaced(res.data.order);
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setPlacing(false);
          }
        },
        prefill: {
          name: business.contactName || user?.name || '',
          contact: business.phone || '',
          email: business.email || user?.email || '',
        },
        notes: { business: business.businessName },
        theme: { color: '#e07000' },
        modal: { ondismiss: function () { setPlacing(false); } },
      };

      // Hand off to Razorpay's own modal now, rather than after
      // success/failure — stacking our confirm dialog behind theirs would
      // just be confusing. Dismissing Razorpay's popup leaves the user on
      // the main Quick Order page, free to reopen "Review & place order".
      setConfirmOpen(false);

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error?.description || 'Payment failed');
        setPlacing(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start payment.');
      setPlacing(false);
    }
  };

  const submitOrder = () => (quote?.advanceAmount > 0 ? payAdvanceAndPlaceOrder() : placeOrderDirect());

  if (business === undefined) return null;
  if (business === null || business.status !== 'approved') {
    return (
      <PageWrapper>
        <div className="card p-6 sm:p-8 text-center max-w-md mx-auto">
          <SEO title="Quick Order" canonical="/b2b/order" robots="noindex,nofollow" />
          <div className="flex justify-center mb-3">{business && <B2BStatusBadge status={business.status} />}</div>
          <h1 className="font-serif font-black text-brown-dark text-lg">Quick Order needs an approved account</h1>
          <p className="mt-2 text-brown-mid/70 text-sm">Once your wholesale account is approved, Quick Order opens up here.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="pb-32 lg:pb-6">
      <SEO title="Quick Order" canonical="/b2b/order" robots="noindex,nofollow" />

      <h1 className="font-serif font-black text-brown-dark text-xl sm:text-2xl mb-4">Quick Order</h1>

      {deliverableAddresses.length === 0 && (
        <div className="p-4 rounded-2xl text-sm mb-4" style={{ background: '#fef3e0', color: '#7a3300' }}>
          You don't have a deliverable shipping address yet.{' '}
          <a href="/b2b/profile" className="font-bold underline">Add one in your profile</a> to place an order.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="flex flex-col gap-4">
          {catalogLoading ? (
            <div className="py-12 text-center text-brown-mid/50 text-sm">Loading catalog…</div>
          ) : catalogError ? (
            <div className="py-12 text-center text-red-600 text-sm">Couldn't load the wholesale catalog. Please refresh.</div>
          ) : grouped.length === 0 ? (
            <div className="py-12 text-center text-brown-mid/50 text-sm">No wholesale items are available yet.</div>
          ) : (
            grouped.map((group, i) => (
              <motion.div
                key={group.product._id} className="card p-4"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img src={group.product.img} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div>
                    <div className="font-bold text-brown-dark text-sm">{group.product.name}</div>
                    {group.product.namMarathi && <div className="text-xs text-brown-mid/50">{group.product.namMarathi}</div>}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {group.items.map((item) => {
                    const cases = draft[item._id] || 0;
                    const err = rowError(item);
                    return (
                      <div key={item._id} className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: '#fef3e0', opacity: item.inStock ? 1 : 0.6 }}>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="text-sm">
                            <div className="font-semibold text-brown-dark">{item.size} · {item.unitsPerCase}/case</div>
                            <div className="text-brown-mid/60 text-xs">MOQ {item.moqCases} case{item.moqCases > 1 ? 's' : ''} · ₹{item.unitPrice}/unit</div>
                            {!item.inStock && <div className="text-red-600 text-xs font-semibold mt-0.5">Out of stock</div>}
                          </div>
                          <CaseStepper value={cases} onChange={(v) => setCases(item._id, v)} disabled={!item.inStock} />
                        </div>
                        {cases > 0 && (
                          <div className="text-right text-sm font-bold text-brown-dark">
                            {cases * item.unitsPerCase} units · <Money value={cases * item.unitsPerCase * item.unitPrice} />
                          </div>
                        )}
                        {err && <div className="text-xs text-red-600 font-semibold">{err.message}</div>}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}

          {nonRowErrors.length > 0 && (
            <div className="p-4 rounded-2xl text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
              {nonRowErrors.map((e, i) => <div key={i}>{e.message}</div>)}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Shipping address</label>
            <select
              className="form-input text-base"
              value={shippingAddressId}
              onChange={(e) => setShippingAddressId(e.target.value)}
              disabled={deliverableAddresses.length === 0}
            >
              {deliverableAddresses.length === 0 && <option value="">No deliverable address</option>}
              {deliverableAddresses.map((a) => (
                <option key={a._id} value={a._id}>{a.label || a.line1} — {a.city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Notes for this order (optional)</label>
            <textarea className="form-input text-base" rows={2} value={buyerNotes} onChange={(e) => setBuyerNotes(e.target.value)} />
          </div>
        </div>

        {/* DESKTOP: side summary panel */}
        <div className="hidden lg:block sticky top-20">
          <SummaryPanel
            quoting={quoting} quote={quote} totalCases={totalCases} totalUnits={totalUnits}
            minOrderValue={minOrderValue} progress={progress} creditSummary={creditSummary}
            onPlace={() => setConfirmOpen(true)} disabled={!quote || items.length === 0}
          />
        </div>
      </div>

      {/* MOBILE: sticky bottom summary bar — stops short of the WhatsApp button (CartPage inset pattern) */}
      {items.length > 0 && (
        <div className="lg:hidden fixed z-30 bg-white rounded-2xl p-3"
          style={{ left: 12, right: 84, bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', border: '1px solid rgba(224,112,0,0.15)', boxShadow: '0 12px 32px rgba(45,26,0,0.18)' }}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-xs text-brown-mid/60">{totalCases} case{totalCases === 1 ? '' : 's'}</div>
            <div className="font-serif font-black text-brown-dark text-base"><Money value={quote?.payable} /></div>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!quote || quoting}
            className="btn-saffron w-full flex items-center justify-center disabled:opacity-60"
            style={{ minHeight: 48 }}
          >
            {quoting ? 'Pricing…' : 'Review & place order'}
          </button>
        </div>
      )}

      <B2BModal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm your order">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {quote?.lines?.map((l) => (
              <div key={l.catalogItem} className="flex items-center justify-between text-sm">
                <span className="text-brown-dark">{l.name} ({l.size}) × {l.cases}</span>
                <span className="font-semibold text-brown-dark"><Money value={l.lineTotal} /></span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between font-bold text-brown-dark border-t pt-3" style={{ borderColor: 'rgba(224,112,0,0.15)' }}>
            <span>Total payable</span>
            <span><Money value={quote?.payable} /></span>
          </div>
          {quote?.advanceAmount > 0 ? (
            <div className="flex flex-col gap-1.5 text-sm rounded-xl p-3" style={{ background: '#fef3e0' }}>
              <div className="flex items-center justify-between">
                <span className="text-brown-mid/70">Pay now ({quote.advancePercent}% advance)</span>
                <span className="font-bold text-brown-dark"><Money value={quote.advanceAmount} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brown-mid/70">Due in 14 days</span>
                <span className="font-semibold text-brown-dark"><Money value={quote.remainingAmount} /></span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-brown-mid/60">No advance payment required — the full amount is on credit.</div>
          )}
          {quote?.wouldHold && (
            <div className="p-3 rounded-xl text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
              This order will be placed on credit hold and needs admin approval before it's confirmed.
            </div>
          )}
          <button onClick={submitOrder} disabled={placing} className="btn-saffron disabled:opacity-60" style={{ minHeight: 48 }}>
            {placing
              ? 'Processing…'
              : quote?.advanceAmount > 0
                ? `Pay ₹${Number(quote.advanceAmount).toLocaleString('en-IN')} & place order`
                : 'Place order'}
          </button>
        </div>
      </B2BModal>
    </PageWrapper>
  );
}

function SummaryPanel({ quoting, quote, totalCases, totalUnits, minOrderValue, progress, creditSummary, onPlace, disabled }) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50">Order summary</div>
      <div className="flex justify-between text-sm"><span className="text-brown-mid/60">Cases</span><span className="font-semibold text-brown-dark">{totalCases}</span></div>
      <div className="flex justify-between text-sm"><span className="text-brown-mid/60">Units</span><span className="font-semibold text-brown-dark">{totalUnits}</span></div>
      <div className="flex justify-between font-bold text-brown-dark text-base border-t pt-3" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
        <span>Total</span><span>{quoting ? '…' : <Money value={quote?.payable} />}</span>
      </div>
      {!quoting && quote?.advanceAmount > 0 && (
        <div className="flex justify-between text-xs text-brown-mid/60 -mt-2">
          <span>Pay now ({quote.advancePercent}%)</span><span className="font-semibold text-brown-dark"><Money value={quote.advanceAmount} /></span>
        </div>
      )}

      {minOrderValue > 0 && (
        <div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#fef3e0' }}>
            <motion.div
              className="h-full rounded-full" style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
          <div className="text-[11px] text-brown-mid/50 mt-1">Min. order ₹{minOrderValue.toLocaleString('en-IN')}</div>
        </div>
      )}

      {creditSummary && (
        <div className="text-xs text-brown-mid/60">Available credit: <strong className="text-brown-dark"><Money value={creditSummary.availableCredit} /></strong></div>
      )}

      {quote?.wouldHold && (
        <div className="p-2.5 rounded-xl text-xs" style={{ background: '#fef2f2', color: '#991b1b' }}>
          This order would be placed on credit hold.
        </div>
      )}

      <button onClick={onPlace} disabled={disabled} className="btn-saffron w-full disabled:opacity-60" style={{ minHeight: 48 }}>
        Review & place order
      </button>
    </div>
  );
}
