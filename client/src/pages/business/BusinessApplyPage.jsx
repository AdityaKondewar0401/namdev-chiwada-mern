import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import B2BStatusBadge from '../../components/b2b/B2BStatusBadge';
import { b2bAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { syncAuthUser } from '../../utils/syncAuthUser';
import { STATE_CODES, stateNameFromGstinPrefix } from '../../utils/indianStateCodes';

const BUSINESS_TYPES = [
  { value: 'retailer', label: 'Retailer' },
  { value: 'sweet_shop', label: 'Sweet Shop' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'caterer', label: 'Caterer' },
  { value: 'other', label: 'Other' },
];

const GSTIN_FORMAT_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const EMPTY_FORM = {
  businessName: '', businessType: '', legalName: '', gstin: '', fssaiLicenseNo: '',
  contactName: '', phone: '', email: '',
  billingAddress: { line1: '', line2: '', city: '', state: '', stateCode: '', pincode: '' },
};

function STATUS_COPY(status) {
  switch (status) {
    case 'pending':
      return { title: 'Your application is under review', body: 'Our team reviews every wholesale application personally. We’ll email you as soon as there’s an update — usually within a couple of business days.' };
    case 'approved':
      return { title: 'You already have a wholesale account', body: 'Your business account is approved and active. Head over to your dashboard to see wholesale pricing and place orders.' };
    case 'suspended':
      return { title: 'Your wholesale account is suspended', body: 'Your account has been temporarily suspended. Please contact us if you’d like to know more.' };
    default:
      return { title: 'You already have an application on file', body: 'You can check its status from your business dashboard.' };
  }
}

export default function BusinessApplyPage() {
  const { saveUser } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState('loading'); // loading | form | status-card
  const [existingStatus, setExistingStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([b2bAPI.getMe(), b2bAPI.getConfig()])
      .then(([meRes, configRes]) => {
        if (cancelled) return;
        setConfig(configRes.data.config);
        const biz = meRes.data.business;
        if (!biz) {
          setView('form');
        } else if (biz.status === 'rejected') {
          setForm((f) => ({
            ...f,
            businessName: biz.businessName || '',
            businessType: biz.businessType || '',
            legalName: biz.legalName || '',
            fssaiLicenseNo: biz.fssaiLicenseNo || '',
            contactName: biz.contactName || '',
            phone: biz.phone || '',
            email: biz.email || '',
            billingAddress: { ...f.billingAddress, ...(biz.billingAddress || {}) },
          }));
          setExistingStatus({ status: 'rejected', reason: biz.rejectionReason });
          setView('form');
        } else {
          setExistingStatus({ status: biz.status });
          setView('status-card');
        }
      })
      .catch(() => { if (!cancelled) setView('form'); });
    return () => { cancelled = true; };
  }, []);

  const setField = (path, value) => {
    setErrors((e) => ({ ...e, [path]: undefined }));
    if (path.startsWith('billingAddress.')) {
      const key = path.split('.')[1];
      setForm((f) => ({ ...f, billingAddress: { ...f.billingAddress, [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [path]: value }));
    }
  };

  const handleGstinChange = (value) => {
    const upper = value.toUpperCase();
    setField('gstin', upper);
  };

  const gstinHint = (() => {
    if (!form.gstin) return null;
    if (form.gstin.length < 15) return null;
    if (!GSTIN_FORMAT_RE.test(form.gstin)) return { ok: false, text: 'That doesn’t look like a valid GSTIN format.' };
    const stateName = stateNameFromGstinPrefix(form.gstin);
    return { ok: true, text: stateName ? `Looks valid — state: ${stateName}` : 'Format looks valid.' };
  })();

  const handleStateSelect = (code) => {
    setErrors((e) => ({ ...e, 'billingAddress.state': undefined }));
    setForm((f) => ({
      ...f,
      billingAddress: { ...f.billingAddress, stateCode: code, state: STATE_CODES[code] || '' },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors({});
    try {
      await b2bAPI.apply(form);
      await syncAuthUser(saveUser);
      toast.success('Application submitted!');
      navigate('/b2b');
    } catch (err) {
      if (err.response?.status === 409) {
        setExistingStatus({ status: err.response.data.status });
        setView('status-card');
      } else if (err.response?.status === 400 && Array.isArray(err.response.data?.errors)) {
        const fieldErrors = {};
        err.response.data.errors.forEach((fe) => { fieldErrors[fe.field] = fe.message; });
        setErrors(fieldErrors);
        toast.error('Please fix the highlighted fields');
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <SEO title="Wholesale Application" canonical="/business/apply" robots="noindex,nofollow" />
        <div className="w-8 h-8 rounded-full border-2 border-saffron border-t-transparent animate-spin" />
      </div>
    );
  }

  if (view === 'status-card') {
    const copy = STATUS_COPY(existingStatus?.status);
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
        <SEO title="Wholesale Application" canonical="/business/apply" robots="noindex,nofollow" />
        <div className="card p-6 sm:p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <B2BStatusBadge status={existingStatus?.status} />
          </div>
          <h1 className="font-serif font-black text-brown-dark" style={{ fontSize: '1.35rem' }}>{copy.title}</h1>
          <p className="mt-3 text-brown-mid/70 text-sm leading-relaxed">{copy.body}</p>
          {existingStatus?.status === 'rejected' && existingStatus?.reason && (
            <div className="mt-4 p-3 rounded-xl text-left text-sm" style={{ background: '#fef3e0', color: '#7a3300' }}>
              <strong>Reason:</strong> {existingStatus.reason}
            </div>
          )}
          <Link to="/b2b" className="btn-saffron inline-flex items-center justify-center mt-6 w-full sm:w-auto" style={{ minHeight: 48 }}>
            Go to your dashboard
          </Link>
        </div>
      </div>
    );
  }

  const deliveryText = config?.allowedStateNames?.length ? config.allowedStateNames.join(', ') : null;
  const err = (name) => errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>;

  return (
    <div className="min-h-screen bg-cream pb-28 sm:pb-16">
      <SEO title="Apply for a Wholesale Account" canonical="/business/apply" robots="noindex,nofollow" />

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <span className="section-eyebrow">Wholesale Application</span>
        <h1 className="section-title" style={{ fontSize: 'clamp(1.5rem,5vw,2.1rem)' }}>Apply for a wholesale account</h1>
        <p className="mt-2 text-brown-mid/70 text-sm leading-relaxed">
          {existingStatus?.status === 'rejected'
            ? 'Update your details below and resubmit — your previous application is shown pre-filled.'
            : 'Tell us a bit about your business. Our team reviews every application personally.'}
          {deliveryText && <> We currently deliver wholesale orders to <strong>{deliveryText}</strong>.</>}
        </p>

        {existingStatus?.status === 'rejected' && existingStatus?.reason && (
          <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
            <strong>Previous application note:</strong> {existingStatus.reason}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="businessName">Business name *</label>
            <input id="businessName" className="form-input text-base" autoComplete="organization"
              value={form.businessName} onChange={(e) => setField('businessName', e.target.value)} required />
            {err('businessName')}
          </div>

          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="businessType">Business type *</label>
            <select id="businessType" className="form-input text-base" value={form.businessType}
              onChange={(e) => setField('businessType', e.target.value)} required>
              <option value="">Select a type…</option>
              {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {err('businessType')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="contactName">Contact person</label>
              <input id="contactName" className="form-input text-base" autoComplete="name"
                value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} />
              {err('contactName')}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="phone">Phone</label>
              <input id="phone" type="tel" inputMode="numeric" className="form-input text-base" autoComplete="tel"
                value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
              {err('phone')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="email">Email</label>
            <input id="email" type="email" inputMode="email" className="form-input text-base" autoComplete="email"
              value={form.email} onChange={(e) => setField('email', e.target.value)} />
            {err('email')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="gstin">GSTIN (optional)</label>
              <input id="gstin" className="form-input text-base uppercase" maxLength={15}
                value={form.gstin} onChange={(e) => handleGstinChange(e.target.value)} />
              {gstinHint && (
                <p className="mt-1 text-xs" style={{ color: gstinHint.ok ? '#15803d' : '#b91c1c' }}>{gstinHint.text}</p>
              )}
              {err('gstin')}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="fssai">FSSAI license no. (optional)</label>
              <input id="fssai" className="form-input text-base"
                value={form.fssaiLicenseNo} onChange={(e) => setField('fssaiLicenseNo', e.target.value)} />
              {err('fssaiLicenseNo')}
            </div>
          </div>

          <div className="pt-2 border-t" style={{ borderColor: 'rgba(224,112,0,0.12)' }}>
            <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-3">Billing address (optional)</div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="line1">Address line 1</label>
                <input id="line1" className="form-input text-base" autoComplete="address-line1"
                  value={form.billingAddress.line1} onChange={(e) => setField('billingAddress.line1', e.target.value)} />
                {err('billingAddress.line1')}
              </div>
              <div>
                <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="line2">Address line 2</label>
                <input id="line2" className="form-input text-base" autoComplete="address-line2"
                  value={form.billingAddress.line2} onChange={(e) => setField('billingAddress.line2', e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="city">City</label>
                  <input id="city" className="form-input text-base" autoComplete="address-level2"
                    value={form.billingAddress.city} onChange={(e) => setField('billingAddress.city', e.target.value)} />
                  {err('billingAddress.city')}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="state">State</label>
                  <select id="state" className="form-input text-base" value={form.billingAddress.stateCode}
                    onChange={(e) => handleStateSelect(e.target.value)}>
                    <option value="">Select a state…</option>
                    {Object.entries(STATE_CODES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                  </select>
                  {err('billingAddress.state')}
                </div>
              </div>

              <div className="max-w-[200px]">
                <label className="block text-sm font-semibold text-brown-dark mb-1.5" htmlFor="pincode">Pincode</label>
                <input id="pincode" inputMode="numeric" maxLength={6} className="form-input text-base" autoComplete="postal-code"
                  value={form.billingAddress.pincode} onChange={(e) => setField('billingAddress.pincode', e.target.value.replace(/\D/g, ''))} />
                {err('billingAddress.pincode')}
              </div>
            </div>
          </div>

          {/* Desktop / inline submit — hidden on mobile in favor of the sticky bar */}
          <button type="submit" disabled={submitting}
            className="hidden sm:inline-flex btn-saffron items-center justify-center self-start disabled:opacity-60"
            style={{ minHeight: 48 }}>
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>

      {/* Mobile sticky submit bar — safe-area aware, never covers the last
          field (pb-28 on the page wrapper above). Stops short of the right
          edge (same `right: 84` inset CartPage's StickyCheckoutBar uses) so
          it doesn't sit under the always-on WhatsAppFloat button, which
          this page can't hide itself (that's a shared component outside
          this phase's scope) — reserving space is the same fix CartPage
          already uses for the identical conflict. */}
      <div className="sm:hidden fixed z-30 bg-white rounded-2xl"
        style={{
          left: 12, right: 84, bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          padding: '10px 10px', border: '1px solid rgba(224,112,0,0.12)', boxShadow: '0 12px 32px rgba(45,26,0,0.18)',
        }}>
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="btn-saffron w-full flex items-center justify-center disabled:opacity-60" style={{ minHeight: 48 }}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </div>
    </div>
  );
}
