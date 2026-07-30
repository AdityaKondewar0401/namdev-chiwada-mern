import { TABS } from './adminConstants';

// ─────────────────────────────────────────────
// AdminNav — REDESIGNED for mobile
//
// The old sidebar was a `grid-cols-1 lg:grid-cols-[220px_1fr]` layout,
// meaning on mobile the *entire* vertical sidebar (5 full-width
// buttons, ~48-56px tall each) rendered stacked ABOVE the tab content
// — about 250-280px of scrolling before you ever saw the dashboard.
//
// Mobile (below lg) now gets a compact horizontal, swipeable pill bar
// instead — same tabs, but ~50px total instead of ~270px, and it's
// a more familiar mobile-admin pattern (like a segmented control).
// Desktop (lg+) keeps the original vertical sidebar unchanged.
//
// Tabs are also split into two clearly separate groups — "Store" (day
// to day product/order management) and "Partner Program" (distributors,
// consignments, and the orders they place themselves) — so the two
// don't blur together into one flat list.
// ─────────────────────────────────────────────

const storeTabs = TABS.filter((t) => t.group === 'store');
const partnerTabs = TABS.filter((t) => t.group === 'partner');

function TabButton({ tab, activeTab, onTabChange, productsCount, variant }) {
  const isActive = activeTab === tab.id;

  if (variant === 'pill') {
    return (
      <button
        onClick={() => onTabChange(tab.id)}
        className="flex items-center gap-1.5 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
        style={{
          height: 44,
          ...(isActive
            ? { background: 'linear-gradient(135deg,#e07000,#ff9010)', color: '#fff', boxShadow: '0 4px 14px rgba(224,112,0,0.3)' }
            : { background: '#fff', color: '#2d1a00', border: '1px solid rgba(224,112,0,0.15)' }),
        }}
      >
        <span>{tab.icon}</span>
        {tab.label}
        {tab.id === 'products' && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: isActive ? 'rgba(255,255,255,0.25)' : '#fef3e0', color: isActive ? '#fff' : '#e07000' }}
          >
            {productsCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => onTabChange(tab.id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${isActive ? 'text-white' : 'text-brown-dark hover:bg-saffron/6 hover:text-saffron'}`}
      style={isActive ? { background: 'linear-gradient(135deg,#e07000,#ff9010)' } : {}}
    >
      <span>{tab.icon}</span>
      {tab.label}
      {tab.id === 'products' && (
        <span
          className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: isActive ? 'rgba(255,255,255,0.2)' : '#fef3e0', color: isActive ? '#fff' : '#e07000' }}
        >
          {productsCount}
        </span>
      )}
    </button>
  );
}

export default function AdminNav({ activeTab, onTabChange, productsCount }) {
  return (
    <>
      {/* MOBILE / TABLET: horizontal scrollable pill tab bar, grouped with a labeled divider */}
      <div className="lg:hidden -mx-4 px-4 pb-1 overflow-x-auto">
        <div className="flex items-center gap-2 w-max">
          {storeTabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} activeTab={activeTab} onTabChange={onTabChange} productsCount={productsCount} variant="pill" />
          ))}
          <div className="flex items-center gap-2 flex-shrink-0 pl-2 ml-1" style={{ borderLeft: '1px solid rgba(224,112,0,0.2)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brown-mid/40 whitespace-nowrap">Partner Program</span>
          </div>
          {partnerTabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} activeTab={activeTab} onTabChange={onTabChange} productsCount={productsCount} variant="pill" />
          ))}
        </div>
      </div>

      {/* DESKTOP: vertical sidebar, split into two clearly labeled sections */}
      <div className="hidden lg:block bg-white rounded-2xl overflow-hidden lg:sticky lg:top-20"
        style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(224,112,0,0.1)', background: 'linear-gradient(135deg,#fff0d6,#fffdf7)' }}>
          <div className="font-bold text-brown-dark text-sm">🍛 Namdev Chiwda</div>
          <div className="text-xs text-brown-mid/60">Admin Dashboard</div>
        </div>

        <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-brown-mid/40">Store</div>
        <div className="p-2 pt-0">
          {storeTabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} activeTab={activeTab} onTabChange={onTabChange} productsCount={productsCount} variant="sidebar" />
          ))}
        </div>

        <div className="mx-4 my-1" style={{ borderTop: '1px solid rgba(224,112,0,0.1)' }} />

        <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-brown-mid/40">Partner Program</div>
        <div className="p-2 pt-0">
          {partnerTabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} activeTab={activeTab} onTabChange={onTabChange} productsCount={productsCount} variant="sidebar" />
          ))}
        </div>
      </div>
    </>
  );
}