import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import PageWrapper from '../../components/PageWrapper';
import B2BModal from '../../components/b2b/B2BModal';
import { useB2B } from '../../context/B2BContext';
import { b2bAPI } from '../../services/api';
import { STATE_CODES } from '../../utils/indianStateCodes';

const EMPTY_ADDRESS = { label: '', contactName: '', phone: '', line1: '', line2: '', city: '', district: '', state: '', stateCode: '', pincode: '', isDefault: false };

export default function B2BProfilePage() {
  const { business, config, refresh } = useB2B();

  const [contact, setContact] = useState({ contactName: '', phone: '', email: '' });
  const [savingContact, setSavingContact] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);
  const [confirmingDeleteIndex, setConfirmingDeleteIndex] = useState(null);

  useEffect(() => {
    if (!business) return;
    setContact({ contactName: business.contactName || '', phone: business.phone || '', email: business.email || '' });
    setAddresses(business.shippingAddresses || []);
  }, [business]);

  const isDeliverable = (addr) => config?.allowedStateCodes?.includes(addr.stateCode);

  const saveContact = async (e) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      await b2bAPI.updateMe(contact);
      toast.success('Contact details updated');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingContact(false);
    }
  };

  const openAdd = () => { setEditingIndex(null); setForm(EMPTY_ADDRESS); setModalOpen(true); };
  const openEdit = (i) => { setEditingIndex(i); setForm(addresses[i]); setModalOpen(true); };

  const handleStateSelect = (code) => setForm((f) => ({ ...f, stateCode: code, state: STATE_CODES[code] || '' }));

  const saveAddress = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let next = [...addresses];
      if (editingIndex === null) {
        next.push(form);
      } else {
        next[editingIndex] = form;
      }
      if (form.isDefault) {
        next = next.map((a, i) => ({ ...a, isDefault: editingIndex === null ? a === next[next.length - 1] : i === editingIndex }));
      }
      await b2bAPI.updateMe({ shippingAddresses: next });
      toast.success('Address saved');
      setModalOpen(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  // Confirmation now happens inline (two-step, same pattern as CartPage's
  // "Clear Cart") instead of a native window.confirm — this function
  // itself is unchanged: same payload, same success/error handling.
  const deleteAddress = async (i) => {
    setConfirmingDeleteIndex(null);
    try {
      const next = addresses.filter((_, idx) => idx !== i);
      await b2bAPI.updateMe({ shippingAddresses: next });
      toast.success('Address removed');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove address');
    }
  };

  if (business === undefined) return null;
  if (business === null) return <div className="py-12 text-center text-brown-mid/50 text-sm">No business account found.</div>;

  return (
    <PageWrapper>
      <div className="flex flex-col gap-5">
        <SEO title="Business Profile" canonical="/b2b/profile" robots="noindex,nofollow" />
        <h1 className="font-serif font-black text-brown-dark text-xl sm:text-2xl">Profile</h1>

        <form onSubmit={saveContact} className="card p-4 sm:p-5 flex flex-col gap-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50">Contact details</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Contact person</label>
              <input className="form-input text-base" autoComplete="name" value={contact.contactName} onChange={(e) => setContact((c) => ({ ...c, contactName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Phone</label>
              <input type="tel" inputMode="numeric" className="form-input text-base" autoComplete="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Email</label>
            <input type="email" inputMode="email" className="form-input text-base" autoComplete="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} />
          </div>
          <button type="submit" disabled={savingContact} className="btn-saffron self-start disabled:opacity-60" style={{ minHeight: 44 }}>
            {savingContact ? 'Saving…' : 'Save contact details'}
          </button>
        </form>

        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50">Shipping addresses</div>
            <button onClick={openAdd} className="text-saffron font-semibold text-sm">+ Add</button>
          </div>

          {addresses.length === 0 ? (
            <p className="text-brown-mid/50 text-sm">No shipping addresses yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {addresses.map((a, i) => {
                  const deliverable = isDeliverable(a);
                  const confirming = confirmingDeleteIndex === i;
                  return (
                    <motion.div
                      key={a._id || `${a.label}-${i}`}
                      layout
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="p-3 rounded-xl" style={{ background: '#fef3e0' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm text-brown-dark">
                          <div className="font-semibold">{a.label || 'Address'} {a.isDefault && <span className="text-[10px] font-bold text-saffron ml-1">DEFAULT</span>}</div>
                          <div className="text-brown-mid/70 mt-0.5">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}</div>
                          {!deliverable && <div className="text-red-600 text-xs font-semibold mt-1">Not deliverable yet — outside our current delivery region</div>}
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <AnimatePresence mode="wait">
                          {!confirming ? (
                            <motion.div
                              key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              <button onClick={() => openEdit(i)} className="flex-1 rounded-lg text-xs font-semibold text-brown-dark" style={{ minHeight: 36, background: '#fff' }}>Edit</button>
                              <button onClick={() => setConfirmingDeleteIndex(i)} className="flex-1 rounded-lg text-xs font-semibold text-red-600" style={{ minHeight: 36, background: '#fff' }}>Remove</button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="confirm" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                              className="flex items-center gap-2 px-1"
                            >
                              <span className="text-xs text-brown-dark font-medium flex-1">Remove this address?</span>
                              <button onClick={() => deleteAddress(i)} className="text-xs font-bold px-3 rounded-lg text-white" style={{ minHeight: 36, background: '#dc2626' }}>Yes</button>
                              <button onClick={() => setConfirmingDeleteIndex(null)} className="text-xs font-semibold px-3 rounded-lg text-brown-mid/70" style={{ minHeight: 36, background: '#fff' }}>Cancel</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        <B2BModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingIndex === null ? 'Add shipping address' : 'Edit shipping address'}>
          <form onSubmit={saveAddress} className="flex flex-col gap-4" noValidate>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Label</label>
              <input className="form-input text-base" placeholder="e.g. Main warehouse" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-brown-dark mb-1.5">Contact name</label>
                <input className="form-input text-base" autoComplete="name" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brown-dark mb-1.5">Phone</label>
                <input type="tel" inputMode="numeric" className="form-input text-base" autoComplete="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Address line 1</label>
              <input className="form-input text-base" autoComplete="address-line1" value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Address line 2</label>
              <input className="form-input text-base" autoComplete="address-line2" value={form.line2} onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-brown-dark mb-1.5">City</label>
                <input className="form-input text-base" autoComplete="address-level2" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brown-dark mb-1.5">State</label>
                <select className="form-input text-base" value={form.stateCode} onChange={(e) => handleStateSelect(e.target.value)}>
                  <option value="">Select…</option>
                  {Object.entries(STATE_CODES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
              </div>
            </div>
            <div className="max-w-[200px]">
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Pincode</label>
              <input inputMode="numeric" maxLength={6} className="form-input text-base" autoComplete="postal-code" value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} />
            </div>
            <label className="flex items-center gap-2.5 text-sm font-semibold text-brown-dark" style={{ minHeight: 44 }}>
              <input type="checkbox" className="w-5 h-5" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
              Set as default
            </label>
            <button type="submit" disabled={saving} className="btn-saffron disabled:opacity-60" style={{ minHeight: 48 }}>
              {saving ? 'Saving…' : 'Save address'}
            </button>
          </form>
        </B2BModal>
      </div>
    </PageWrapper>
  );
}
