import { motion } from 'framer-motion';
import { TABS } from './accountConstants';

// ─────────────────────────────────────────────
// AccountNav — NEW (extracted + redesigned from the inline sidebar)
//
// Same mobile fix already applied to the admin panel: a vertical
// stack of 4 full-width tab buttons ate a lot of scroll space on
// mobile before you'd see any actual content. Mobile now gets a
// compact horizontal pill bar; desktop keeps a vertical sidebar.
//
// New details:
//  - Order/Wishlist counts now show as small badges on their tabs
//    (both mobile and desktop), so you can see at a glance whether
//    you have anything in your wishlist without switching tabs.
//  - The active tab is highlighted with a Framer Motion shared-layout
//    pill (`layoutId`) that glides between tabs — the same technique
//    used for the main site nav, so the whole site feels consistent.
// ─────────────────────────────────────────────
export default function AccountNav({ activeTab, onTabChange, ordersCount, wishlistCount, onLogout }) {
  const countFor = (id) => {
    if (id === 'orders') return ordersCount;
    if (id === 'wishlist') return wishlistCount;
    return null;
  };

  return (
    <>
      {/* MOBILE / TABLET: horizontal scrollable pill bar */}
      <div className="lg:hidden -mx-4 px-4 pb-1 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {TABS.map((tab) => {
            const count = countFor(tab.id);
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative isolate flex items-center gap-1.5 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0"
                style={{
                  height: 44,
                  border: active ? 'none' : '1px solid rgba(224,112,0,0.18)',
                  background: active ? 'transparent' : '#fff',
                }}
              >
                {active && (
                  <motion.span
                    layoutId="account-tab-pill-mobile"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className={`relative z-10 ${active ? 'text-white' : 'text-brown-dark'}`}>{tab.icon}</span>
                <span className={`relative z-10 ${active ? 'text-white' : 'text-brown-dark'}`}>{tab.label}</span>
                {count != null && count > 0 && (
                  <span
                    className="relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: active ? 'rgba(255,255,255,0.25)' : '#fef3e0', color: active ? '#fff' : '#e07000' }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile logout — kept as its own slim row so the pill bar stays compact */}
      <button
        onClick={onLogout}
        className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 mt-1"
        style={{ background: '#fef2f2', border: '1px solid rgba(220,38,38,0.15)' }}
      >
        🚪 Logout
      </button>

      {/* DESKTOP: vertical sidebar, unchanged position/behavior */}
      <div
        className="hidden lg:block bg-white rounded-2xl overflow-hidden lg:sticky lg:top-28"
        style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}
      >
        <div className="p-3">
          {TABS.map((tab) => {
            const count = countFor(tab.id);
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative isolate w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors mb-1"
              >
                {active && (
                  <motion.span
                    layoutId="account-tab-pill-desktop"
                    className="absolute inset-0 rounded-xl -z-10"
                    style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: active ? 'rgba(255,255,255,0.2)' : '#fef3e0' }}
                >
                  {tab.icon}
                </span>
                <span className={`relative z-10 flex-1 text-left ${active ? 'text-white' : 'text-brown-dark'}`}>{tab.label}</span>
                {count != null && count > 0 && (
                  <span
                    className="relative z-10 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: active ? 'rgba(255,255,255,0.25)' : '#fef3e0', color: active ? '#fff' : '#e07000' }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t p-3" style={{ borderColor: 'rgba(224,112,0,0.08)' }}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </div>
    </>
  );
}