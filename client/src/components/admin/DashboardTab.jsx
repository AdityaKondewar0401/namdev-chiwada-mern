import { useMemo } from 'react';
import { CATEGORIES, CATEGORY_COLORS, STATUS_OPTIONS, STATUS_CONFIG } from './adminConstants';
import { MiniBarChart, SegmentedBar } from './charts';

// ─────────────────────────────────────────────
// DashboardTab — REDESIGNED
//
// The old dashboard was 4 KPI cards + a list of 5 recent products.
// This version computes real analytics from the `products` and
// `orders` already fetched by AdminPage (no new API calls):
//
//  - Orders & Revenue KPIs: delivered revenue, total orders, avg
//    order value, pending orders (flagged if > 0 — actionable, not
//    just decorative)
//  - Catalog KPIs: total products, featured count, out-of-stock
//    count (flagged), category count
//  - 7-day order trend (bar chart)
//  - Order status breakdown (segmented bar, reuses the same status
//    colors as the Orders tab)
//  - Best sellers by units sold — aggregated from actual order line
//    items, not just "recently added products"
//  - Products-by-category breakdown
//  - Out-of-stock alert list (actionable — tells you exactly what
//    needs restocking)
//  - Recent orders + recent products side by side
//
// All of it is a 2-column grid on mobile for KPIs and stacks to a
// single column for the panel cards, so it reads top-to-bottom
// cleanly on a phone instead of cramming a desktop grid.
// ─────────────────────────────────────────────

function last7DayBuckets() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    });
  }
  return days;
}

function useDashboardAnalytics(products, orders) {
  return useMemo(() => {
    const buckets = last7DayBuckets();
    const orderCounts = Object.fromEntries(buckets.map((b) => [b.key, 0]));

    orders.forEach((o) => {
      if (!o.createdAt) return;
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (key in orderCounts) orderCounts[key] += 1;
    });

    const orderTrend = buckets.map((b) => ({ label: b.label, value: orderCounts[b.key] }));

    const deliveredRevenue = orders
      .filter((o) => o.status?.toLowerCase() === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const avgOrderValue = orders.length
      ? Math.round(orders.reduce((s, o) => s + (o.total || 0), 0) / orders.length)
      : 0;

    const pendingCount = orders.filter((o) => o.status?.toLowerCase() === 'pending').length;

    const statusBreakdown = STATUS_OPTIONS.map((s) => ({
      label: s,
      count: orders.filter((o) => o.status?.toLowerCase() === s).length,
      color: STATUS_CONFIG[s].dot,
    }));

    const categoryBreakdown = CATEGORIES.map((c) => ({
      label: c,
      count: products.filter((p) => p.category === c).length,
      color: CATEGORY_COLORS[c] || '#7a5a38',
    }));

    const salesByName = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const name = item.name || item.product?.name || 'Unknown';
        salesByName[name] = (salesByName[name] || 0) + (item.qty || 0);
      });
    });
    const bestSellers = Object.entries(salesByName)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
    const maxSold = bestSellers[0]?.qty || 1;

    const outOfStock = products.filter((p) => !p.inStock);

    return { orderTrend, deliveredRevenue, avgOrderValue, pendingCount, statusBreakdown, categoryBreakdown, bestSellers, maxSold, outOfStock };
  }, [products, orders]);
}

function KpiCard({ icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5"
      style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xl sm:text-2xl">{icon}</div>
        {sub && <div className="text-[9px] sm:text-[10px] font-bold text-right" style={{ color }}>{sub}</div>}
      </div>
      <div className="font-black text-lg sm:text-2xl mb-0.5" style={{ color }}>{value}</div>
      <div className="text-[10px] sm:text-xs text-brown-mid/60 font-medium">{label}</div>
    </div>
  );
}

