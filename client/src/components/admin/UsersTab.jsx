import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Users, ShieldCheck, User, Package, Wallet, Calendar, Heart, Search, X, ChevronRight } from 'lucide-react';
import { userAPI } from '../../services/api';
import { ROLE_CONFIG, STATUS_CONFIG } from './adminConstants';
import { Panel, StatTile, Pill, Avatar } from './AdminUI';

// ─────────────────────────────────────────────
// UsersTab — brand-new admin surface (no user-management UI existed
// anywhere in the app before this). Fetches every user (via the new
// GET /api/users/admin endpoint, which already attaches per-user order
// count/lifetime spend/last-order-date in one aggregate query) and lets
// the admin search/filter the list, then drill into any one user for a
// full detail view (GET /api/users/admin/:id) — profile, address, and
// recent order history.
//
// Visual pattern mirrors ProfileTab.jsx's summary-card + info-grid
// layout and AccountPage.jsx's KPI-tile strip so it reads as part of the
// same app instead of a bolted-on feature.
// ─────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function roleCfg(role) {
  return ROLE_CONFIG[role] || ROLE_CONFIG.user;
}

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailCache = useMemo(() => new Map(), []);

  useEffect(() => {
    userAPI.getAll()
      .then((res) => setUsers(res.data.users || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    customers: users.filter((u) => u.role !== 'admin').length,
    totalOrders: users.reduce((sum, u) => sum + (u.orderCount || 0), 0),
  };

  async function openUser(id) {
    setSelectedId(id);
    if (detailCache.has(id)) {
      setDetail(detailCache.get(id));
      return;
    }
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await userAPI.getOne(id);
      const payload = { user: res.data.user, stats: res.data.stats, recentOrders: res.data.recentOrders || [] };
      detailCache.set(id, payload);
      setDetail(payload);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load user');
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeUser() {
    setSelectedId(null);
    setDetail(null);
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-serif font-black text-brown-dark text-2xl">Users</h2>
          <p className="text-xs text-brown-mid/50">Every registered account, with orders and spend at a glance.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-mid/40 pointer-events-none" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="form-input text-sm w-full pl-9"
          />
        </div>
      </div>

      {/* Directory-wide analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatTile icon={<Users size={19} />} label="Total Users" value={stats.total} color="#e07000" />
        <StatTile icon={<ShieldCheck size={19} />} label="Admins" value={stats.admins} color="#b45309" />
        <StatTile icon={<User size={19} />} label="Customers" value={stats.customers} color="#15803d" />
        <StatTile icon={<Package size={19} />} label="Orders Placed" value={stats.totalOrders} color="#7c3aed" />
      </div>

      {/* Role filter */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {['all', 'user', 'admin'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className="px-4 py-2 rounded-full text-xs font-bold transition-all"
            style={{
              minHeight: 36,
              border: `1.5px solid ${roleFilter === r ? '#e07000' : 'rgba(224,112,0,0.2)'}`,
              background: roleFilter === r ? '#e07000' : '#fff',
              color: roleFilter === r ? '#fff' : '#9a7c5a',
            }}
          >
            {r === 'all' ? `All (${users.length})` : r === 'admin' ? `Admins (${stats.admins})` : `Customers (${stats.customers})`}
          </button>
        ))}
      </div>

      {/* User list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-brown-mid/50">No users found</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((u) => {
            const cfg = roleCfg(u.role);
            return (
              <button
                key={u._id}
                onClick={() => openUser(u._id)}
                className="w-full text-left bg-white rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 transition-shadow hover:shadow-md"
                style={{ boxShadow: '0 2px 12px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}
              >
                <Avatar name={u.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-brown-dark text-sm truncate">{u.name}</span>
                    <Pill color={cfg.color} bg={cfg.bg} border={cfg.border}>{cfg.label}</Pill>
                  </div>
                  <div className="text-xs text-brown-mid/50 truncate">{u.email}</div>
                </div>
                <div className="hidden sm:block text-right flex-shrink-0">
                  <div className="text-xs font-bold text-brown-dark">{u.orderCount} order{u.orderCount === 1 ? '' : 's'}</div>
                  <div className="text-[11px] text-brown-mid/50">₹{(u.lifetimeSpend || 0).toLocaleString()} spent</div>
                </div>
                <div className="hidden md:block text-right flex-shrink-0 w-28">
                  <div className="text-[11px] text-brown-mid/50">Joined</div>
                  <div className="text-xs font-semibold text-brown-dark">{formatDate(u.createdAt)}</div>
                </div>
                <ChevronRight size={16} className="text-brown-mid/30 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <UserDetailSheet
            loading={detailLoading}
            detail={detail}
            onClose={closeUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserDetailSheet({ loading, detail, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(45,26,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 sm:px-6 py-4 border-b z-10" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
          <span className="text-xs font-bold uppercase tracking-widest text-brown-mid/40">User Details</span>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-brown-dark hover:bg-saffron/10">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {loading || !detail ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}</div>
          ) : (
            <UserDetailContent detail={detail} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function UserDetailContent({ detail }) {
  const { user, stats, recentOrders } = detail;
  const cfg = roleCfg(user.role);
  const addr = user.address || {};
  const hasAddress = addr.street || addr.city || addr.state || addr.pincode;

  return (
    <>
      {/* Summary card */}
      <div className="rounded-2xl p-5 flex items-center gap-4 flex-wrap"
        style={{ background: 'linear-gradient(135deg,#fff0d6,#fffdf7)', border: '1px solid rgba(224,112,0,0.12)' }}>
        <Avatar name={user.name} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-serif font-black text-brown-dark text-lg truncate">{user.name}</h3>
            <Pill color={cfg.color} bg={cfg.bg} border={cfg.border}>{cfg.label}</Pill>
            {user.googleId && <Pill color="#1d4ed8" bg="#dbeafe" border="#bfdbfe">Google</Pill>}
          </div>
          <div className="text-sm text-brown-mid/70 break-all">{user.email}</div>
          <div className="text-xs text-brown-mid/50 mt-1">
            {user.phone ? `${user.phone} · ` : ''}Joined {formatDate(user.createdAt)}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={<Package size={19} />} label="Orders" value={stats.orderCount} color="#e07000" />
        <StatTile icon={<Wallet size={19} />} label="Lifetime Spend" value={`₹${(stats.lifetimeSpend || 0).toLocaleString()}`} color="#2d5a1b" />
        <StatTile icon={<Calendar size={19} />} label="Last Order" value={formatDate(stats.lastOrderAt)} color="#7c3aed" />
        <StatTile icon={<Heart size={19} />} label="Wishlist" value={stats.wishlistCount} color="#dc2626" />
      </div>

      {/* Address */}
      <Panel title="Address">
        {hasAddress ? (
          <div className="text-sm text-brown-dark leading-relaxed">
            {addr.street && <div>{addr.street}</div>}
            <div>{[addr.city, addr.state].filter(Boolean).join(', ')} {addr.pincode ? `— ${addr.pincode}` : ''}</div>
          </div>
        ) : (
          <div className="text-sm text-brown-mid/40">No address on file</div>
        )}
      </Panel>

      {/* Recent orders */}
      <Panel title="Recent Orders" action={stats.orderCount > 5 && (
        <span className="text-[10px] text-brown-mid/40">Showing 5 of {stats.orderCount}</span>
      )}>
        {recentOrders.length === 0 ? (
          <div className="text-sm text-brown-mid/40 text-center py-4">No orders yet</div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((o) => {
              const scfg = STATUS_CONFIG[o.status?.toLowerCase()] || STATUS_CONFIG.pending;
              return (
                <div key={o._id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl" style={{ background: '#fef3e0' }}>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold text-brown-dark">#{o._id.slice(-8).toUpperCase()}</div>
                    <div className="text-[11px] text-brown-mid/50">{formatDate(o.createdAt)} · {o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-brown-dark">₹{(o.total || 0).toLocaleString()}</div>
                    <Pill color={scfg.color} bg={scfg.bg} border={scfg.border}>{o.status}</Pill>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Wishlist */}
      {user.wishlist?.length > 0 && (
        <Panel title={`Wishlist (${user.wishlist.length})`}>
          <div className="flex flex-wrap gap-2">
            {user.wishlist.map((p) => (
              <div key={p._id} className="flex items-center gap-2 pr-3 rounded-full" style={{ background: '#fef3e0' }}>
                {p.img && <img src={p.img} alt={p.name} className="w-7 h-7 rounded-full object-cover" />}
                <span className="text-xs font-semibold text-brown-dark py-1.5">{p.name}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
