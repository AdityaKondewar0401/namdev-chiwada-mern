import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NAV_LINKS = [
  { label: 'Home', to: '/', icon: '🏠' },
  { label: 'Products', to: '/products', icon: '🍛' },
  { label: 'About', to: '/about', icon: '📜' },
  { label: 'Store Locator', to: '/contact', icon: '📍' },
  { label: 'Track Order', to: '/orders', icon: '📦' },
];

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
  },
  {
    label: 'Twitter / X',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
  },
  {
    label: 'YouTube',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" /></svg>
  },
  {
    label: 'Instagram',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path fill="#1a3a2a" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#1a3a2a" strokeWidth="2" strokeLinecap="round" /></svg>
  },
  {
    label: 'Email',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
  },
  {
    label: 'WhatsApp',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.528 5.855L.057 23.16a.75.75 0 0 0 .916.899l5.453-1.43A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 0 1-5.004-1.378l-.36-.214-3.733.979.997-3.645-.235-.374A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" /></svg>
  },
];

const SearchIcon = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
);

const CartIcon = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
);

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [desktopQuery, setDesktopQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
    setMobileSearchOpen(false);
    setDesktopSearchOpen(false);
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const shouldLock = menuOpen || mobileSearchOpen || desktopSearchOpen;
    if (!shouldLock) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [menuOpen, mobileSearchOpen, desktopSearchOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      setMobileSearchOpen(false);
      setDesktopSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  const submitSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    setMobileSearchOpen(false);
  };

  const submitDesktopSearch = (e) => {
    e.preventDefault();
    if (!desktopQuery.trim()) return;
    navigate(`/products?search=${encodeURIComponent(desktopQuery.trim())}`);
    setDesktopSearchOpen(false);
    setDesktopQuery('');
  };

  return (
    <>
      <div
        className={`relative w-full text-white text-xs font-medium py-1.5 md:py-2 px-4 md:px-6 flex items-center justify-between overflow-hidden transition-all duration-200 ${menuOpen ? 'invisible opacity-0' : 'visible opacity-100'}`}
        style={{ background: '#1a3a2a' }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)' }} />

        <div className="hidden sm:flex items-center gap-1.5 pr-4 mr-4 border-r border-white/15 flex-shrink-0">
          <span style={{ color: '#f0cc5a' }}>✦</span>
          <span className="font-bold tracking-wider" style={{ color: '#f0cc5a', fontSize: '0.68rem' }}>SINCE 1873</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="marquee-track flex gap-0 whitespace-nowrap" style={{ width: 'max-content' }}>
            {[...Array(4)].map((_, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-8">
                Welcome to the only official site of Namdev Chiwda. Please beware of other fraudulent sites with our name.
                <span className="text-white/30 mx-2">|</span>
              </span>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 ml-6 flex-shrink-0">
          {SOCIAL_LINKS.map(({ svg, label }) => (
            <button
              key={label}
              title={label}
              aria-label={label}
              className="text-white/60 hover:text-white transition-all duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0cc5a] rounded-sm"
            >
              {svg}
            </button>
          ))}
          <div className="w-px h-4 bg-white/20 mx-1" />
          {user ? (
            <button onClick={logout} title="Account" aria-label="Log out" className="text-white/70 hover:text-white transition-colors text-lg">👤</button>
          ) : (
            <Link to="/login" title="Login" className="text-white/70 hover:text-white transition-colors text-lg">👤</Link>
          )}
        </div>
      </div>

      <nav
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-200 ${menuOpen ? 'invisible opacity-0' : 'visible opacity-100'}`}
        style={{
          background: '#fffefb',
          borderBottom: '1px solid rgba(212,175,55,0.18)',
          boxShadow: scrolled ? '0 6px 24px rgba(45,26,0,0.08)' : 'none',
        }}
      >
        <div
          className={`max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 transition-all duration-200 ${scrolled ? 'min-h-[60px] md:min-h-[68px]' : 'min-h-[68px] md:min-h-[80px]'}`}
        >

          <Link to="/" className="flex items-center group flex-shrink-0">
            <img
              src="/images/logo.png"
              alt="Namdev Chiwda"
              className={`transition-all duration-300 group-hover:scale-105 object-contain ${scrolled ? 'h-[54px] w-[92px] md:h-[76px] md:w-[128px]' : 'h-[64px] w-[108px] md:h-[95px] md:w-[160px]'}`}
              style={{ objectFit: 'contain', imageRendering: '-webkit-optimize-contrast' }}
            />
          </Link>

          <div className="hidden md:flex items-center gap-1 mx-auto">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`relative px-5 py-2.5 font-poppins font-semibold text-base transition-colors duration-200 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron ${
                  isActive(l.to) ? 'text-saffron' : 'text-brown-dark hover:text-saffron'
                }`}
              >
                {isActive(l.to) && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: 'rgba(224,112,0,0.08)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{l.label}</span>
                {isActive(l.to) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0.5 left-5 right-5 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg,#e07000,#d4af37)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <AnimatePresence mode="wait" initial={false}>
              {desktopSearchOpen ? (
                <motion.form
                  key="search-field"
                  onSubmit={submitDesktopSearch}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 240, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                  className="flex items-center gap-2 rounded-full px-3 overflow-hidden flex-shrink-0"
                  style={{ height: 40, background: '#fef3e0', border: '1px solid rgba(224,112,0,0.25)' }}
                >
                  <span className="text-brown-mid/50 flex-shrink-0"><SearchIcon className="w-4 h-4" /></span>
                  <input
                    autoFocus
                    value={desktopQuery}
                    onChange={(e) => setDesktopQuery(e.target.value)}
                    placeholder="Search chiwda, farsan…"
                    className="flex-1 bg-transparent text-sm text-brown-dark placeholder:text-brown-mid/40 outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setDesktopSearchOpen(false)}
                    aria-label="Close search"
                    className="text-brown-mid/50 hover:text-brown-dark flex-shrink-0 text-sm"
                  >
                    ✕
                  </button>
                </motion.form>
              ) : (
                <motion.button
                  key="search-icon"
                  onClick={() => setDesktopSearchOpen(true)}
                  aria-label="Open search"
                  className="text-brown-dark hover:text-saffron transition-colors p-2 rounded-full hover:bg-saffron/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
                >
                  <SearchIcon />
                </motion.button>
              )}
            </AnimatePresence>

            <Link
              to="/cart"
              aria-label="Cart"
              className="relative p-2 text-brown-dark hover:text-saffron transition-colors rounded-full hover:bg-saffron/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
            >
              <CartIcon />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 hover:bg-saffron/8 border border-transparent hover:border-saffron/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 0 0 2px rgba(212,175,55,0.3)' }}
                  >
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      : user.name?.charAt(0).toUpperCase()
                    }
                  </div>
                  <span className="text-sm font-semibold text-brown-dark max-w-[90px] truncate">
                    {user.name?.split(' ')[0]}
                  </span>
                  <svg className="w-3.5 h-3.5 text-brown-mid/60 transition-transform duration-200 group-hover:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                  style={{ boxShadow: '0 16px 48px rgba(45,26,0,0.16)', border: '1px solid rgba(212,175,55,0.2)', background: '#fff' }}>
                  <div className="px-4 py-3 border-b border-saffron/10"
                    style={{ background: 'linear-gradient(135deg,#fff0d6,#fffdf7)' }}>
                    <div className="font-bold text-brown-dark text-sm truncate">{user.name}</div>
                    <div className="text-xs text-brown-mid/60 truncate">{user.email}</div>
                  </div>
                  <div className="py-2">
                    {[
                      user?.role === 'admin' ? { icon: '⚙️', label: 'Admin Panel', to: '/admin' } : null,
                      user?.role === 'partner' ? { icon: '🤝', label: 'My Consignments', to: '/partner/dashboard' } : null,
                      { icon: '👤', label: 'My Account', to: '/account' },
                      { icon: '📦', label: 'My Orders', to: '/orders' },
                      { icon: '❤️', label: 'Wishlist', to: '/wishlist' },
                    ].filter(Boolean).map(({ icon, label, to }) => (
                      <Link key={to} to={to}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-brown-dark hover:bg-saffron/6 hover:text-saffron transition-colors">
                        <span className="text-base">{icon}</span>
                        {label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-saffron/10 py-2">
                    <button onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <span className="text-base">🚪</span>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-brown-mid hover:text-saffron transition-colors px-3 py-2">
                Login
              </Link>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2 ml-auto">
            <button
              onClick={() => setMobileSearchOpen((s) => !s)}
              aria-label="Search"
              aria-expanded={mobileSearchOpen}
              className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron ${
                mobileSearchOpen ? 'border-saffron bg-saffron/8 text-saffron' : 'border-[rgba(212,175,55,0.3)] text-brown-dark'
              }`}>
              <SearchIcon />
            </button>

            <Link to="/cart" aria-label="Cart"
              className="relative flex items-center justify-center w-9 h-9 rounded-lg border text-brown-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
              style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
              <CartIcon className="w-[18px] h-[18px]" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
              className="flex flex-col items-center justify-center gap-[5px] w-9 h-9 rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
              style={{ borderColor: menuOpen ? '#e07000' : 'rgba(212,175,55,0.3)', background: menuOpen ? 'rgba(224,112,0,0.08)' : 'transparent' }}>
              <span className={`block w-4 h-0.5 bg-brown-dark transition-all duration-300 ${menuOpen ? 'translate-y-[6px] rotate-45' : ''}`} />
              <span className={`block w-4 h-0.5 bg-brown-dark transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-4 h-0.5 bg-brown-dark transition-all duration-300 ${menuOpen ? '-translate-y-[6px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden"
              style={{ borderTop: '1px solid rgba(212,175,55,0.15)' }}
            >
              <form onSubmit={submitSearch} className="flex items-center gap-2 px-4 py-3 mx-3 my-2 rounded-full" style={{ background: '#fef3e0' }}>
                <span className="text-brown-mid/50 flex-shrink-0"><SearchIcon className="w-4 h-4" /></span>
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for chiwda, farsan, bakarwadi…"
                  className="flex-1 bg-transparent text-sm text-brown-dark placeholder:text-brown-mid/40 focus:outline-none"
                />
                <button type="submit" className="text-xs font-bold text-saffron flex-shrink-0">Go</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 md:hidden"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              id="mobile-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-0 right-0 bottom-0 z-[60] md:hidden flex flex-col"
              style={{
                width: 'min(300px, 82vw)',
                background: 'linear-gradient(160deg, #2d1a00 0%, #3d1c00 55%, #4a2200 100%)',
                boxShadow: '-12px 0 48px rgba(0,0,0,0.45)',
              }}
            >
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(212,175,55,0.16)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 0 0 2px rgba(212,175,55,0.35)' }}>
                    N
                  </div>
                  <span className="text-white font-serif font-bold">Namdev Chiwda</span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0cc5a]"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">

                <div className="flex flex-col gap-0.5 mb-2">
                  {NAV_LINKS.map((l, i) => (
                    <motion.div
                      key={l.to}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 + 0.05 }}
                    >
                      <Link
                        to={l.to}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-base transition-all"
                        style={{
                          color: isActive(l.to) ? '#ffb347' : '#ffffff',
                          background: isActive(l.to) ? 'rgba(224,112,0,0.2)' : 'transparent',
                          borderLeft: `3px solid ${isActive(l.to) ? '#e07000' : 'transparent'}`,
                        }}
                      >
                        <span className="text-lg flex-shrink-0" aria-hidden="true">{l.icon}</span>
                        {l.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="h-px mx-2 my-3" style={{ background: 'rgba(212,175,55,0.16)' }} />

                {user ? (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl"
                      style={{ background: 'rgba(224,112,0,0.15)', border: '1px solid rgba(224,112,0,0.25)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 0 0 2px rgba(212,175,55,0.35)' }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm truncate text-white">{user.name}</div>
                        <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{user.email}</div>
                      </div>
                    </div>

                    {user?.role === 'admin' && (
                      <Link to="/admin"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                        style={{ color: '#ffb347' }}>
                        ⚙️ Admin Panel
                      </Link>
                    )}
                    {user?.role === 'partner' && (
                      <Link to="/partner/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                        style={{ color: '#ffb347' }}>
                        🤝 My Consignments
                      </Link>
                    )}
                    <Link to="/account"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                      style={{ color: 'rgba(255,255,255,0.9)' }}>
                      👤 My Account
                    </Link>
                    <Link to="/wishlist"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                      style={{ color: 'rgba(255,255,255,0.9)' }}>
                      ❤️ Wishlist
                    </Link>
                    <Link to="/orders"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                      style={{ color: 'rgba(255,255,255,0.9)' }}>
                      📦 My Orders
                    </Link>
                    <Link to="/cart"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                      style={{ color: 'rgba(255,255,255,0.9)' }}>
                      🛒 My Cart
                      {totalItems > 0 && (
                        <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                          {totalItems}
                        </span>
                      )}
                    </Link>

                    <div className="h-px mx-2 my-2" style={{ background: 'rgba(255,255,255,0.08)' }} />

                    <button
                      onClick={logout}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-left w-full transition-all"
                      style={{ color: '#fca5a5' }}>
                      🚪 Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 px-1 pt-1">
                    <Link to="/login"
                      className="py-3.5 rounded-xl font-bold text-center text-sm"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                      Sign In
                    </Link>
                    <Link to="/register"
                      className="py-3.5 rounded-xl font-bold text-center text-sm"
                      style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', color: '#fff', boxShadow: '0 4px 14px rgba(224,112,0,0.35)' }}>
                      Create Account
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 px-5 py-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  © Namdev Chiwda · Since 1873
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}