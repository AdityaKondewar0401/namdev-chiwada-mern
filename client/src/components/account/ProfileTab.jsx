import { useState } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────
// ProfileTab
//
// The name/phone edit flow is unchanged from the original. New:
// a "Profile Completeness" card computed purely from data already
// on the `user` object (name, email, phone, address) — no new
// backend fields or endpoints, just a genuinely useful summary
// that also nudges people to fill in a phone/address if missing.
// ─────────────────────────────────────────────

function computeCompleteness(user) {
  const checks = [
    { label: 'Name added', done: !!user?.name },
    { label: 'Email on file', done: !!user?.email },
    { label: 'Phone number added', done: !!user?.phone },
    { label: 'Delivery address added', done: !!user?.address?.street },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);
  return { checks, percent };
}

export default function ProfileTab({ user, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  const { checks, percent } = computeCompleteness(user);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(form);
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-serif font-black text-brown-dark text-2xl mb-6">My Profile</h2>

      {/* Avatar + name card */}
      <div className="rounded-2xl p-5 sm:p-6 mb-4 flex items-center gap-4 sm:gap-5"
        style={{ background: 'linear-gradient(135deg,#fff0d6,#fffdf7)', border: '1px solid rgba(224,112,0,0.12)' }}>
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-black flex-shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 8px 24px rgba(224,112,0,0.3), 0 0 0 3px rgba(212,175,55,0.35)' }}>
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            : user?.name?.charAt(0).toUpperCase()
          }
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-serif font-black text-brown-dark text-lg sm:text-xl truncate">{user?.name}</div>
          <div className="text-sm text-brown-mid/60 mt-0.5 break-all">{user?.email}</div>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: user?.role === 'admin' ? '#fef3c7' : '#f0fdf4', color: user?.role === 'admin' ? '#92400e' : '#166534' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: user?.role === 'admin' ? '#f59e0b' : '#22c55e' }} />
            {user?.role === 'admin' ? 'Admin' : 'Member'}
          </div>
        </div>
      </div>

      {/* Profile completeness — NEW */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 mb-4"
        style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-brown-dark text-sm">Profile Completeness</h3>
          <span className="font-black text-sm" style={{ color: '#e07000' }}>{percent}%</span>
        </div>
        <div className="h-2 rounded-full mb-4" style={{ background: '#f3ede2' }}>
          <motion.div
            className="h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            style={{ background: 'linear-gradient(90deg,#e07000,#d4af37)' }}
          />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5 text-xs" style={{ color: c.done ? '#166534' : '#9a7c5a' }}>
              <span>{c.done ? '✅' : '⭕'}</span>
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* Info fields */}
      <div className="bg-white rounded-2xl p-5 sm:p-6"
        style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-brown-dark">Personal Information</h3>
          <button onClick={() => setEditing(!editing)}
            className="text-xs font-bold px-4 py-1.5 rounded-full transition-all"
            style={{ background: editing ? '#fef3e0' : 'linear-gradient(135deg,#e07000,#ff9010)', color: editing ? '#e07000' : '#fff' }}>
            {editing ? 'Cancel' : '✏️ Edit'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', key: 'name', value: user?.name, type: 'text', icon: '👤' },
            { label: 'Email Address', key: 'email', value: user?.email, type: 'email', readOnly: true, icon: '✉️' },
            { label: 'Phone Number', key: 'phone', value: user?.phone || '—', type: 'tel', icon: '📱' },
            { label: 'Account Type', key: 'role', value: user?.role === 'admin' ? 'Administrator' : 'Customer', type: 'text', readOnly: true, icon: '🏷️' },
          ].map(({ label, key, value, type, readOnly, icon }) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brown-mid/60 mb-1.5">
                <span aria-hidden="true">{icon}</span>{label}
              </label>
              {editing && !readOnly ? (
                <input
                  type={type}
                  value={form[key] || ''}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-brown-dark border outline-none transition-all"
                  style={{ borderColor: 'rgba(224,112,0,0.3)', background: '#fffdf7' }}
                  onFocus={(e) => (e.target.style.borderColor = '#e07000')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(224,112,0,0.3)')}
                />
              ) : (
                <div className="px-3 py-2.5 rounded-xl text-sm text-brown-dark break-all"
                  style={{ background: '#fef3e0' }}>
                  {value || '—'}
                </div>
              )}
            </div>
          ))}
        </div>

        {editing && (
          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            onClick={handleSave} disabled={loading}
            className="mt-5 px-8 py-3 rounded-full font-bold text-white text-sm transition-all"
            style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 4px 16px rgba(224,112,0,0.3)' }}>
            {loading ? 'Saving...' : '✅ Save Changes'}
          </motion.button>
        )}
      </div>
    </div>
  );
}