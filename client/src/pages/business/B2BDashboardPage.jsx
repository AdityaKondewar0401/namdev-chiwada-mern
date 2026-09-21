import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import B2BStatusBadge from '../../components/b2b/B2BStatusBadge';
import { useB2B } from '../../context/B2BContext';
import { b2bAPI } from '../../services/api';

const ORDER_STATUS_COLORS = {
  placed: { bg: '#fef3c7', color: '#b45309' }, confirmed: { bg: '#dbeafe', color: '#1d4ed8' },
  packed: { bg: '#ede9fe', color: '#6d28d9' }, dispatched: { bg: '#cffafe', color: '#0e7490' },
  delivered: { bg: '#dcfce7', color: '#15803d' }, cancelled: { bg: '#fee2e2', color: '#b91c1c' },
  rejected: { bg: '#fee2e2', color: '#b91c1c' },
};

function Money({ value }) {
  return <span>₹{Number(value || 0).toLocaleString('en-IN')}</span>;
}

const QUICK_LINKS = [
  { label: 'Quick Order', to: '/b2b/order', icon: '🛒' },
  { label: 'Orders', to: '/b2b/orders', icon: '📦' },
  { label: 'Invoices', to: '/b2b/invoices', icon: '🧾' },
  { label: 'Statement', to: '/b2b/statement', icon: '📊' },
];

