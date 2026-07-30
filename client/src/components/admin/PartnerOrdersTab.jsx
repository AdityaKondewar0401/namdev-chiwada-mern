import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { partnerOrderAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending: { color: '#b45309', bg: '#fef3c7', label: 'Awaiting Review' },
  approved: { color: '#15803d', bg: '#dcfce7', label: 'Approved' },
  rejected: { color: '#b91c1c', bg: '#fee2e2', label: 'Rejected' },
};

// ─────────────────────────────────────────────
// PartnerOrdersTab — review queue for orders partners place themselves.
// Approving lets the admin adjust quantities/prices before it becomes a
// real Consignment (the partner's numbers are just an estimate at their
// discount rate) — rejecting just needs an optional reason.
// ─────────────────────────────────────────────
export default function PartnerOrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null); // order being expanded for review
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewAdvancePercent, setReviewAdvancePercent] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    partnerOrderAPI
      .getAll()
      .then((res) => setOrders(res.data.orderRequests || []))
      .catch(() => toast.error('Failed to load partner order requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openReview = (order) => {
    setReviewingId(order._id);
    setRejectingId(null);
    setReviewItems(order.items.map((i) => ({ name: i.name, size: i.size, qty: i.qty, unitPrice: i.estimatedUnitPrice })));
    setReviewAdvancePercent(order.partner?.defaultAdvancePercent ?? 50);
  };

  const updateReviewItem = (index, field, value) => {
    setReviewItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const reviewTotal = reviewItems.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);

  const handleApprove = async (order) => {
    const validItems = reviewItems.filter((i) => i.name && Number(i.qty) > 0 && Number(i.unitPrice) >= 0);
    if (validItems.length === 0) {
      toast.error('Add at least one valid product line');
      return;
    }
    setSaving(true);
    try {
      const res = await partnerOrderAPI.approve(order._id, {
        items: validItems.map((i) => ({
          name: i.name,
          size: i.size || undefined,
          qty: Number(i.qty),
          unitPrice: Number(i.unitPrice),
        })),
        advancePercent: reviewAdvancePercent !== '' ? Number(reviewAdvancePercent) : undefined,
      });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data.orderRequest : o)));
      toast.success('Order approved and dispatched as a consignment');
      setReviewingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve order');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (order) => {
    setSaving(true);
    try {
      const res = await partnerOrderAPI.reject(order._id, { reason: rejectReason || undefined });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data.orderRequest : o)));
      toast.success('Order request declined');
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const reviewedOrders = orders.filter((o) => o.status !== 'pending');

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-serif font-black text-brown-dark text-2xl">Partner Orders</h2>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>
          {pendingOrders.length} awaiting review
        </span>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16 text-brown-mid/50">No partner order requests yet.</div>
      )}

      <div className="space-y-3">
        {[...pendingOrders, ...reviewedOrders].map((order) => {
          const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
          const isReviewing = reviewingId === order._id;
          const isRejecting = rejectingId === order._id;

          return (
            <div
              key={order._id}
              className="bg-white rounded-2xl p-5"
              style={{ boxShadow: '0 2px 12px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <div className="font-bold text-brown-dark text-sm">
                    {order.partner?.businessName || 'Unknown partner'}
                  </div>
                  <div className="text-xs text-brown-mid/60">
                    {new Date(order.createdAt).toLocaleDateString()} · ~₹{order.estimatedTotal.toLocaleString()} estimated
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                  {statusConfig.label}
                </span>
              </div>

              <div className="text-xs text-brown-mid/70 mb-3">
                {order.items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty}`).join(', ')}
              </div>
              {order.notes && <div className="text-xs text-brown-mid/50 italic mb-3">"{order.notes}"</div>}
              {order.status === 'rejected' && order.rejectionReason && (
                <div className="text-xs text-red-600 mb-2">Reason: {order.rejectionReason}</div>
              )}

              {order.status === 'pending' && !isReviewing && !isRejecting && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openReview(order)}
                    className="px-4 py-2 rounded-xl font-bold text-white text-xs"
                    style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 36 }}
                  >
                    ✅ Review & Approve
                  </button>
                  <button
                    onClick={() => { setRejectingId(order._id); setReviewingId(null); }}
                    className="px-4 py-2 rounded-xl font-bold text-xs"
                    style={{ background: '#fef2f2', color: '#dc2626', minHeight: 36 }}
                  >
                    Decline
                  </button>
                </div>
              )}

              <AnimatePresence>
                {isRejecting && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 pt-3 border-t border-brown-mid/10">
                    <input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason (optional) — e.g. out of stock this week"
                      className="form-input text-sm mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(order)}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl font-bold text-xs text-white disabled:opacity-60"
                        style={{ background: '#dc2626', minHeight: 36 }}
                      >
                        {saving ? 'Declining...' : 'Confirm Decline'}
                      </button>
                      <button
                        onClick={() => setRejectingId(null)}
                        className="px-4 py-2 rounded-xl font-bold text-xs border border-brown-mid/20 text-brown-mid"
                        style={{ minHeight: 36 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {isReviewing && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 pt-3 border-t border-brown-mid/10">
                    <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-2">
                      Confirm items &amp; final prices
                    </label>
                    <div className="space-y-2 mb-3">
                      {reviewItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
                          <input
                            value={item.name}
                            onChange={(e) => updateReviewItem(index, 'name', e.target.value)}
                            className="form-input text-sm col-span-2 sm:col-span-5"
                          />
                          <input
                            value={item.size || ''}
                            onChange={(e) => updateReviewItem(index, 'size', e.target.value)}
                            placeholder="Size"
                            className="form-input text-sm col-span-1 sm:col-span-3"
                          />
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => updateReviewItem(index, 'qty', e.target.value)}
                            className="form-input text-sm col-span-1 sm:col-span-2"
                          />
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateReviewItem(index, 'unitPrice', e.target.value)}
                            placeholder="₹/unit"
                            className="form-input text-sm col-span-2 sm:col-span-2"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                          Advance %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={reviewAdvancePercent}
                          onChange={(e) => setReviewAdvancePercent(e.target.value)}
                          className="form-input text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="text-sm font-bold text-brown-dark">
                          Total: ₹{reviewTotal.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(order)}
                        disabled={saving}
                        className="px-5 py-2.5 rounded-full font-bold text-white text-sm disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 44 }}
                      >
                        {saving ? 'Dispatching...' : '✅ Approve & Dispatch'}
                      </button>
                      <button
                        onClick={() => setReviewingId(null)}
                        className="px-5 py-2.5 rounded-full font-bold text-xs border border-brown-mid/20 text-brown-mid"
                        style={{ minHeight: 44 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
