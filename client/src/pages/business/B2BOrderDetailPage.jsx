import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import B2BModal from '../../components/b2b/B2BModal';
import { b2bAPI } from '../../services/api';
import { downloadBlobResponse } from '../../utils/downloadBlob';

function formatDate(d) {
  return d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}
function Money({ value }) { return <span>₹{Number(value || 0).toLocaleString('en-IN')}</span>; }

const STATUS_STEPS = ['placed', 'confirmed', 'packed', 'dispatched', 'delivered'];

export default function B2BOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const fetchOrder = useCallback(() => {
    setLoading(true);
    setError(false);
    b2bAPI.getOrder(id)
      .then((res) => setOrder(res.data.order))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const submitCancel = async () => {
    setCancelling(true);
    try {
      await b2bAPI.cancelOrder(id, { reason: cancelReason });
      toast.success('Order cancelled');
      setCancelOpen(false);
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const reorder = () => {
    setReordering(true);
    try {
      const userId = JSON.parse(localStorage.getItem('nc_user'))?._id;
      if (!userId) throw new Error('no user');
      const draft = {};
      order.items.forEach((item) => { draft[item.catalogItem] = item.cases; });
      localStorage.setItem(`nc_b2b_draft_${userId}`, JSON.stringify(draft));
      toast.success('Items added to Quick Order');
      navigate('/b2b/order');
    } catch {
      toast.error('Could not reorder — please add items manually');
    } finally {
      setReordering(false);
    }
  };

  const downloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const res = await b2bAPI.downloadInvoicePdf(order.invoice._id);
      downloadBlobResponse(res, `${order.invoice.invoiceNumber.replace(/\//g, '-')}.pdf`);
    } catch {
      toast.error('Could not download invoice PDF');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-brown-mid/50 text-sm">Loading order…</div>;
  if (error || !order) return <div className="py-12 text-center text-red-600 text-sm">Order not found.</div>;

  const isTerminal = ['delivered', 'cancelled', 'rejected'].includes(order.status);
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div>
      <SEO title={`Order ${order.orderNumber}`} canonical={`/b2b/orders/${id}`} robots="noindex,nofollow" />

      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <Link to="/b2b/orders" className="text-xs text-saffron font-semibold">← Back to orders</Link>
          <h1 className="font-serif font-black text-brown-dark text-xl sm:text-2xl mt-1">{order.orderNumber}</h1>
          <p className="text-brown-mid/60 text-sm mt-0.5">Placed {formatDate(order.createdAt)}</p>
        </div>
        {order.creditHold && (
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#fee2e2', color: '#b91c1c' }}>On credit hold</span>
        )}
      </div>

      {/* Status timeline */}
      {!['cancelled', 'rejected'].includes(order.status) ? (
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={i <= currentStepIndex ? { background: 'linear-gradient(135deg,#e07000,#ff9010)', color: '#fff' } : { background: '#fef3e0', color: '#c8902a' }}
                >
                  {i + 1}
                </div>
                <span className="text-[10px] text-brown-mid/60 capitalize whitespace-nowrap">{step}</span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className="w-8 sm:w-12 h-0.5 mx-1" style={{ background: i < currentStepIndex ? '#e07000' : '#fef3e0' }} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-xl text-sm mb-6" style={{ background: '#fef2f2', color: '#991b1b' }}>
          This order was {order.status}{(order.cancelReason || order.rejectReason) ? `: ${order.cancelReason || order.rejectReason}` : '.'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-3">Items</div>
            <div className="flex flex-col gap-2.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-brown-dark">{item.name} ({item.size}) × {item.cases} case{item.cases > 1 ? 's' : ''}</span>
                  <span className="font-semibold text-brown-dark flex-shrink-0 ml-3"><Money value={item.lineTotal} /></span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between font-bold text-brown-dark text-base border-t pt-3 mt-3" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
              <span>Total</span><span><Money value={order.totals?.payable} /></span>
            </div>
          </div>

          {order.dispatch?.mode && (
            <div className="card p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-2">Dispatch</div>
              <div className="text-sm text-brown-dark flex flex-col gap-1">
                <div>Mode: <strong className="capitalize">{order.dispatch.mode.replace('_', ' ')}</strong></div>
                {order.dispatch.transporterName && <div>Transporter: {order.dispatch.transporterName}</div>}
                {order.dispatch.lrNumber && <div>LR number: {order.dispatch.lrNumber}</div>}
                {order.dispatch.vehicleNumber && <div>Vehicle: {order.dispatch.vehicleNumber}</div>}
                {order.dispatch.trackingUrl && (
                  <a href={order.dispatch.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-saffron font-semibold">Track shipment →</a>
                )}
              </div>
            </div>
          )}

          {order.invoice && (
            <div className="card p-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-brown-dark">Invoice {order.invoice.invoiceNumber}</div>
              <button onClick={downloadInvoice} disabled={downloadingInvoice} className="text-saffron font-semibold text-sm disabled:opacity-60">
                {downloadingInvoice ? 'Downloading…' : 'Download PDF →'}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-2">Ship to</div>
            <div className="text-sm text-brown-dark leading-relaxed">
              {order.shippingAddress?.contactName}<br />
              {order.shippingAddress?.line1}{order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
            </div>
          </div>

          {order.status === 'placed' && (
            <button onClick={() => setCancelOpen(true)} className="rounded-xl text-sm font-semibold text-red-600" style={{ minHeight: 44, background: '#fef2f2' }}>
              Cancel order
            </button>
          )}
          {isTerminal && (
            <button onClick={reorder} disabled={reordering} className="btn-saffron disabled:opacity-60" style={{ minHeight: 44 }}>
              {reordering ? 'Adding…' : 'Reorder'}
            </button>
          )}
        </div>
      </div>

      <B2BModal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this order">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-brown-mid/60">This cannot be undone.</p>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Reason *</label>
            <textarea className="form-input text-base" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </div>
          <button
            onClick={submitCancel}
            disabled={cancelling || cancelReason.trim().length < 3}
            className="rounded-full font-bold text-white disabled:opacity-60"
            style={{ minHeight: 48, background: '#dc2626' }}
          >
            {cancelling ? 'Cancelling…' : 'Cancel order'}
          </button>
        </div>
      </B2BModal>
    </div>
  );
}
