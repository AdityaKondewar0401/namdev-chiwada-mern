import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { b2bAdminAPI } from '../../services/api';
import B2BModal from '../b2b/B2BModal';

// Phase 2 scope: pricing tiers only. Catalog items (product+size picker,
// unitsPerCase, MOQ, base price, tier overrides) are Phase 3 — this same
// file grows a second section then, per docs/B2B_PORTAL_SPEC.md §8.5.

const EMPTY_FORM = { name: '', code: '', description: '', discountPercent: '', isDefault: false, active: true };

export default function B2BCatalogTab() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchTiers = useCallback(() => {
    setLoading(true);
    b2bAdminAPI.listTiers()
      .then((res) => setTiers(res.data.tiers))
      .catch(() => toast.error('Failed to load pricing tiers'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTiers(); }, [fetchTiers]);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (tier) => {
    setEditingId(tier._id);
    setForm({
      name: tier.name, code: tier.code, description: tier.description || '',
      discountPercent: String(tier.discountPercent), isDefault: tier.isDefault, active: tier.active,
    });
    setErrors({});
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const payload = { ...form, discountPercent: Number(form.discountPercent) };
    try {
      if (editingId) {
        await b2bAdminAPI.updateTier(editingId, payload);
        toast.success('Tier updated');
      } else {
        await b2bAdminAPI.createTier(payload);
        toast.success('Tier created');
      }
      setModalOpen(false);
      fetchTiers();
    } catch (err) {
      if (err.response?.status === 400 && Array.isArray(err.response.data?.errors)) {
        const fe = {};
        err.response.data.errors.forEach((e2) => { fe[e2.field] = e2.message; });
        setErrors(fe);
      } else {
        toast.error(err.response?.data?.message || 'Failed to save tier');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTier = async (tier) => {
    if (!window.confirm(`Delete pricing tier "${tier.name}"? This cannot be undone.`)) return;
    try {
      await b2bAdminAPI.deleteTier(tier._id);
      toast.success('Tier deleted');
      fetchTiers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete tier');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif font-black text-brown-dark text-lg">Wholesale Pricing</h2>
          <p className="text-brown-mid/60 text-sm mt-0.5">Pricing tiers apply a % discount off the base wholesale price.</p>
        </div>
        <button onClick={openCreate} className="btn-saffron text-sm px-5" style={{ minHeight: 44 }}>
          + New tier
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">Loading…</div>
      ) : tiers.length === 0 ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">No pricing tiers yet. Create your first one to start approving businesses.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tiers.map((t) => (
            <div key={t._id} className="card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-brown-dark text-sm">{t.name}</div>
                  <div className="text-xs text-brown-mid/50 mt-0.5">{t.code}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {t.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>DEFAULT</span>
                  )}
                  {!t.active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#f3f4f6', color: '#6b7280' }}>INACTIVE</span>
                  )}
                </div>
              </div>
              <div className="font-serif font-black text-saffron text-xl">{t.discountPercent}% off</div>
              {t.description && <p className="text-brown-mid/60 text-xs leading-relaxed">{t.description}</p>}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => openEdit(t)} className="flex-1 rounded-xl text-sm font-semibold text-brown-dark"
                  style={{ minHeight: 44, background: '#fef3e0' }}>
                  Edit
                </button>
                <button onClick={() => deleteTier(t)} className="flex-1 rounded-xl text-sm font-semibold text-red-600"
                  style={{ minHeight: 44, background: '#fef2f2' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <B2BModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit pricing tier' : 'New pricing tier'}>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Name *</label>
            <input className="form-input text-base" required
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Code *</label>
              <input className="form-input text-base uppercase" required
                value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
              {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Discount % *</label>
              <input type="number" inputMode="numeric" min="0" max="100" step="0.01" className="form-input text-base" required
                value={form.discountPercent} onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))} />
              {errors.discountPercent && <p className="mt-1 text-xs text-red-600">{errors.discountPercent}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Description (optional)</label>
            <textarea className="form-input text-base" rows={2}
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-brown-dark" style={{ minHeight: 44 }}>
              <input type="checkbox" className="w-5 h-5" checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
              Make this the default tier
            </label>
            <label className="flex items-center gap-2.5 text-sm font-semibold text-brown-dark" style={{ minHeight: 44 }}>
              <input type="checkbox" className="w-5 h-5" checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
              Active
            </label>
          </div>
          <button type="submit" disabled={submitting} className="btn-saffron disabled:opacity-60" style={{ minHeight: 48 }}>
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create tier'}
          </button>
        </form>
      </B2BModal>
    </div>
  );
}
