import { useMemo, useState } from 'react';
import {
  Wallet, Package, BarChart3, Clock, ShoppingBag, Star, AlertTriangle, LayoutGrid, CheckCircle2,
  IndianRupee, Store, Globe,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_COLORS, STATUS_OPTIONS, STATUS_CONFIG } from './adminConstants';
import { MiniBarChart, SegmentedBar } from './charts';
// KpiCard/PanelCard used to be declared locally in this file; they're now
// the shared `StatTile`/`Panel` primitives in AdminUI.jsx (identical
// props), aliased here so nothing below this line needs to change.
import { StatTile as KpiCard, Panel as PanelCard } from './AdminUI';

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
//  - Units sold by product — delivered online orders plus offline
//    invoices, aggregated server-side (`unitsSold` on the invoice summary)
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

    const outOfStock = products.filter((p) => !p.inStock);

    return { orderTrend, deliveredRevenue, avgOrderValue, pendingCount, statusBreakdown, categoryBreakdown, outOfStock };
  }, [products, orders]);
}

// "200g × 12 · 1kg × 3"; lines without a pack size are grouped as "other".
function packBreakdown(sizes = []) {
  const labelled = sizes.filter((s) => s.size && s.total > 0);
  if (!labelled.length) return '';
  const other = sizes.find((s) => !s.size && s.total > 0);
  return [...labelled.map((s) => `${s.size} × ${s.total}`), other && `other × ${other.total}`].filter(Boolean).join(' · ');
}

const UNITS_PREVIEW = 8;
const unitsCell = (n) => `text-right py-2.5 ${n ? 'text-brown-mid' : 'text-brown-mid/30'}`;

function UnitsSoldPanel({ rows }) {
  const [showAll, setShowAll] = useState(false);
  const visible = rows && (showAll ? rows : rows.slice(0, UNITS_PREVIEW));
  const max = rows?.[0]?.total || 0;
  const totals = (rows || []).reduce(
    (t, r) => ({ online: t.online + r.online, offline: t.offline + r.offline, total: t.total + r.total }),
    { online: 0, offline: 0, total: 0 }
  );

  return (
    <PanelCard title="Units Sold by Product">
      <p className="text-[11px] text-brown-mid/50 -mt-2 mb-3">
        Delivered online orders (website and WhatsApp) plus offline invoices. Cancelled sales are not counted.
      </p>
      {!rows ? (
        <div className="text-center py-6 text-brown-mid/40 text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-6 text-brown-mid/40 text-sm">No sales data yet</div>
      ) : (
        <>
          <table className="w-full table-fixed text-sm tabular-nums">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider">
                <th scope="col" className="text-left font-bold pb-2 text-brown-mid/50">Product</th>
                <th scope="col" className="text-right font-bold pb-2 w-14 sm:w-24" style={{ color: '#1d4ed8' }}>Online</th>
                <th scope="col" className="text-right font-bold pb-2 w-14 sm:w-24" style={{ color: '#e07000' }}>Offline</th>
                <th scope="col" className="text-right font-bold pb-2 w-14 sm:w-24 text-brown-dark">Total</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const packs = packBreakdown(r.sizes);
                return (
                  <tr key={r.key} className="border-t align-top" style={{ borderColor: '#f3ede2' }}>
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-brown-dark break-words">{r.name}</span>
                        {!r.inCatalog && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap bg-amber-50 text-amber-700">Custom item</span>
                        )}
                      </div>
                      {packs && <div className="text-[11px] text-brown-mid/50 mt-0.5">{packs}</div>}
                      {max > 0 && (
                        <div className="h-1 rounded-full mt-1.5 max-w-[14rem]" style={{ background: '#f3ede2' }}>
                          <div className="h-1 rounded-full" style={{ width: `${(r.total / max) * 100}%`, background: 'linear-gradient(90deg,#e07000,#ff9010)' }} />
                        </div>
                      )}
                    </td>
                    <td className={unitsCell(r.online)}>{r.online}</td>
                    <td className={unitsCell(r.offline)}>{r.offline}</td>
                    <td className={`text-right py-2.5 font-bold ${r.total ? 'text-brown-dark' : 'text-brown-mid/30'}`}>{r.total}</td>
                  </tr>
                );
              })}
            </tbody>
            {rows.length > 1 && (
              <tfoot>
                <tr className="border-t-2" style={{ borderColor: '#eadfcc' }}>
                  <th scope="row" className="text-left py-2.5 text-xs font-bold text-brown-dark whitespace-nowrap">All products</th>
                  <td className="text-right py-2.5 font-semibold text-brown-dark">{totals.online}</td>
                  <td className="text-right py-2.5 font-semibold text-brown-dark">{totals.offline}</td>
                  <td className="text-right py-2.5 font-black text-brown-dark">{totals.total}</td>
                </tr>
              </tfoot>
            )}
          </table>
          {rows.length > UNITS_PREVIEW && (
            <button type="button" onClick={() => setShowAll((v) => !v)}
              className="mt-2 text-xs font-bold text-saffron hover:underline">
              {showAll ? `Show top ${UNITS_PREVIEW}` : `Show all ${rows.length} products`}
            </button>
          )}
        </>
      )}
    </PanelCard>
  );
}

