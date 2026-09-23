import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO';
import PageWrapper from '../../components/PageWrapper';
import FilterPills from '../../components/b2b/FilterPills';
import OrderStatusPill from '../../components/b2b/OrderStatusPill';
import Money from '../../components/b2b/Money';
import { formatDate } from '../../utils/b2bFormat';
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
    <PageWrapper>
      <SEO title="Orders" canonical="/b2b/orders" robots="noindex,nofollow" />
      <h1 className="font-serif font-black text-brown-dark text-xl sm:text-2xl mb-4">Orders</h1>

      <div className="mb-4">
        <FilterPills layoutId="b2b-orders-status-filter" options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {loading ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">Loading orders…</div>
      ) : error ? (
        <div className="py-12 text-center text-red-600 text-sm">Couldn't load orders. Please try again.</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">No orders yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o, i) => (
            <motion.div
              key={o._id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.04 }}
            >
              <Link to={`/b2b/orders/${o._id}`} className="card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-brown-dark text-sm">{o.orderNumber}</div>
                  <div className="text-xs text-brown-mid/50 mt-0.5">{formatDate(o.createdAt)} · {o.items?.length || 0} item{o.items?.length === 1 ? '' : 's'}</div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <div className="font-bold text-brown-dark text-sm"><Money value={o.totals?.payable} /></div>
                  <OrderStatusPill status={o.status} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
