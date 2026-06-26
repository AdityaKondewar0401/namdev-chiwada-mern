import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'About', to: '/about' },
  { label: 'Store Locator', to: '/contact' },
  { label: 'Track Order', to: '/orders' },
];

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
  },
  {
    label: 'Twitter / X',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
  },
  {
    label: 'Instagram',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path fill="#1a0a00" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#1a0a00" strokeWidth="2" strokeLinecap="round" /></svg>
  },
  {
    label: 'WhatsApp',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.528 5.855L.057 23.16a.75.75 0 0 0 .916.899l5.453-1.43A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 0 1-5.004-1.378l-.36-.214-3.733.979.997-3.645-.235-.374A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" /></svg>
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();

  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location]);

  // Scroll detection for navbar shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const isActive = (to) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <>
      {/* ── Announcement Bar ── */}
      <AnimatePresence>
        {!menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #2d1200 50%, #1a0a00 100%)' }}>
            <div className="flex items-center justify-between px-6 py-2">

              {/* Scrolling marquee */}
              <div className="flex-1 overflow-hidden">
                <div className="marquee-track flex gap-0 whitespace-nowrap" style={{ width: 'max-content' }}>
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className="inline-flex items-center gap-3 px-8 text-xs font-medium"
                      style={{ color: 'rgba(201,169,97,0.9)', letterSpacing: '0.05em' }}>
                      <span style={{ color: '#C9A961' }}>✦</span>
                      Welcome to the only official site of Namdev Chiwada · Since 1873, Solapur
                      <span style={{ color: '#C9A961' }}>✦</span>
                      Beware of fraudulent sites using our name
                      <span style={{ color: 'rgba(201,169,97,0.3)', marginLeft: 16 }}>|</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Social icons */}
              <div className="hidden md:flex items-center gap-3 ml-6 flex-shrink-0">
                {SOCIAL_LINKS.map(({ svg, label }) => (
                  <motion.button
                    key={label}
                    title={label}
                    whileHover={{ scale: 1.15, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ color: 'rgba(201,169,97,0.6)' }}
                    className="hover:text-yellow-400 transition-colors duration-200">
                    {svg}
                  </motion.button>
                ))}

                <div className="w-px h-3 mx-1" style={{ background: 'rgba(201,169,97,0.2)' }} />

                {user ? (
                  <motion.button
                    onClick={logout}
                    whileHover={{ scale: 1.1 }}
                    style={{ color: 'rgba(201,169,97,0.7)', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.05em' }}
                    className="hover:text-yellow-400 transition-colors">
                    Sign Out
                  </motion.button>
                ) : (
                  <Link to="/login"
                    style={{ color: 'rgba(201,169,97,0.7)', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.05em' }}
                    className="hover:text-yellow-400 transition-colors">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Navbar ── */}
      <motion.nav
        animate={{
          boxShadow: scrolled
            ? '0 4px 32px rgba(107,44,44,0.12), 0 1px 0 rgba(201,169,97,0.15)'
            : '0 1px 0 rgba(232,213,181,0.4)',
        }}
        transition={{ duration: 0.3 }}
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${menuOpen ? 'invisible opacity-0' : 'visible opacity-100'}`}
        style={{ background: '#FFFFFF' }}>

        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8"
          style={{ height: scrolled ? 68 : 80, transition: 'height 0.3s ease' }}>

          {/* Logo */}
          <Link to="/" className="flex items-center group flex-shrink-0">
            <motion.img
              src="/images/logo.png"
              alt="Namdev Chiwada"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                height: scrolled ? '52px' : '62px',
                width: scrolled ? '110px' : '130px',
                objectFit: 'contain',
                transition: 'all 0.3s ease',
                imageRendering: '-webkit-optimize-contrast',
              }}
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-0 mx-auto">
            {NAV_LINKS.map((l, i) => (
              <motion.div key={l.to} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}>
                <Link
                  to={l.to}
                  className="relative px-5 py-2 group"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: '0.02em',
                    color: isActive(l.to) ? '#6B2C2C' : '#333333',
                    transition: 'color 0.2s ease',
                  }}>
                  <span className="relative z-10 group-hover:text-maroon"
                    style={{ color: isActive(l.to) ? '#6B2C2C' : 'inherit' }}>
                    {l.label}
                  </span>

                  {/* Hover background */}
                  <motion.span
                    className="absolute inset-0 rounded-md"
                    style={{ background: 'rgba(107,44,44,0.04)' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                  />

                  {/* Active / hover underline */}
                  <motion.span
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6B2C2C, #C9A961)' }}
                    initial={false}
                    animate={{ scaleX: isActive(l.to) ? 1 : 0, opacity: isActive(l.to) ? 1 : 0 }}
                    whileHover={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">

            {/* Search */}
            <AnimatePresence mode="wait">
              {searchOpen ? (
                <motion.div
                  key="search-open"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex items-center overflow-hidden rounded-lg"
                  style={{ border: '1.5px solid #6B2C2C', background: '#FFF' }}>
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 px-3 py-1.5 text-sm outline-none bg-transparent"
                    style={{ fontFamily: "'Inter', sans-serif", color: '#333', fontSize: '0.82rem' }}
                    onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                  />
                  <button onClick={() => setSearchOpen(false)} className="px-2 py-1.5"
                    style={{ color: '#6B2C2C' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-closed"
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(107,44,44,0.06)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 rounded-lg transition-colors"
                  style={{ color: '#6B2C2C' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Cart */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/cart" className="relative p-2.5 rounded-lg flex items-center justify-center"
                style={{ color: '#6B2C2C' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
                </svg>
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold rounded-full"
                      style={{ background: '#6B2C2C', fontFamily: "'Inter', sans-serif" }}>
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>

            {/* Divider */}
            <div className="w-px h-6 mx-1" style={{ background: '#E8D5B5' }} />

            {/* User */}
            {user ? (
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
                  style={{ border: '1px solid transparent' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#E8D5B5'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,#6B2C2C,#9B3D3D)' }}>
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                      : user.name?.charAt(0).toUpperCase()
                    }
                  </div>
                  <span className="text-sm font-medium max-w-[80px] truncate"
                    style={{ color: '#333', fontFamily: "'Inter', sans-serif" }}>
                    {user.name?.split(' ')[0]}
                  </span>
                  <svg className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180"
                    style={{ color: '#999' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                  style={{
                    boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(107,44,44,0.08)',
                    border: '1px solid #E8D5B5',
                    background: '#fff',
                  }}>

                  {/* User info header */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: '#F5F1E8', background: '#F5F1E8' }}>
                    <div className="font-semibold text-sm truncate" style={{ color: '#333', fontFamily: "'Inter', sans-serif" }}>{user.name}</div>
                    <div className="text-xs truncate mt-0.5" style={{ color: '#666' }}>{user.email}</div>
                  </div>

                  <div className="py-1.5">
                    {[
                      user?.role === 'admin' ? { icon: '⚙️', label: 'Admin Panel', to: '/admin' } : null,
                      { icon: '👤', label: 'My Account', to: '/account' },
                      { icon: '📦', label: 'My Orders', to: '/orders' },
                      { icon: '❤️', label: 'Wishlist', to: '/account?tab=wishlist' },
                    ].filter(Boolean).map(({ icon, label, to }) => (
                      <Link key={to} to={to}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                        style={{ color: '#333', fontFamily: "'Inter', sans-serif" }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F5F1E8'; e.currentTarget.style.color = '#6B2C2C'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#333'; }}>
                        <span className="text-base w-5">{icon}</span>
                        {label}
                      </Link>
                    ))}
                  </div>

                  <div className="border-t py-1.5" style={{ borderColor: '#F5F1E8' }}>
                    <button onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: '#6B2C2C', fontFamily: "'Inter', sans-serif" }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span className="text-base w-5">🚪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                  style={{
                    color: '#6B2C2C',
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: '0.02em',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,44,44,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Sign In
                </Link>
                <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/register"
                    className="px-5 py-2 text-sm font-medium rounded-lg text-white"
                    style={{
                      background: 'linear-gradient(135deg, #6B2C2C, #8B3A3A)',
                      fontFamily: "'Inter', sans-serif",
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      boxShadow: '0 2px 8px rgba(107,44,44,0.3)',
                    }}>
                    Get Started
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex md:hidden items-center gap-1 ml-auto">
            <Link to="/cart" className="relative p-2.5" style={{ color: '#6B2C2C' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-white text-[9px] font-bold rounded-full"
                  style={{ background: '#6B2C2C' }}>
                  {totalItems}
                </span>
              )}
            </Link>

            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              whileTap={{ scale: 0.92 }}
              className="flex flex-col gap-1.5 p-2.5 rounded-lg"
              style={{ color: '#6B2C2C' }}>
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                className="block w-5 h-0.5 rounded-full origin-center"
                style={{ background: '#6B2C2C' }}
                transition={{ duration: 0.25 }}
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                className="block w-5 h-0.5 rounded-full"
                style={{ background: '#6B2C2C' }}
                transition={{ duration: 0.25 }}
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className="block w-5 h-0.5 rounded-full origin-center"
                style={{ background: '#6B2C2C' }}
                transition={{ duration: 0.25 }}
              />
            </motion.button>
          </div>
        </div>

        {/* Gold accent line at bottom */}
        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #E8D5B5 20%, #C9A961 50%, #E8D5B5 80%, transparent 100%)' }} />
      </motion.nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 md:hidden"
              style={{ background: 'rgba(26,10,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-0 right-0 bottom-0 z-[60] md:hidden flex flex-col"
              style={{
                width: 'min(320px, 85vw)',
                background: '#FFFFFF',
                boxShadow: '-16px 0 64px rgba(0,0,0,0.2)',
              }}>

              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid #E8D5B5', background: '#F5F1E8' }}>
                <div className="flex items-center gap-3">
                  <img src="/images/logo.png" alt="Namdev Chiwada"
                    style={{ height: 40, width: 80, objectFit: 'contain' }} />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: 'rgba(107,44,44,0.08)', color: '#6B2C2C' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto">

                {/* Nav Links */}
                <div className="px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-2"
                    style={{ color: '#C9A961', fontFamily: "'Inter', sans-serif", letterSpacing: '0.12em' }}>
                    Navigation
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {NAV_LINKS.map((l, i) => (
                      <motion.div key={l.to}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.1 }}>
                        <Link to={l.to}
                          className="flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200"
                          style={{
                            background: isActive(l.to) ? 'rgba(107,44,44,0.08)' : 'transparent',
                            color: isActive(l.to) ? '#6B2C2C' : '#333',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: isActive(l.to) ? 600 : 400,
                            fontSize: '0.95rem',
                            borderLeft: isActive(l.to) ? '3px solid #6B2C2C' : '3px solid transparent',
                          }}>
                          {l.label}
                          {isActive(l.to) && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A961' }} />
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px mx-4" style={{ background: '#E8D5B5' }} />

                {/* Auth Section */}
                <div className="px-4 py-4">
                  {user ? (
                    <>
                      {/* User Card */}
                      <div className="flex items-center gap-3 p-4 rounded-xl mb-4"
                        style={{ background: '#F5F1E8', border: '1px solid #E8D5B5' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#6B2C2C,#9B3D3D)' }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate" style={{ color: '#333', fontFamily: "'Inter', sans-serif" }}>{user.name}</div>
                          <div className="text-xs truncate" style={{ color: '#666' }}>{user.email}</div>
                        </div>
                      </div>

                      <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-2"
                        style={{ color: '#C9A961', fontFamily: "'Inter', sans-serif", letterSpacing: '0.12em' }}>
                        Account
                      </p>

                      {[
                        user?.role === 'admin' ? { icon: '⚙️', label: 'Admin Panel', to: '/admin', gold: true } : null,
                        { icon: '👤', label: 'My Account', to: '/account' },
                        { icon: '📦', label: 'My Orders', to: '/orders' },
                        { icon: '🛒', label: 'My Cart', to: '/cart', badge: totalItems },
                        { icon: '❤️', label: 'Wishlist', to: '/account?tab=wishlist' },
                      ].filter(Boolean).map(({ icon, label, to, badge, gold }) => (
                        <Link key={to} to={to}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg mb-0.5 transition-colors"
                          style={{
                            color: gold ? '#C9A961' : '#333',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.9rem',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F5F1E8'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span className="text-base">{icon}</span>
                          {label}
                          {badge > 0 && (
                            <span className="ml-auto w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold rounded-full"
                              style={{ background: '#6B2C2C' }}>
                              {badge}
                            </span>
                          )}
                        </Link>
                      ))}

                      <div className="h-px my-3" style={{ background: '#E8D5B5' }} />

                      <button onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left"
                        style={{ color: '#6B2C2C', fontFamily: "'Inter', sans-serif", fontSize: '0.9rem' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span>🚪</span> Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-3 pt-2">
                      <Link to="/login"
                        className="py-3.5 rounded-xl font-medium text-center text-sm border-2 transition-all"
                        style={{
                          borderColor: '#6B2C2C',
                          color: '#6B2C2C',
                          fontFamily: "'Inter', sans-serif",
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          fontSize: '0.78rem',
                        }}>
                        Sign In
                      </Link>
                      <Link to="/register"
                        className="py-3.5 rounded-xl font-medium text-center text-sm text-white transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #6B2C2C, #8B3A3A)',
                          fontFamily: "'Inter', sans-serif",
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          fontSize: '0.78rem',
                          boxShadow: '0 4px 16px rgba(107,44,44,0.3)',
                        }}>
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between"
                style={{ borderTop: '1px solid #E8D5B5', background: '#F5F1E8' }}>
                <p className="text-xs" style={{ color: '#999', fontFamily: "'Inter', sans-serif" }}>
                  © Namdev Chiwada · Est. 1873
                </p>
                <div className="flex items-center gap-2">
                  {SOCIAL_LINKS.slice(0, 3).map(({ svg, label }) => (
                    <button key={label} title={label}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: '#6B2C2C' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,44,44,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {svg}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
