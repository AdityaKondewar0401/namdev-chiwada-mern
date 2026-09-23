import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO';
import PageWrapper from '../../components/PageWrapper';
import B2BStatusBadge from '../../components/b2b/B2BStatusBadge';
import OrderStatusPill from '../../components/b2b/OrderStatusPill';
import StatGrid from '../../components/b2b/StatGrid';
import Money from '../../components/b2b/Money';
import Spinner from '../../components/b2b/Spinner';
import { formatDate } from '../../utils/b2bFormat';
import { useB2B } from '../../context/B2BContext';
import { b2bAPI } from '../../services/api';

const MotionLink = motion(Link);

const QUICK_LINKS = [
  { label: 'Quick Order', to: '/b2b/order', icon: '🛒' },
  { label: 'Orders', to: '/b2b/orders', icon: '📦' },
  { label: 'Invoices', to: '/b2b/invoices', icon: '🧾' },
  { label: 'Statement', to: '/b2b/statement', icon: '📊' },
];

export default function B2BDashboardPage() {
  const { business, creditSummary, loading } = useB2B();
  const [recentOrders, setRecentOrders] = useState(null);
  const [recentOrdersError, setRecentOrdersError] = useState(false);

  useEffect(() => {
    if (business?.status !== 'approved') return undefined;
    let cancelled = false;
    setRecentOrdersError(false);
    b2bAPI.getOrders({ limit: 5 })
      .then((res) => { if (!cancelled) setRecentOrders(res.data.orders); })
      .catch(() => { if (!cancelled) { setRecentOrders([]); setRecentOrdersError(true); } });
    return () => { cancelled = true; };
  }, [business?.status]);

  if (loading || business === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <SEO title="Business Dashboard" canonical="/b2b" robots="noindex,nofollow" />
        <Spinner size="md" />
      </div>
    );
  }

  // No application on file
  if (business === null) {
    return (
      <PageWrapper>
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
      </PageWrapper>
    );
  }

  if (business.status === 'pending') {
    return (
      <PageWrapper>
        <div className="card p-6 sm:p-8 text-center max-w-md mx-auto">
          <SEO title="Business Dashboard" canonical="/b2b" robots="noindex,nofollow" />
          <div className="flex justify-center mb-4"><B2BStatusBadge status="pending" /></div>
          <h1 className="font-serif font-black text-brown-dark text-xl">Your application is under review</h1>
          <p className="mt-2 text-brown-mid/70 text-sm leading-relaxed">
            We'll email you as soon as there's an update on <strong>{business.businessName}</strong>'s wholesale application.
          </p>
        </div>
      </PageWrapper>
    );
  }

  if (business.status === 'rejected') {
    return (
      <PageWrapper>
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
      </PageWrapper>
    );
  }

  if (business.status === 'suspended') {
    return (
      <PageWrapper>
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
      </PageWrapper>
    );
  }

  // approved
  const overdue = creditSummary?.overdueAmount > 0;

  return (
    <PageWrapper>
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

        <StatGrid tiles={[
          { label: 'Outstanding', value: <Money value={creditSummary?.outstanding} /> },
          { label: 'Available credit', value: <Money value={creditSummary?.availableCredit} /> },
          { label: 'Credit limit', value: <Money value={creditSummary?.creditLimit} /> },
        ]} />

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-2.5">Quick links</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map((l, i) => (
              <MotionLink
                key={l.to} to={l.to}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="card p-4 flex flex-col items-center gap-1.5 text-center" style={{ minHeight: 80 }}
              >
                <span className="text-xl" aria-hidden="true">{l.icon}</span>
                <span className="text-sm font-semibold text-brown-dark">{l.label}</span>
              </MotionLink>
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
              <Spinner size="sm" />
            </div>
          )}

          {recentOrders?.length === 0 && recentOrdersError && (
            <p className="text-red-600 text-sm">Couldn't load recent orders. Please refresh the page.</p>
          )}

          {recentOrders?.length === 0 && !recentOrdersError && (
            <p className="text-brown-mid/60 text-sm">
              No orders yet.{' '}
              <Link to="/b2b/order" className="text-saffron font-semibold">Place your first order</Link>.
            </p>
          )}

          {recentOrders?.length > 0 && (
            <div className="flex flex-col divide-y divide-brown-dark/5">
              {recentOrders.map((o, i) => (
                <motion.div
                  key={o._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link to={`/b2b/orders/${o._id}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="font-semibold text-brown-dark text-sm truncate">{o.orderNumber}</div>
                      <div className="text-brown-mid/60 text-xs mt-0.5">{formatDate(o.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-semibold text-brown-dark text-sm"><Money value={o.totals?.payable} /></span>
                      <OrderStatusPill status={o.status} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
