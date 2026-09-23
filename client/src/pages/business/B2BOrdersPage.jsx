import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { useB2B } from '../../context/B2BContext';
import { b2bAPI } from '../../services/api';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS = {
  placed: { bg: '#fef3c7', color: '#b45309' },
  confirmed: { bg: '#dbeafe', color: '#1d4ed8' },
  packed: { bg: '#ede9fe', color: '#6d28d9' },
  dispatched: { bg: '#cffafe', color: '#0e7490' },
  delivered: { bg: '#dcfce7', color: '#15803d' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c' },
  rejected: { bg: '#fee2e2', color: '#b91c1c' },
};

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
function Money({ value }) { return <span>₹{Number(value || 0).toLocaleString('en-IN')}</span>; }

export default function B2BOrdersPage() {
  const { business } = useB2B();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(false);
    b2bAPI.getOrders({ status: statusFilter || undefined })
      .then((res) => setOrders(res.data.orders))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (business === undefined) return null;

  return (
    <div>
      <SEO title="Orders" canonical="/b2b/orders" robots="noindex,nofollow" />
      <h1 className="font-serif font-black text-brown-dark text-xl sm:text-2xl mb-4">Orders</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className="px-4 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0"
            style={{
              height: 40,
              ...(statusFilter === f.value
                ? { background: 'linear-gradient(135deg,#e07000,#ff9010)', color: '#fff' }
                : { background: '#fff', color: '#2d1a00', border: '1px solid rgba(224,112,0,0.15)' }),
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">Loading orders…</div>
      ) : error ? (
        <div className="py-12 text-center text-red-600 text-sm">Couldn't load orders. Please try again.</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">No orders yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const colors = STATUS_COLORS[o.status] || {};
            return (
              <Link key={o._id} to={`/b2b/orders/${o._id}`} className="card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-brown-dark text-sm">{o.orderNumber}</div>
                  <div className="text-xs text-brown-mid/50 mt-0.5">{formatDate(o.createdAt)} · {o.items?.length || 0} item{o.items?.length === 1 ? '' : 's'}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-brown-dark text-sm"><Money value={o.totals?.payable} /></div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: colors.bg, color: colors.color }}>
                    {o.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