function PanelCard({ title, action, children }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5"
      style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-brown-dark text-xs sm:text-sm uppercase tracking-wider">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DashboardTab({ products, orders }) {
  const a = useDashboardAnalytics(products, orders);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif font-black text-brown-dark text-2xl mb-1">Dashboard</h2>
        <p className="text-xs text-brown-mid/50">A quick snapshot of orders, revenue, and catalog health.</p>
      </div>

      {/* KPI row 1 — Orders & Revenue */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-brown-mid/40 mb-2">Orders &amp; Revenue</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard icon="💰" label="Delivered Revenue" value={`₹${a.deliveredRevenue.toLocaleString()}`} color="#2d5a1b" />
          <KpiCard icon="📦" label="Total Orders" value={orders.length} color="#d4af37" />
          <KpiCard icon="🧾" label="Avg Order Value" value={`₹${a.avgOrderValue.toLocaleString()}`} color="#7c3aed" />
          <KpiCard
            icon="🕐" label="Pending Orders" value={a.pendingCount}
            color={a.pendingCount > 0 ? '#dc2626' : '#e07000'}
            sub={a.pendingCount > 0 ? 'Needs attention' : undefined}
          />
        </div>
      </div>

      {/* KPI row 2 — Catalog */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-brown-mid/40 mb-2">Catalog</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard icon="🍛" label="Total Products" value={products.length} color="#e07000" />
          <KpiCard icon="⭐" label="Featured" value={products.filter((p) => p.featured).length} color="#d4af37" />
          <KpiCard
            icon="🚫" label="Out of Stock" value={a.outOfStock.length}
            color={a.outOfStock.length > 0 ? '#dc2626' : '#2d5a1b'}
            sub={a.outOfStock.length > 0 ? 'Review now' : 'All good'}
          />
          <KpiCard icon="🗂️" label="Categories" value={CATEGORIES.length} color="#7a5a38" />
        </div>
      </div>

      {/* Trend + status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PanelCard title="Orders — Last 7 Days">
            <MiniBarChart data={a.orderTrend} color="#e07000" />
          </PanelCard>
        </div>
        <PanelCard title="Order Status">
          <SegmentedBar segments={a.statusBreakdown} />
        </PanelCard>
      </div>

      {/* Best sellers + category + stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PanelCard title="Best Sellers · Units Sold">
          {a.bestSellers.length === 0 ? (
            <div className="text-center py-6 text-brown-mid/40 text-sm">No sales data yet</div>
          ) : (
            <div className="space-y-3">
              {a.bestSellers.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-brown-mid/40 w-4 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brown-dark truncate mb-1">{p.name}</div>
                    <div className="h-1.5 rounded-full" style={{ background: '#f3ede2' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${(p.qty / a.maxSold) * 100}%`, background: 'linear-gradient(90deg,#e07000,#ff9010)' }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brown-dark flex-shrink-0">{p.qty} sold</span>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard title="Products by Category">
          <SegmentedBar segments={a.categoryBreakdown} />
        </PanelCard>

        <PanelCard
          title="Out-of-Stock Alerts"
          action={a.outOfStock.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{a.outOfStock.length}</span>
          )}
        >
          {a.outOfStock.length === 0 ? (
            <div className="text-center py-6 text-green-700 text-sm">✅ Everything is in stock</div>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {a.outOfStock.map((p) => (
                <div key={p._id} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: '#fef2f2' }}>
                  <img src={p.img} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  <span className="text-xs font-semibold text-brown-dark truncate">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PanelCard title="Recent Orders">
          {orders.slice(0, 5).length === 0 ? (
            <div className="text-center py-6 text-brown-mid/40 text-sm">No orders yet</div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => {
                const cfg = STATUS_CONFIG[o.status?.toLowerCase()] || STATUS_CONFIG.pending;
                return (
                  <div key={o._id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: '#fef3e0' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
                      {(o.user?.name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-brown-dark truncate">{o.user?.name || 'Guest'}</div>
                      <div className="text-[11px] text-brown-mid/50">₹{(o.total || 0).toLocaleString()}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.icon} {o.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </PanelCard>

        <PanelCard title="Recent Products">
          <div className="space-y-2">
            {products.slice(0, 5).map((p) => (
              <div key={p._id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: '#fef3e0' }}>
                <img src={p.img} alt={p.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-brown-dark text-sm truncate">{p.name}</div>
                  <div className="text-[11px] text-brown-mid/50">₹{p.price} · {p.category}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {p.inStock ? 'In Stock' : 'Out'}
                </span>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}