import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { orderAPI, wishlistAPI } from '../services/api';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import { SITE_NAME } from '../config/seo.config';

import AccountNav from '../components/account/AccountNav';
import ProfileTab from '../components/account/ProfileTab';
import OrdersTab from '../components/account/OrdersTab';
import WishlistTab from '../components/account/WishlistTab';
import AddressTab from '../components/account/AddressTab';

// ─────────────────────────────────────────────
// AccountPage — REDESIGNED shell
//
// Structural change: orders and wishlist are now fetched once HERE
// (instead of independently inside OrdersTab/WishlistTab) so the new
// header stats strip (Orders / Total Spent / Wishlist / Member Since)
// can be computed from real data, and so switching between the Orders
// and Wishlist tabs doesn't re-fetch each time.
//
// Trade-off worth knowing: previously, orders/wishlist were only
// fetched once you actually opened that tab (lazy). Now both fetch
// immediately when the account page loads, so the stats strip has
// data right away. That's two extra lightweight "get my own
// orders/wishlist" calls up front — reasonable for a private account
// page, but flagging the behavior change since it wasn't there before.
//
// Also fixed: the old version called `navigate('/login')` directly
// in the render body when `!user`, which is a React anti-pattern
// (side effect during render). That redirect now happens in a
// `useEffect`, same fix pattern as the Navbar/Admin work.
// ─────────────────────────────────────────────
export default function AccountPage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    orderAPI.getAll()
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
    wishlistAPI.get()
      .then((res) => setWishlist(res.data.wishlist || []))
      .catch(() => {})
      .finally(() => setWishlistLoading(false));
  }, [user]);

  if (!user) return null;

  const setTab = (tab) => setSearchParams({ tab });
  const handleUpdate = async (data) => { await updateProfile(data); };
  const handleLogout = () => { logout(); navigate('/'); };

  const totalSpent = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '—';

  const STATS = [
    { icon: '📦', label: 'Orders', value: ordersLoading ? '—' : orders.length },
    { icon: '💰', label: 'Total Spent', value: ordersLoading ? '—' : `₹${totalSpent.toLocaleString()}` },
    { icon: '❤️', label: 'Wishlist', value: wishlistLoading ? '—' : wishlist.length },
    { icon: '🗓️', label: 'Member Since', value: memberSince },
  ];

  return (
    <PageWrapper>
      <SEO title={`My Account | ${SITE_NAME}`} canonical="/account" robots="noindex,nofollow" />
      <div className="min-h-screen pb-16" style={{ background: '#fef3e0' }}>
        {/* Page Header */}
        <div className="pt-8 pb-8 px-5 sm:px-6"
          style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300 60%,#e07000)' }}>
          <div className="max-w-5xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-white/50 mb-4">
              <Link to="/" className="hover:text-white">Home</Link>
              <span>›</span>
              <span className="text-white">My Account</span>
            </nav>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-2xl font-black overflow-hidden flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(212,175,55,0.5)' }}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : user.name?.charAt(0).toUpperCase()
                }
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-serif font-black text-white text-xl sm:text-2xl truncate">Hello, {user.name?.split(' ')[0]}! 👋</h1>
                <p className="text-white/60 text-sm break-all">{user.email}</p>
              </div>
            </div>

            {/* Stats strip — NEW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="font-black text-white text-base sm:text-lg leading-tight">{s.value}</div>
                  <div className="text-[10px] sm:text-xs text-white/50 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 lg:gap-6 items-start">

            <AccountNav
              activeTab={activeTab}
              onTabChange={setTab}
              ordersCount={orders.length}
              wishlistCount={wishlist.length}
              onLogout={handleLogout}
            />

            {/* Main Content */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 min-h-96"
              style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}>
                  {activeTab === 'profile'  && <ProfileTab user={user} onUpdate={handleUpdate} />}
                  {activeTab === 'orders'   && <OrdersTab orders={orders} loading={ordersLoading} />}
                  {activeTab === 'wishlist' && <WishlistTab items={wishlist} setItems={setWishlist} loading={wishlistLoading} />}
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