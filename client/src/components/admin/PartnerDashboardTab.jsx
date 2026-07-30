import { useState, useEffect, useMemo } from 'react';
import { partnerAPI, consignmentAPI, partnerOrderAPI } from '../../services/api';
import { PARTNER_TYPE_LABELS } from './adminConstants';
import { MiniBarChart, SegmentedBar } from './charts';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// PartnerDashboardTab — the Partner Program's own overview, mirroring
// the store Dashboard's analytics pattern (KPI cards, breakdowns, recent
// activity) but built entirely from partner/consignment/order-request
// data instead of products/orders. This is the "at a glance" screen the
// Partner Program section was missing — Partners/Consignments/Partner
// Orders each show their own detail, but nothing summarized the whole
// program until now.
// ─────────────────────────────────────────────

const CONSIGNMENT_STATUS_COLORS = {
  dispatched: '#e07000',
  partially_settled: '#1d4ed8',
  settled: '#15803d',
};

const PARTNER_TYPE_COLORS = {
  distributor: '#e07000',
  retailer: '#d4af37',
  corporate: '#7a5a38',
};

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

function useAnalytics(partners, consignments, orderRequests) {
  return useMemo(() => {
    const activePartners = partners.filter((p) => p.active);
    const totalOutstanding = consignments
      .flatMap((c) => c.payments || [])
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.amountDue, 0);

    const typeBreakdown = ['distributor', 'retailer', 'corporate'].map((type) => ({
      label: PARTNER_TYPE_LABELS[type] || type,
      count: partners.filter((p) => p.type === type).length,
      color: PARTNER_TYPE_COLORS[type],
    }));

    const statusBreakdown = ['dispatched', 'partially_settled', 'settled'].map((status) => ({
      label: status.replace('_', ' '),
      count: consignments.filter((c) => c.status === status).length,
      color: CONSIGNMENT_STATUS_COLORS[status],
    }));

    // Outstanding per partner, derived from the same consignments/payments
    // already loaded — no extra API call needed.
    const outstandingByPartner = {};
    consignments.forEach((c) => {
      (c.payments || []).forEach((p) => {
        if (p.status !== 'pending' || !c.partner) return;
        const key = c.partner._id;
        if (!outstandingByPartner[key]) {
          outstandingByPartner[key] = { partner: c.partner, totalOutstanding: 0, pendingPayments: 0 };
        }
        outstandingByPartner[key].totalOutstanding += p.amountDue;
        outstandingByPartner[key].pendingPayments += 1;
      });
    });
    const topOutstanding = Object.values(outstandingByPartner)
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
      .slice(0, 5);
    const maxOutstanding = Math.max(...topOutstanding.map((o) => o.totalOutstanding), 1);

    const buckets = last7DayBuckets();
    const requestCounts = Object.fromEntries(buckets.map((b) => [b.key, 0]));
    orderRequests.forEach((o) => {
      if (!o.createdAt) return;
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (key in requestCounts) requestCounts[key] += 1;
    });
    const requestTrend = buckets.map((b) => ({ label: b.label, value: requestCounts[b.key] }));

    const pendingRequests = orderRequests.filter((o) => o.status === 'pending').length;
    const approvedRequests = orderRequests.filter((o) => o.status === 'approved').length;
    const rejectedRequests = orderRequests.filter((o) => o.status === 'rejected').length;

    return {
      activePartners,
      totalOutstanding,
      typeBreakdown,
      statusBreakdown,
      topOutstanding,
      maxOutstanding,
      requestTrend,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    };
  }, [partners, consignments, orderRequests]);
}

