import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { partnerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { PARTNER_TYPES, PARTNER_TYPE_LABELS } from './adminConstants';

const EMPTY_FORM = {
  businessName: '',
  type: 'distributor',
  contactPerson: '',
  phone: '',
  email: '',
  gstin: '',
  defaultAdvancePercent: 50,
  street: '',
  city: '',
  state: '',
  pincode: '',
};

// ─────────────────────────────────────────────
// PartnersTab — Phase 1: create/edit/deactivate partners.
// No login account is created here yet — that's Phase 2 (invite-link flow).
// Follows the same add/edit-inline pattern as PromoCodesTab.
// ─────────────────────────────────────────────
export default function PartnersTab() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null); // { businessName, link } | null

  const copyToClipboard = async (text, label = 'Invite link') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
    } catch {
      // Clipboard API can fail in some contexts — the link is still on
      // screen in the box below, so the admin can select/copy it manually.
      toast.error('Could not auto-copy — select and copy the link manually below');
    }
  };

  const loadPartners = () => {
    setLoading(true);
    partnerAPI
      .getAll()
      .then((res) => setPartners(res.data.partners || []))
      .catch(() => toast.error('Failed to load partners'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (partner) => {
    setForm({
      businessName: partner.businessName || '',
      type: partner.type || 'distributor',
      contactPerson: partner.contactPerson || '',
      phone: partner.phone || '',
      email: partner.email || '',
      gstin: partner.gstin || '',
      defaultAdvancePercent: partner.defaultAdvancePercent ?? 50,
      street: partner.address?.street || '',
      city: partner.address?.city || '',
      state: partner.address?.state || '',
      pincode: partner.address?.pincode || '',
    });
    setEditingId(partner._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.businessName || !form.type) {
      toast.error('Business name and type are required');
      return;
    }

    const payload = {
      businessName: form.businessName,
      type: form.type,
      contactPerson: form.contactPerson,
      phone: form.phone,
      email: form.email,
      gstin: form.gstin,
      defaultAdvancePercent: Number(form.defaultAdvancePercent),
      address: {
        street: form.street,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
    };

    setSaving(true);
    try {
      if (editingId) {
        const res = await partnerAPI.update(editingId, payload);
        setPartners((prev) => prev.map((p) => (p._id === editingId ? res.data.partner : p)));
        toast.success('Partner updated');
      } else {
        const res = await partnerAPI.create(payload);
        setPartners((prev) => [res.data.partner, ...prev]);
        toast.success('Partner added');
        if (res.data.inviteLink) {
          setInviteInfo({ businessName: res.data.partner.businessName, link: res.data.inviteLink });
          copyToClipboard(res.data.inviteLink, 'Invite link');
        }
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save partner');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (partner) => {
    if (!window.confirm(`Deactivate "${partner.businessName}"? Their history stays intact.`)) return;
    try {
      await partnerAPI.delete(partner._id);
      setPartners((prev) =>
        prev.map((p) => (p._id === partner._id ? { ...p, active: false } : p))
      );
      toast.success('Partner deactivated');
    } catch {
      toast.error('Failed to deactivate partner');
    }
  };

  const handleGetInviteLink = async (partner) => {
    try {
      const res = await partnerAPI.getInviteLink(partner._id);
      setInviteInfo({ businessName: partner.businessName, link: res.data.inviteLink });
      copyToClipboard(res.data.inviteLink, 'Invite link');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get invite link');
    }
  };

  const filteredPartners = partners.filter((p) =>
    p.businessName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-serif font-black text-brown-dark text-2xl">Partners</h2>
        <button
          onClick={() => (showForm ? setShowForm(false) : openAddForm())}
          className="px-5 py-2.5 rounded-full font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 44 }}
        >
          {showForm ? 'Cancel' : '+ Add Partner'}
        </button>
      </div>

      {inviteInfo && (
        <div
          className="rounded-2xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ background: '#fff0d6', border: '1px solid rgba(224,112,0,0.25)' }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-brown-dark mb-1">
              Invite link for {inviteInfo.businessName} — share this manually until email/WhatsApp delivery is set up
            </div>
            <input
              readOnly
              value={inviteInfo.link}
              onFocus={(e) => e.target.select()}
              className="w-full text-xs bg-white rounded-lg px-2.5 py-2 border border-saffron/20 text-brown-dark"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => copyToClipboard(inviteInfo.link, 'Invite link')}
              className="text-xs font-bold px-3 py-2 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 40 }}
            >
              Copy
            </button>
            <button
              onClick={() => setInviteInfo(null)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-brown-mid/20 text-brown-mid"
              style={{ minHeight: 40 }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 mb-5"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.15)' }}
          >
            <h3 className="font-bold text-brown-dark mb-4">
              {editingId ? 'Edit Partner' : 'New Partner'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Business Name
                </label>
                <input
                  value={form.businessName}
                  onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                  placeholder="Solapur General Stores"
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Partner Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="form-input text-sm"
                >
                  {PARTNER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {PARTNER_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Contact Person
                </label>
                <input
                  value={form.contactPerson}
                  onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 9XXXXXXXXX"
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Email
                </label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  GSTIN
                </label>
                <input
                  value={form.gstin}
                  onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Advance % (paid at dispatch)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.defaultAdvancePercent}
                  onChange={(e) => setForm((p) => ({ ...p, defaultAdvancePercent: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Street
                </label>
                <input
                  value={form.street}
                  onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  City
                </label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  State
                </label>
                <input
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Pincode
                </label>
                <input
                  value={form.pincode}
                  onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-full font-bold text-white text-sm disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 44 }}
            >
              {saving ? 'Saving...' : editingId ? '✅ Save Changes' : '✅ Add Partner'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business name..."
          className="form-input text-sm mb-1"
        />
        {filteredPartners.map((partner) => (
          <div
            key={partner._id}
            className="bg-white rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3"
            style={{
              boxShadow: '0 2px 12px rgba(45,26,0,0.06)',
              border: '1px solid rgba(224,112,0,0.08)',
              opacity: partner.active ? 1 : 0.55,
            }}
          >
            <div>
              <div className="font-bold text-brown-dark text-sm">{partner.businessName}</div>
              <div className="text-xs text-brown-mid/60 mt-0.5">
                {PARTNER_TYPE_LABELS[partner.type]} · {partner.phone || 'no phone'} ·{' '}
                {partner.defaultAdvancePercent}% advance
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  partner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {partner.active ? 'Active' : 'Inactive'}
              </span>
              {partner.user && (
                <button
                  onClick={() => handleGetInviteLink(partner)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-all"
                  style={{ borderColor: 'rgba(224,112,0,0.2)', color: '#e07000', minHeight: 40 }}
                  title="Get this partner's set-password link to share manually"
                >
                  🔗 Invite Link
                </button>
              )}
              <button
                onClick={() => openEditForm(partner)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-all"
                style={{ borderColor: 'rgba(224,112,0,0.2)', color: '#e07000', minHeight: 40 }}
              >
                Edit
              </button>
              {partner.active && (
                <button
                  onClick={() => handleDeactivate(partner)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: '#fef2f2', color: '#dc2626', minHeight: 40 }}
                >
                  Deactivate
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredPartners.length === 0 && (
          <div className="text-center py-12 text-brown-mid/50">
            {search ? 'No partners match your search' : 'No partners yet'}
          </div>
        )}
      </div>
    </div>
  );
}
