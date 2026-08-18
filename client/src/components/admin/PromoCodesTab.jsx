import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// PromoCodesTab — unchanged logic from the original, moved into its
// own file. The "Add Code" form grid already collapses to 1 column
// on mobile (sm:grid-cols-3), kept as-is.
// ─────────────────────────────────────────────
export default function PromoCodesTab() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', type: 'percent', value: '' });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const DEFAULT_CODES = ['NAMDEV10', 'SOLAPUR', 'FLAT50'];

  useEffect(() => {
    api.get('/api/orders/admin/promos')
      .then((res) => setPromos(res.data.promos || []))
      .catch(() => toast.error('Failed to load promo codes'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!form.code || (!form.value && form.type !== 'shipping')) {
      toast.error('Fill all fields');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/api/orders/admin/promos', {
        code: form.code.toUpperCase(),
        type: form.type,
        value: form.type === 'shipping' ? 0 : Number(form.value),
      });
      setPromos((prev) => [res.data.promo, ...prev]);
      setForm({ code: '', type: 'percent', value: '' });
      setAdding(false);
      toast.success(`Promo "${res.data.promo.code}" added!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add promo');
    } finally {
      setSaving(false);
    }
  };

  const togglePromo = async (code) => {
    try {
      const res = await api.put(`/api/orders/admin/promos/${code}/toggle`);
      setPromos((prev) => prev.map((p) => (p.code === code ? res.data.promo : p)));
    } catch {
      toast.error('Failed to update promo');
    }
  };

  const deletePromo = async (code) => {
    if (DEFAULT_CODES.includes(code)) {
      toast.error('Cannot delete default promo codes');
      return;
    }
    try {
      await api.delete(`/api/orders/admin/promos/${code}`);
      setPromos((prev) => prev.filter((p) => p.code !== code));
      toast.success('Promo deleted');
    } catch {
      toast.error('Failed to delete promo');
    }
  };

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-serif font-black text-brown-dark text-2xl">Promo Codes</h2>
        <button onClick={() => setAdding(!adding)} className="px-5 py-2.5 rounded-full font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 44 }}>
          {adding ? 'Cancel' : '+ Add Code'}
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 mb-5"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.15)' }}>
            <h3 className="font-bold text-brown-dark mb-4">New Promo Code</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Code</label>
                <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20" className="form-input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Type</label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, value: e.target.value === 'shipping' ? '0' : p.value }))}
                  className="form-input text-sm">
                  <option value="percent">Percentage Off</option>
                  <option value="flat">Flat Discount ₹</option>
                  <option value="shipping">Free Shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Value {form.type === 'percent' ? '(%)' : form.type === 'flat' ? '(₹)' : '(auto)'}
                </label>
                <input type="number" value={form.type === 'shipping' ? '0' : form.value}
                  onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                  placeholder={form.type === 'percent' ? '10' : '50'}
                  disabled={form.type === 'shipping'} className="form-input text-sm disabled:opacity-50" />
              </div>
            </div>
            <button onClick={handleAdd} disabled={saving} className="px-6 py-2.5 rounded-full font-bold text-white text-sm disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 44 }}>
              {saving ? 'Saving...' : '✅ Add Promo Code'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {promos.map((promo) => (
          <div key={promo.code} className="bg-white rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3"
            style={{ boxShadow: '0 2px 12px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-xl font-black text-lg tracking-wider"
                style={{ background: promo.active ? '#fff0d6' : '#f5f5f5', color: promo.active ? '#e07000' : '#9ca3af' }}>
                {promo.code}
              </div>
              <div>
                <div className="font-semibold text-brown-dark text-sm">
                  {promo.type === 'shipping' ? 'Free Shipping' : `${promo.type === 'flat' ? '₹' : ''}${promo.value}${promo.type === 'percent' ? '% off' : ' off'}`}
                </div>
                <div className="text-xs text-brown-mid/60">{promo.uses} uses · {promo.type}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${promo.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {promo.active ? 'Active' : 'Inactive'}
              </span>
              <button onClick={() => togglePromo(promo.code)} className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-all"
                style={{ borderColor: 'rgba(224,112,0,0.2)', color: '#e07000', minHeight: 36 }}>
                {promo.active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => deletePromo(promo.code)} className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: '#fef2f2', color: '#dc2626', minHeight: 36 }}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {promos.length === 0 && <div className="text-center py-12 text-brown-mid/50">No promo codes yet</div>}
      </div>
    </div>
  );
}