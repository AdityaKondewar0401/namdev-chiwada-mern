import { useState } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────
// AddressTab — functionally identical to the original (same fields,
// same save flow), just minor visual polish (icon accent, spacing).
// ─────────────────────────────────────────────
export default function AddressTab({ user, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate({ address: form });
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const hasAddress = user?.address?.street;

  return (
    <div>
      <h2 className="font-serif font-black text-brown-dark text-2xl mb-6">Saved Address</h2>

      <div className="bg-white rounded-2xl p-5 sm:p-6"
        style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-brown-dark flex items-center gap-2">
            📍 Default Address
          </h3>
          <button onClick={() => setEditing(!editing)}
            className="text-xs font-bold px-4 py-1.5 rounded-full transition-all"
            style={{ background: editing ? '#fef3e0' : 'linear-gradient(135deg,#e07000,#ff9010)', color: editing ? '#e07000' : '#fff' }}>
            {editing ? 'Cancel' : hasAddress ? '✏️ Edit' : '+ Add Address'}
          </button>
        </div>

        {!editing && !hasAddress && (
          <div className="text-center py-8 text-brown-mid/50 text-sm">
            No address saved yet. Click "Add Address" to add one.
          </div>
        )}

        {!editing && hasAddress && (
          <div className="p-4 rounded-xl text-sm leading-relaxed text-brown-dark flex items-start gap-3"
            style={{ background: '#fef3e0' }}>
            <span className="text-lg flex-shrink-0" aria-hidden="true">🏠</span>
            <div>
              <div className="font-semibold mb-1">{user.name}</div>
              <div className="text-brown-mid/70">
                {user.address.street}<br />
                {user.address.city}, {user.address.state} – {user.address.pincode}
              </div>
            </div>
          </div>
        )}

        {editing && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Street Address', key: 'street', placeholder: 'Flat No, Building, Area', full: true },
              { label: 'City', key: 'city', placeholder: 'Solapur' },
              { label: 'State', key: 'state', placeholder: 'Maharashtra' },
              { label: 'Pincode', key: 'pincode', placeholder: '413001' },
            ].map(({ label, key, placeholder, full }) => (
              <div key={key} className={full ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/60 mb-1.5">
                  {label}
                </label>
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-brown-dark border outline-none transition-all"
                  style={{ borderColor: 'rgba(224,112,0,0.3)', background: '#fffdf7' }}
                  onFocus={(e) => (e.target.style.borderColor = '#e07000')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(224,112,0,0.3)')}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <button onClick={handleSave} disabled={loading}
                className="px-8 py-3 rounded-full font-bold text-white text-sm transition-all"
                style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 4px 16px rgba(224,112,0,0.3)' }}>
                {loading ? 'Saving...' : '✅ Save Address'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}