export default function PartnerDashboardTab() {
  const [partners, setPartners] = useState([]);
  const [consignments, setConsignments] = useState([]);
  const [orderRequests, setOrderRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([partnerAPI.getAll(), consignmentAPI.getAll(), partnerOrderAPI.getAll()])
      .then(([partnersRes, consignmentsRes, ordersRes]) => {
        setPartners(partnersRes.data.partners || []);
        setConsignments(consignmentsRes.data.consignments || []);
        setOrderRequests(ordersRes.data.orderRequests || []);
      })
      .catch(() => toast.error('Failed to load partner program overview'))
      .finally(() => setLoading(false));
  }, []);

  const a = useAnalytics(partners, consignments, orderRequests);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif font-black text-brown-dark text-2xl mb-1">Partner Program</h2>
        <p className="text-xs text-brown-mid/50">A snapshot of partners, consignments, and incoming orders.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon="🤝" label="Active Partners" value={a.activePartners.length} color="#e07000" sub={`${partners.length} total`} />
        <KpiCard
          icon="💰" label="Total Outstanding" value={`₹${a.totalOutstanding.toLocaleString('en-IN')}`}
          color={a.totalOutstanding > 0 ? '#b45309' : '#2d5a1b'}
        />
        <KpiCard
          icon="📥" label="Orders Awaiting Review" value={a.pendingRequests} color={a.pendingRequests > 0 ? '#dc2626' : '#2d5a1b'}
          sub={a.pendingRequests > 0 ? 'Review now' : 'All clear'}
        />
        <KpiCard icon="🚚" label="Total Consignments" value={consignments.length} color="#7a5a38" />
      </div>

      {/* Order request trend + status breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PanelCard title="Partner Order Requests — Last 7 Days">
            <MiniBarChart data={a.requestTrend} color="#e07000" />
          </PanelCard>
        </div>
        <PanelCard title="Consignment Status">
          <SegmentedBar segments={a.statusBreakdown} />
        </PanelCard>
      </div>

      {/* Partner mix + request funnel + top outstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PanelCard title="Partners by Type">
          <SegmentedBar segments={a.typeBreakdown} />
        </PanelCard>

        <PanelCard title="Order Request Funnel">
          <div className="space-y-3">
            {[
              { label: 'Awaiting Review', value: a.pendingRequests, color: '#b45309' },
              { label: 'Approved', value: a.approvedRequests, color: '#15803d' },
              { label: 'Declined', value: a.rejectedRequests, color: '#b91c1c' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brown-mid/70">{row.label}</span>
                <span className="text-sm font-black" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard
          title="Top Outstanding Partners"
          action={a.topOutstanding.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{a.topOutstanding.length}</span>
          )}
        >
          {a.topOutstanding.length === 0 ? (
            <div className="text-center py-6 text-green-700 text-sm">✅ No outstanding balances</div>
          ) : (
            <div className="space-y-3">
              {a.topOutstanding.map((row) => (
                <div key={row.partner._id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brown-dark truncate mb-1">{row.partner.businessName}</div>
                    <div className="h-1.5 rounded-full" style={{ background: '#f3ede2' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${(row.totalOutstanding / a.maxOutstanding) * 100}%`, background: 'linear-gradient(90deg,#e07000,#ff9010)' }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brown-dark flex-shrink-0">₹{row.totalOutstanding.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PanelCard title="Recent Partner Order Requests">
          {orderRequests.slice(0, 5).length === 0 ? (
            <div className="text-center py-6 text-brown-mid/40 text-sm">No order requests yet</div>
          ) : (
            <div className="space-y-2">
              {orderRequests.slice(0, 5).map((o) => (
                <div key={o._id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: '#fef3e0' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
                    {(o.partner?.businessName || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brown-dark truncate">{o.partner?.businessName || 'Unknown'}</div>
                    <div className="text-[11px] text-brown-mid/50">₹{o.estimatedTotal.toLocaleString('en-IN')} estimated</div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 capitalize"
                    style={{
                      background: o.status === 'pending' ? '#fef3c7' : o.status === 'approved' ? '#dcfce7' : '#fee2e2',
                      color: o.status === 'pending' ? '#b45309' : o.status === 'approved' ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard title="Recent Consignments">
          {consignments.slice(0, 5).length === 0 ? (
            <div className="text-center py-6 text-brown-mid/40 text-sm">No consignments yet</div>
          ) : (
            <div className="space-y-2">
              {consignments.slice(0, 5).map((c) => (
                <div key={c._id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: '#fef3e0' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7a5a38,#5a3f28)' }}>
                    {(c.partner?.businessName || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brown-dark truncate">{c.partner?.businessName || 'Unknown'}</div>
                    <div className="text-[11px] text-brown-mid/50">₹{c.totalAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 capitalize"
                    style={{ background: `${CONSIGNMENT_STATUS_COLORS[c.status]}20`, color: CONSIGNMENT_STATUS_COLORS[c.status] }}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
