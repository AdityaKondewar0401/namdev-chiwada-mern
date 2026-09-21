import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';

// Sub-nav shell for every /b2b/* page (spec §8.3). Visually modeled on
// AccountNav/AdminNav (pills on mobile, sidebar on desktop) but uses
// real <Link>s + useLocation instead of a tab-click callback, since
// these are separate ROUTES, not tabs within one page.
//
// Only "/b2b" itself is mounted in Phase 2 — the other five items will
// 404 via the catch-all route until Phase 3/4 add their pages. The nav
// itself ships now (as the spec's own Phase 2 file list asks for)
// rather than being rebuilt later.
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/b2b' },
  { label: 'Quick Order', to: '/b2b/order' },
  { label: 'Orders', to: '/b2b/orders' },
  { label: 'Invoices', to: '/b2b/invoices' },
  { label: 'Statement', to: '/b2b/statement' },
  { label: 'Profile', to: '/b2b/profile' },
];

export default function B2BLayout({ children }) {
  const location = useLocation();
  const activeRef = useRef(null);

  const isActive = (to) => (to === '/b2b' ? location.pathname === '/b2b' : location.pathname.startsWith(to));

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen" style={{ background: '#fef3e0' }}>
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4 lg:gap-6 items-start">
          {/* MOBILE / TABLET: horizontally scrollable pill bar, active pill auto-centered */}
          <div className="lg:hidden -mx-4 px-4 pb-1 overflow-x-auto">
            <div className="flex items-center gap-2 w-max">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    ref={active ? activeRef : null}
                    className="flex items-center px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
                    style={{
                      height: 44,
                      ...(active
                        ? { background: 'linear-gradient(135deg,#e07000,#ff9010)', color: '#fff', boxShadow: '0 4px 14px rgba(224,112,0,0.3)' }
                        : { background: '#fff', color: '#2d1a00', border: '1px solid rgba(224,112,0,0.15)' }),
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* DESKTOP: vertical sidebar */}
          <div
            className="hidden lg:block bg-white rounded-2xl overflow-hidden lg:sticky lg:top-20 p-2"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${active ? 'text-white' : 'text-brown-dark hover:bg-saffron/6 hover:text-saffron'}`}
                  style={active ? { background: 'linear-gradient(135deg,#e07000,#ff9010)' } : {}}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
