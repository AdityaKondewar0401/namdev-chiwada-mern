import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { orderAPI, wishlistAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

// ── Sidebar Tabs ───────────────────────────────────────
const TABS = [
  { id: 'profile',  icon: '👤', label: 'My Profile' },
  { id: 'orders',   icon: '📦', label: 'My Orders' },
  { id: 'wishlist', icon: '❤️', label: 'Wishlist' },
  { id: 'address',  icon: '📍', label: 'Address' },
];

const ORDER_STATUS_COLORS = {
  pending:    { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  confirmed:  { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  processing: { bg: '#f5f3ff', text: '#6d28d9', dot: '#8b5cf6' },
  shipped:    { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' },
  delivered:  { bg: '#f0fdf4', text: '#166534', dot: '#22c55e' },
  cancelled:  { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' },
};

// ── Profile Tab ────────────────────────────────────────
function ProfileTab({ user, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

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
      <div className="rounded-2xl p-6 mb-6 flex items-center gap-5"
        style={{ background: 'linear-gradient(135deg,#fff0d6,#fffdf7)', border: '1px solid rgba(224,112,0,0.12)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-black flex-shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 8px 24px rgba(224,112,0,0.3)' }}>
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            : user?.name?.charAt(0).toUpperCase()
          }
        </div>
        <div>
          <div className="font-serif font-black text-brown-dark text-xl">{user?.name}</div>
          <div className="text-sm text-brown-mid/60 mt-0.5">{user?.email}</div>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: user?.role === 'admin' ? '#fef3c7' : '#f0fdf4', color: user?.role === 'admin' ? '#92400e' : '#166534' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: user?.role === 'admin' ? '#f59e0b' : '#22c55e' }} />
            {user?.role === 'admin' ? 'Admin' : 'Member'}
          </div>
        </div>
      </div>

      {/* Info fields */}
      <div className="bg-white rounded-2xl p-6 mb-4"
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
            { label: 'Full Name', key: 'name', value: user?.name, type: 'text' },
            { label: 'Email Address', key: 'email', value: user?.email, type: 'email', readOnly: true },
            { label: 'Phone Number', key: 'phone', value: user?.phone || '—', type: 'tel' },
            { label: 'Account Type', key: 'role', value: user?.role === 'admin' ? 'Administrator' : 'Customer', type: 'text', readOnly: true },
          ].map(({ label, key, value, type, readOnly }) => (
            <div key={key}>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/60 mb-1.5">
                {label}
              </label>
              {editing && !readOnly ? (
                <input
                  type={type}
                  value={form[key] || ''}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-brown-dark border outline-none transition-all"
                  style={{ borderColor: 'rgba(224,112,0,0.3)', background: '#fffdf7' }}
                  onFocus={e => e.target.style.borderColor = '#e07000'}
                  onBlur={e => e.target.style.borderColor = 'rgba(224,112,0,0.3)'}
                />
              ) : (
                <div className="px-3 py-2.5 rounded-xl text-sm text-brown-dark"
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

// ── Orders Tab ─────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    orderAPI.getAll()
      .then(res => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl skeleton" />)}
    </div>
  );

  if (orders.length === 0) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📦</div>
      <h3 className="font-serif font-bold text-brown-dark text-xl mb-2">No orders yet</h3>
      <p className="text-brown-mid/60 text-sm mb-6">Start shopping to see your orders here</p>
      <Link to="/products" className="inline-block px-6 py-3 rounded-full font-bold text-white text-sm"
        style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
        Browse Products →
      </Link>
    </div>
  );

  return (
    <div>
      <h2 className="font-serif font-black text-brown-dark text-2xl mb-6">
        My Orders <span className="text-lg text-brown-mid/50 font-normal">({orders.length})</span>
      </h2>

      <div className="space-y-4">
        {orders.map((order) => {
          const sc = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pending;
          const isOpen = expanded === order._id;

          return (
            <div key={order._id} className="bg-white rounded-2xl overflow-hidden transition-all"
              style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>

              {/* Order header */}
              <div className="p-5 flex items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : order._id)}>
                <div className="flex items-center gap-4">
                  {/* Product thumbnails */}
                  <div className="flex -space-x-2">
                    {order.items?.slice(0, 3).map((item, i) => (
                      <img key={i} src={item.img} alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white flex-shrink-0" />
                    ))}
                    {order.items?.length > 3 && (
                      <div className="w-12 h-12 rounded-xl border-2 border-white flex items-center justify-center text-xs font-bold text-brown-mid"
                        style={{ background: '#fef3e0' }}>
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-brown-dark text-sm">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-xs text-brown-mid/60 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      · {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div>
                    <div className="font-black text-saffron text-base">₹{order.total}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1.5"
                    style={{ background: sc.bg, color: sc.text }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                    {order.status}
                  </span>
                  <svg className={`w-4 h-4 text-brown-mid/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded order details */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: 'rgba(224,112,0,0.08)', background: '#fffdf7' }}>

                      {/* Items list */}
                      <div className="space-y-3 mb-4">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <img src={item.img} alt={item.name}
                              className="w-14 h-16 rounded-xl object-cover flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-semibold text-brown-dark text-sm">{item.name}</div>
                              <div className="text-xs text-brown-mid/60">{item.size} × {item.qty}</div>
                            </div>
                            <div className="font-bold text-saffron">₹{item.price * item.qty}</div>
                          </div>
                        ))}
                      </div>

                      {/* Price breakdown */}
                      <div className="rounded-xl p-4 text-sm space-y-1.5"
                        style={{ background: '#fef3e0' }}>
                        <div className="flex justify-between text-brown-mid/70">
                          <span>Subtotal</span><span>₹{order.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-brown-mid/70">
                          <span>Delivery</span>
                          <span className={order.shippingCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                            {order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}
                          </span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span><span>−₹{order.discount}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-brown-dark border-t pt-1.5"
                          style={{ borderColor: 'rgba(224,112,0,0.15)' }}>
                          <span>Total</span><span>₹{order.total}</span>
                        </div>
                      </div>

                      {/* Delivery address */}
                      {order.shippingAddress && (
                        <div className="mt-3 text-xs text-brown-mid/60">
                          <span className="font-semibold text-brown-dark">Delivered to: </span>
                          {order.shippingAddress.name}, {order.shippingAddress.street}, {order.shippingAddress.city} – {order.shippingAddress.pincode}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Wishlist Tab ───────────────────────────────────────
function WishlistTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    wishlistAPI.get()
      .then(res => setItems(res.data.wishlist || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    await wishlistAPI.toggle(productId);
    setItems(prev => prev.filter(p => p._id !== productId));
    toast.success('Removed from wishlist');
  };

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl skeleton" />)}
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">❤️</div>
      <h3 className="font-serif font-bold text-brown-dark text-xl mb-2">Wishlist is empty</h3>
      <p className="text-brown-mid/60 text-sm mb-6">Save products you love for later</p>
      <Link to="/products" className="inline-block px-6 py-3 rounded-full font-bold text-white text-sm"
        style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
        Browse Products →
      </Link>
    </div>
  );

  return (
    <div>
      <h2 className="font-serif font-black text-brown-dark text-2xl mb-6">
        Wishlist <span className="text-lg text-brown-mid/50 font-normal">({items.length})</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((product) => (
          <motion.div key={product._id} layout
            className="bg-white rounded-2xl overflow-hidden group cursor-pointer"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}
            whileHover={{ y: -4 }}>
            <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}
              onClick={() => navigate(`/products/${product._id}`)}>
              <img src={product.img} alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <button onClick={(e) => { e.stopPropagation(); handleRemove(product._id); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-400 hover:text-red-600 transition-colors shadow-md">
                ♥
              </button>
            </div>
            <div className="p-4">
              <div className="font-serif font-bold text-brown-dark text-sm mb-0.5 truncate">{product.name}</div>
              <div className="font-black text-saffron">₹{product.price}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Address Tab ────────────────────────────────────────
function AddressTab({ user, onUpdate }) {
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

      <div className="bg-white rounded-2xl p-6"
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
          <div className="p-4 rounded-xl text-sm leading-relaxed text-brown-dark"
            style={{ background: '#fef3e0' }}>
            <div className="font-semibold mb-1">{user.name}</div>
            <div className="text-brown-mid/70">
              {user.address.street}<br />
              {user.address.city}, {user.address.state} – {user.address.pincode}
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
                  onFocus={e => e.target.style.borderColor = '#e07000'}
                  onBlur={e => e.target.style.borderColor = 'rgba(224,112,0,0.3)'}
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

// ── MAIN ACCOUNT PAGE ──────────────────────────────────
export default function AccountPage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  // Redirect if not logged in
  if (!user) {
    navigate('/login');
    return null;
  }

  const setTab = (tab) => setSearchParams({ tab });

  const handleUpdate = async (data) => {
    await updateProfile(data);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <PageWrapper>
      <div className="min-h-screen pb-16" style={{ background: '#fef3e0' }}>
        {/* Page Header */}
        <div className="pt-10 pb-8 px-6"
          style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300 60%,#e07000)' }}>
          <div className="max-w-5xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-white/50 mb-3">
              <Link to="/" className="hover:text-white">Home</Link>
              <span>›</span>
              <span className="text-white">My Account</span>
            </nav>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-black overflow-hidden flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : user.name?.charAt(0).toUpperCase()
                }
              </div>
              <div>
                <h1 className="font-serif font-black text-white text-2xl">Hello, {user.name?.split(' ')[0]}! 👋</h1>
                <p className="text-white/60 text-sm">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">

            {/* Sidebar */}
            <div className="bg-white rounded-2xl overflow-hidden lg:sticky lg:top-28"
              style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
              <div className="p-3">
                {TABS.map((tab) => (
                  <button key={tab.id} onClick={() => setTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mb-1 ${
                      activeTab === tab.id
                        ? 'text-white'
                        : 'text-brown-dark hover:bg-saffron/6 hover:text-saffron'
                    }`}
                    style={activeTab === tab.id ? { background: 'linear-gradient(135deg,#e07000,#ff9010)' } : {}}>
                    <span className="text-base">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Logout in sidebar */}
              <div className="border-t p-3" style={{ borderColor: 'rgba(224,112,0,0.08)' }}>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all">
                  <span>🚪</span> Logout
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl p-6 min-h-96"
              style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}>
                  {activeTab === 'profile'  && <ProfileTab user={user} onUpdate={handleUpdate} />}
                  {activeTab === 'orders'   && <OrdersTab />}
                  {activeTab === 'wishlist' && <WishlistTab />}
                  {activeTab === 'address'  && <AddressTab user={user} onUpdate={handleUpdate} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
