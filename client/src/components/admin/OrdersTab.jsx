import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { shippingAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { STATUS_OPTIONS, STATUS_CONFIG, PAYMENT_ICONS } from './adminConstants';

// ─────────────────────────────────────────────
// OrderCard — same structure as before, with touch-target sizing
// bumped on the status <select> and the "view details" button so
// they're comfortably tappable on a phone (both were a bit tight —
// under 40px tall — in the original).
// ─────────────────────────────────────────────
function OrderCard({ order, onUpdateStatus, onOrderUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [courierBusy, setCourierBusy] = useState(false);
  const status = order.status?.toLowerCase() || 'pending';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  async function runCourierAction(action, successMsg) {
    setCourierBusy(true);
    try {
      const res = await action();
      onOrderUpdated(res.data.order);
      toast.success(successMsg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Shadowfax action failed');
    } finally {
      setCourierBusy(false);
    }
  }

  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const payMethod = order.paymentMethod || order.payment?.method || 'COD';
  const payStatus = order.paymentStatus || (payMethod === 'COD' ? 'Pay on delivery' : 'Paid');

  return (
    <div style={{
      background: 'white', borderRadius: 20,
      border: `1px solid ${cfg.border}`,
      boxShadow: '0 2px 16px rgba(45,26,0,0.06)',
      overflow: 'hidden', transition: 'box-shadow 0.2s',
    }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.dot}88)` }} />

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: '#3d2800', letterSpacing: '0.04em' }}>
                #{order._id.slice(-8).toUpperCase()}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 20,
                background: cfg.bg, color: cfg.color,
                fontSize: 11, fontWeight: 700,
                border: `1px solid ${cfg.border}`,
                textTransform: 'capitalize',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                {cfg.icon} {status}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 20,
                background: payMethod.toUpperCase() === 'ONLINE' ? '#dbeafe' : '#f0fdf4',
                color: payMethod.toUpperCase() === 'ONLINE' ? '#1d4ed8' : '#15803d',
                fontSize: 10, fontWeight: 700,
                border: `1px solid ${payMethod.toUpperCase() === 'ONLINE' ? '#bfdbfe' : '#bbf7d0'}`,
              }}>
                {PAYMENT_ICONS[payMethod] || '💵'} {payMethod.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #e07000, #ff9010)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>
                {(order.user?.name || 'G').charAt(0).toUpperCase()}
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#3d2800' }}>{order.user?.name || 'Guest'}</span>
                <span style={{ color: '#9a7c5a', fontSize: 12, marginLeft: 6 }}>{order.user?.email}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#9a7c5a' }}>📅 {dateStr} · {timeStr}</span>
              <span style={{ fontSize: 11, color: '#9a7c5a' }}>📦 {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
              {order.shippingAddress?.city && (
                <span style={{ fontSize: 11, color: '#9a7c5a' }}>📍 {order.shippingAddress.city}, {order.shippingAddress.state}</span>
              )}
              <span style={{ fontSize: 11, color: payMethod.toUpperCase() === 'ONLINE' ? '#15803d' : '#9a7c5a' }}>💰 {payStatus}</span>
              {order.courier?.awbNumber ? (
                <span style={{ fontSize: 11, color: '#1d4ed8', fontFamily: 'monospace', fontWeight: 700 }}>
                  🚚 AWB {order.courier.awbNumber} {order.courier.statusDisplay ? `· ${order.courier.statusDisplay}` : ''}
                </span>
              ) : order.courier?.error ? (
                <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>⚠️ Shipment not created</span>
              ) : null}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: '#e07000', fontFamily: "'Lora', Georgia, serif", lineHeight: 1 }}>
                ₹{(order.total || 0).toLocaleString()}
              </div>
              {order.discount > 0 && (
                <div style={{ fontSize: 10, color: '#15803d', marginTop: 2 }}>−₹{order.discount} discount applied</div>
              )}
            </div>

            <select
              value={order.status || 'pending'}
              onChange={(e) => onUpdateStatus(order._id, e.target.value)}
              style={{
                padding: '9px 28px 9px 12px', borderRadius: 10, minHeight: 40,
                border: `1.5px solid ${cfg.border}`,
                background: cfg.bg, color: cfg.color,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none',
                textTransform: 'capitalize', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(cfg.color)}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} style={{ background: 'white', color: '#3d2800', textTransform: 'capitalize' }}>
                  {STATUS_CONFIG[s]?.icon} {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>

            {/* ── Primary actions — always visible, no need to expand.
                "Create Shipment" only appears until an AWB exists (it's a
                one-time action); "Cancel Order" is hidden once the order
                is already cancelled or delivered. ── */}
            <div style={{ display: 'flex', gap: 8 }}>
              {!order.courier?.awbNumber && status !== 'cancelled' && (
                <button
                  disabled={courierBusy}
                  onClick={() => runCourierAction(() => shippingAPI.createShipment(order._id), 'Shipment created — AWB assigned')}
                  style={{
                    fontSize: 11, fontWeight: 700, color: '#15803d',
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: 8, padding: '8px 12px', minHeight: 40, cursor: 'pointer',
                    opacity: courierBusy ? 0.6 : 1,
                  }}
                >📦 Create Shipment</button>
              )}
              {status !== 'cancelled' && status !== 'delivered' && (
                <button
                  disabled={courierBusy}
                  onClick={() => {
                    if (window.confirm(`Cancel order #${order._id.slice(-8).toUpperCase()}? This cannot be undone.`)) {
                      onUpdateStatus(order._id, 'cancelled');
                    }
                  }}
                  style={{
                    fontSize: 11, fontWeight: 700, color: '#dc2626',
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 8, padding: '8px 12px', minHeight: 40, cursor: 'pointer',
                    opacity: courierBusy ? 0.6 : 1,
                  }}
                >✕ Cancel Order</button>
              )}
            </div>

            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                fontSize: 11, fontWeight: 700, color: '#e07000',
                background: '#fff4e6', border: '1px solid rgba(224,112,0,0.2)',
                borderRadius: 8, padding: '8px 12px', minHeight: 40, cursor: 'pointer',
              }}
            >
              {expanded ? '▲ Hide details' : '▼ View details'}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              borderTop: '1px solid rgba(224,160,80,0.12)', background: '#fef9f3',
              padding: '16px 20px', display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20,
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9a7c5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Items Ordered</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(order.items || []).map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'white', borderRadius: 10, padding: '8px 10px',
                      border: '1px solid rgba(224,160,80,0.1)',
                    }}>
                      {item.img && <img src={item.img} alt={item.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#3d2800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name || item.product?.name || 'Product'}
                        </div>
                        <div style={{ fontSize: 11, color: '#9a7c5a' }}>{item.size && `${item.size} · `}Qty: {item.qty}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#e07000', flexShrink: 0 }}>₹{(item.price * item.qty).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {order.shippingAddress && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9a7c5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Delivery Address</div>
                  <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(224,160,80,0.1)', fontSize: 12, lineHeight: 1.7, color: '#3d2800' }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{order.shippingAddress.fullName}</div>
                    <div style={{ color: '#7a5c3a' }}>{order.shippingAddress.line1}</div>
                    {order.shippingAddress.line2 && <div style={{ color: '#7a5c3a' }}>{order.shippingAddress.line2}</div>}
                    <div style={{ color: '#7a5c3a' }}>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</div>
                    {order.shippingAddress.phone && <div style={{ marginTop: 4, color: '#e07000', fontWeight: 600 }}>📞 {order.shippingAddress.phone}</div>}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9a7c5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Price Breakdown</div>
                <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(224,160,80,0.1)' }}>
                  {[
                    { label: 'Subtotal', value: `₹${(order.subtotal || order.total || 0).toLocaleString()}` },
                    { label: 'Shipping', value: order.shipping === 0 ? '🚚 FREE' : `₹${order.shipping || 0}` },
                    order.discount > 0 && { label: 'Discount', value: `-₹${order.discount}`, green: true },
                    { label: 'Total Paid', value: `₹${(order.total || 0).toLocaleString()}`, bold: true },
                  ].filter(Boolean).map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 0', borderTop: row.bold ? '1px solid rgba(224,160,80,0.15)' : 'none', marginTop: row.bold ? 4 : 0,
                    }}>
                      <span style={{ fontSize: 12, color: '#9a7c5a' }}>{row.label}</span>
                      <span style={{ fontSize: row.bold ? 14 : 12, fontWeight: row.bold ? 800 : 600, color: row.green ? '#15803d' : row.bold ? '#e07000' : '#3d2800', fontFamily: "'Lora', serif" }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                {order.promoCode && (
                  <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, background: '#dcfce7', border: '1px solid #bbf7d0', fontSize: 11, fontWeight: 700, color: '#15803d' }}>
                    🎟️ Promo: <span style={{ letterSpacing: '0.05em' }}>{order.promoCode}</span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div style={{ marginTop: 6, padding: '6px 12px', borderRadius: 8, background: '#dbeafe', border: '1px solid #bfdbfe', fontSize: 10, fontWeight: 600, color: '#1d4ed8', wordBreak: 'break-all' }}>
                    🔑 {order.razorpayPaymentId}
                  </div>
                )}
              </div>

              {/* ── Shadowfax shipment panel ── */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9a7c5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Shipping (Shadowfax)</div>
                <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(224,160,80,0.1)', fontSize: 12, color: '#3d2800' }}>
                  {order.courier?.awbNumber ? (
                    <>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>AWB: {order.courier.awbNumber}</div>
                      <div style={{ color: '#7a5c3a', marginTop: 2 }}>Status: {order.courier.statusDisplay || order.courier.status || '—'}</div>
                      {order.courier.trackingUrl && (
                        <a href={order.courier.trackingUrl} target="_blank" rel="noreferrer" style={{ color: '#e07000', fontWeight: 700, fontSize: 11 }}>
                          Track shipment ↗
                        </a>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        <button
                          disabled={courierBusy}
                          onClick={() => runCourierAction(() => shippingAPI.resyncTracking(order._id), 'Tracking synced')}
                          style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 12px', minHeight: 40, cursor: 'pointer' }}
                        >🔄 Resync</button>
                        <button
                          disabled={courierBusy || status === 'cancelled'}
                          onClick={() => runCourierAction(() => shippingAPI.cancelShipment(order._id, 'Cancelled by admin'), 'Shipment cancelled')}
                          style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 12px', minHeight: 40, cursor: 'pointer' }}
                        >✕ Cancel shipment</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {order.courier?.error && (
                        <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>⚠️ {order.courier.error}</div>
                      )}
                      <div style={{ color: '#9a7c5a' }}>
                        {status === 'cancelled'
                          ? 'Order was cancelled before a shipment was created.'
                          : 'No shipment yet — use "📦 Create Shipment" above.'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/orders/admin')
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await api.put(`/api/orders/${id}/status`, { status });
      // Use the full updated order back from the server (not just the
      // status field) since setting status to "cancelled" also updates
      // order.courier when a Shadowfax shipment exists (see
      // orderController.updateOrderStatus).
      setOrders((prev) => prev.map((o) => (o._id === id ? res.data.order : o)));
      toast.success(status === 'cancelled' ? 'Order cancelled' : 'Order status updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filter === 'all' || o.status?.toLowerCase() === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o._id.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.shippingAddress?.city?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const stats = STATUS_OPTIONS.map((s) => ({
    status: s, count: orders.filter((o) => o.status?.toLowerCase() === s).length, cfg: STATUS_CONFIG[s],
  }));

  const totalRevenue = orders
    .filter((o) => o.status?.toLowerCase() === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="font-serif font-black text-brown-dark text-2xl" style={{ marginBottom: 2 }}>
            All Customer Orders <span style={{ fontSize: 16, fontWeight: 400, color: '#9a7c5a', marginLeft: 8 }}>({orders.length})</span>
          </h2>
          <p style={{ fontSize: 12, color: '#9a7c5a' }}>
            💰 Delivered revenue: <strong style={{ color: '#15803d' }}>₹{totalRevenue.toLocaleString()}</strong>
          </p>
        </div>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, city, ID..."
          style={{ padding: '10px 16px', borderRadius: 30, border: '1.5px solid rgba(224,112,0,0.2)', background: 'white', fontSize: 13, color: '#3d2800', outline: 'none', width: '100%', maxWidth: 280 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, overflowX: 'auto' }}>
        <button onClick={() => setFilter('all')} style={{
          padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid', minHeight: 36,
          borderColor: filter === 'all' ? '#e07000' : 'rgba(224,112,0,0.2)',
          background: filter === 'all' ? '#e07000' : 'white',
          color: filter === 'all' ? 'white' : '#9a7c5a', transition: 'all 0.15s',
        }}>All ({orders.length})</button>
        {stats.filter((s) => s.count > 0).map(({ status, count, cfg }) => (
          <button key={status} onClick={() => setFilter(status)} style={{
            padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 36,
            border: `1.5px solid ${filter === status ? cfg.dot : cfg.border}`,
            background: filter === status ? cfg.bg : 'white',
            color: filter === status ? cfg.color : '#9a7c5a',
            transition: 'all 0.15s', textTransform: 'capitalize',
          }}>
            {cfg.icon} {status} ({count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9a7c5a' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700 }}>No orders found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((order) => <OrderCard key={order._id} order={order} onUpdateStatus={updateStatus} onOrderUpdated={handleOrderUpdated} />)}
        </div>
      )}
    </div>
  );
}