export default function B2BDashboardPage() {
  const { business, creditSummary, loading } = useB2B();
  const [recentOrders, setRecentOrders] = useState(null);

  useEffect(() => {
    if (business?.status !== 'approved') return undefined;
    let cancelled = false;
    b2bAPI.getOrders({ limit: 5 })
      .then((res) => { if (!cancelled) setRecentOrders(res.data.orders); })
      .catch(() => { if (!cancelled) setRecentOrders([]); });
    return () => { cancelled = true; };
  }, [business?.status]);

  if (loading || business === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <SEO title="Business Dashboard" canonical="/b2b" robots="noindex,nofollow" />
        <div className="w-8 h-8 rounded-full border-2 border-saffron border-t-transparent animate-spin" />
      </div>
    );
  }

  // No application on file
  if (business === null) {
    return (
      <div className="card p-6 sm:p-8 text-center max-w-md mx-auto">
        <SEO title="Business Dashboard" canonical="/b2b" robots="noindex,nofollow" />
        <div className="text-3xl mb-3">🤝</div>
        <h1 className="font-serif font-black text-brown-dark text-xl">You haven't applied yet</h1>
        <p className="mt-2 text-brown-mid/70 text-sm leading-relaxed">
          Apply for a Namdev Chiwda wholesale account to see bulk pricing and place orders.
        </p>
        <Link to="/business/apply" className="btn-saffron inline-flex items-center justify-center mt-5 w-full sm:w-auto" style={{ minHeight: 48 }}>
          Apply for a wholesale account
        </Link>
      </div>
    );
  }

  if (business.status === 'pending') {
    return (
      <div className="card p-6 sm:p-8 text-center max-w-md mx-auto">
        <SEO title="Business Dashboard" canonical="/b2b" robots="noindex,nofollow" />
        <div className="flex justify-center mb-4"><B2BStatusBadge status="pending" /></div>
        <h1 className="font-serif font-black text-brown-dark text-xl">Your application is under review</h1>
        <p className="mt-2 text-brown-mid/70 text-sm leading-relaxed">
          We'll email you as soon as there's an update on <strong>{business.businessName}</strong>'s wholesale application.
        </p>
      </div>
    );
  }

  if (business.status === 'rejected') {
    return (
      <div className="card p-6 sm:p-8 text-center max-w-md mx-auto">
        <SEO title="Business Dashboard" canonical="/b2b" robots="noindex,nofollow" />
        <div className="flex justify-center mb-4"><B2BStatusBadge status="rejected" /></div>
        <h1 className="font-serif font-black text-brown-dark text-xl">Your application wasn't approved</h1>
        {business.rejectionReason && (
          <div className="mt-4 p-3 rounded-xl text-left text-sm" style={{ background: '#fef3e0', color: '#7a3300' }}>
            <strong>Reason:</strong> {business.rejectionReason}
          </div>
        )}
        <Link to="/business/apply" className="btn-saffron inline-flex items-center justify-center mt-5 w-full sm:w-auto" style={{ minHeight: 48 }}>
          Update details &amp; re-apply
        </Link>
      </div>
    );
  }

  if (business.status === 'suspended') {
    return (
      <div className="card p-6 sm:p-8 text-center max-w-md mx-auto">
        <SEO title="Business Dashboard" canonical="/b2b" robots="noindex,nofollow" />
        <div className="flex justify-center mb-4"><B2BStatusBadge status="suspended" /></div>
        <h1 className="font-serif font-black text-brown-dark text-xl">Your wholesale account is suspended</h1>
        <p className="mt-2 text-brown-mid/70 text-sm leading-relaxed">
          <strong>{business.businessName}</strong>'s account has been temporarily suspended. Please contact us for details.
        </p>
        <a href="https://wa.me/919130160491" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center mt-5 px-6 rounded-full font-semibold text-brown-dark border-2 border-saffron/25 bg-white w-full sm:w-auto"
          style={{ minHeight: 48 }}>
          Contact us on WhatsApp
        </a>
      </div>
    );
  }

  // approved
  const overdue = creditSummary?.overdueAmount > 0;

  return (
    <div className="flex flex-col gap-5">
      <SEO title="Business Dashboard" canonical="/b2b" robots="noindex,nofollow" />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif font-black text-brown-dark text-xl sm:text-2xl">{business.businessName}</h1>
          <p className="text-brown-mid/60 text-sm mt-0.5">Wholesale dashboard</p>
        </div>
        <B2BStatusBadge status="approved" />
      </div>

      {overdue && (
        <div className="p-4 rounded-2xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <strong>You have an overdue balance of <Money value={creditSummary.overdueAmount} /></strong>
          {creditSummary.oldestOverdueDays > 0 && <> — oldest invoice is {creditSummary.oldestOverdueDays} day(s) past due.</>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-brown-mid/50">Outstanding</div>
          <div className="font-serif font-black text-brown-dark text-lg mt-1"><Money value={creditSummary?.outstanding} /></div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-brown-mid/50">Available credit</div>
          <div className="font-serif font-black text-brown-dark text-lg mt-1"><Money value={creditSummary?.availableCredit} /></div>
        </div>
        <div className="card p-4 col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-brown-mid/50">Credit limit</div>
          <div className="font-serif font-black text-brown-dark text-lg mt-1"><Money value={creditSummary?.creditLimit} /></div>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-2.5">Quick links</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="card p-4 flex flex-col items-center gap-1.5 text-center" style={{ minHeight: 80 }}>
              <span className="text-xl" aria-hidden="true">{l.icon}</span>
              <span className="text-sm font-semibold text-brown-dark">{l.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50">Recent orders</div>
          {recentOrders?.length > 0 && (
            <Link to="/b2b/orders" className="text-xs font-semibold text-saffron">View all</Link>
          )}
        </div>

        {recentOrders === null && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 rounded-full border-2 border-saffron border-t-transparent animate-spin" />
          </div>
        )}

        {recentOrders?.length === 0 && (
          <p className="text-brown-mid/60 text-sm">
            No orders yet.{' '}
            <Link to="/b2b/order" className="text-saffron font-semibold">Place your first order</Link>.
          </p>
        )}

        {recentOrders?.length > 0 && (
          <div className="flex flex-col divide-y divide-brown-dark/5">
            {recentOrders.map((o) => {
              const c = ORDER_STATUS_COLORS[o.status] || { bg: '#f3f4f6', color: '#4b5563' };
              return (
                <Link key={o._id} to={`/b2b/orders/${o._id}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-semibold text-brown-dark text-sm truncate">{o.orderNumber}</div>
                    <div className="text-brown-mid/60 text-xs mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-semibold text-brown-dark text-sm"><Money value={o.totals?.payable} /></span>
                    <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: c.bg, color: c.color }}>
                      {o.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