const rupees = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function DashboardTab({ products, orders, invoiceSummary }) {
  const a = useDashboardAnalytics(products, orders);
  const offlineSales = invoiceSummary?.offlineSales || 0;
  const offlineDue = invoiceSummary?.offlineDue || 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif font-black text-brown-dark text-2xl mb-1">Dashboard</h2>
        <p className="text-xs text-brown-mid/50">A quick snapshot of orders, revenue, and catalog health.</p>
      </div>

      {/* KPI row 0 — Sales: delivered website orders plus issued offline invoices */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-brown-mid/40 mb-2">Sales</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard icon={<IndianRupee size={19} />} label="Total Sales" value={rupees(a.deliveredRevenue + offlineSales)} color="#2d5a1b" />
          <KpiCard icon={<Globe size={19} />} label="Website (delivered)" value={rupees(a.deliveredRevenue)} color="#1d4ed8" />
          <KpiCard icon={<Store size={19} />} label="Offline" value={rupees(offlineSales)} color="#e07000" />
          <KpiCard
            icon={<Wallet size={19} />} label="Offline Amount Due" value={rupees(offlineDue)}
            color={offlineDue > 0 ? '#b45309' : '#2d5a1b'}
            sub={invoiceSummary?.offlineDueCount ? `${invoiceSummary.offlineDueCount} unpaid` : undefined}
          />
        </div>
      </div>

      <UnitsSoldPanel rows={invoiceSummary?.unitsSold} />

      {/* KPI row 1 — Orders */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-brown-mid/40 mb-2">Website Orders</div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <KpiCard icon={<Package size={19} />} label="Total Orders" value={orders.length} color="#d4af37" />
          <KpiCard icon={<BarChart3 size={19} />} label="Avg Order Value" value={`₹${a.avgOrderValue.toLocaleString()}`} color="#7c3aed" />
          <KpiCard
            icon={<Clock size={19} />} label="Pending Orders" value={a.pendingCount}
            color={a.pendingCount > 0 ? '#dc2626' : '#e07000'}
            sub={a.pendingCount > 0 ? 'Needs attention' : undefined}
          />
        </div>
      </div>

      {/* KPI row 2 — Catalog */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-brown-mid/40 mb-2">Catalog</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard icon={<ShoppingBag size={19} />} label="Total Products" value={products.length} color="#e07000" />
          <KpiCard icon={<Star size={19} />} label="Featured" value={products.filter((p) => p.featured).length} color="#d4af37" />
          <KpiCard
            icon={<AlertTriangle size={19} />} label="Out of Stock" value={a.outOfStock.length}
            color={a.outOfStock.length > 0 ? '#dc2626' : '#2d5a1b'}
            sub={a.outOfStock.length > 0 ? 'Review now' : 'All good'}
          />
          <KpiCard icon={<LayoutGrid size={19} />} label="Categories" value={CATEGORIES.length} color="#7a5a38" />
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

      {/* Category + stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <div className="flex flex-col items-center gap-2 py-6 text-green-700 text-sm">
              <CheckCircle2 size={22} />
              Everything is in stock
            </div>
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
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                      <cfg.icon size={11} /> {o.status}
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