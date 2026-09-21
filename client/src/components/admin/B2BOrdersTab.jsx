import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { b2bAdminAPI } from '../../services/api';
import B2BModal from '../b2b/B2BModal';
import B2BDisabledNotice from './B2BDisabledNotice';
import { downloadBlobResponse } from '../../utils/downloadBlob';

const STATUS_FILTERS = ['', 'placed', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled', 'rejected'];
const NEXT_STATUSES = {
  placed: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [], cancelled: [], rejected: [],
};
const DISPATCH_MODES = [
  { value: 'own_vehicle', label: 'Own vehicle' },
  { value: 'transporter', label: 'Transporter' },
  { value: 'courier', label: 'Courier' },
  { value: 'pickup', label: 'Buyer pickup' },
];
const STATUS_COLORS = {
  placed: { bg: '#fef3c7', color: '#b45309' }, confirmed: { bg: '#dbeafe', color: '#1d4ed8' },
  packed: { bg: '#ede9fe', color: '#6d28d9' }, dispatched: { bg: '#cffafe', color: '#0e7490' },
  delivered: { bg: '#dcfce7', color: '#15803d' }, cancelled: { bg: '#fee2e2', color: '#b91c1c' },
  rejected: { bg: '#fee2e2', color: '#b91c1c' },
};

function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }
function Money({ value }) { return <span>₹{Number(value || 0).toLocaleString('en-IN')}</span>; }
function StatusPill({ status }) {
  const c = STATUS_COLORS[status] || {};
  return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ background: c.bg, color: c.color }}>{status}</span>;
}

export default function B2BOrdersTab() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusModal, setStatusModal] = useState(null); // target status string
  const [statusForm, setStatusForm] = useState({ note: '', reason: '', dispatch: { mode: '' } });
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [holdSubmitting, setHoldSubmitting] = useState(false);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    b2bAdminAPI.listOrders({ status: statusFilter || undefined })
      .then((res) => { setOrders(res.data.orders); setTotal(res.data.total); })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openDetail = (id) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    b2bAdminAPI.getOrder(id)
      .then((res) => setDetail(res.data.order))
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setDetailLoading(false));
  };
  const closeDetail = () => { setDetailId(null); setDetail(null); };
  const refreshAfter = () => { fetchOrders(); if (detailId) openDetail(detailId); };

  const openStatusModal = (status) => {
    setStatusModal(status);
    setStatusForm({ note: '', reason: '', dispatch: { mode: '' } });
  };

  const submitStatus = async (e) => {
    e.preventDefault();
    setStatusSubmitting(true);
    try {
      const body = { status: statusModal, note: statusForm.note || undefined };
      if (['rejected', 'cancelled'].includes(statusModal)) body.reason = statusForm.reason;
      if (statusModal === 'dispatched') body.dispatch = statusForm.dispatch;
      await b2bAdminAPI.updateOrderStatus(detail._id, body);
      toast.success(`Order marked ${statusModal}`);
      setStatusModal(null);
      refreshAfter();
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresForce && window.confirm(`${data.message}\n\nDispatch anyway?`)) {
        try {
          const body = { status: statusModal, note: statusForm.note || undefined, dispatch: statusForm.dispatch, force: true };
          await b2bAdminAPI.updateOrderStatus(detail._id, body);
          toast.success('Order marked dispatched');
          setStatusModal(null);
          refreshAfter();
        } catch (err2) {
          toast.error(err2.response?.data?.message || 'Failed to update status');
        }
      } else {
        toast.error(data?.message || 'Failed to update status');
      }
    } finally {
      setStatusSubmitting(false);
    }
  };

  const issueInvoice = async () => {
    setInvoiceSubmitting(true);
    try {
      await b2bAdminAPI.issueInvoice(detail._id);
      toast.success('Invoice issued');
      refreshAfter();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue invoice');
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const downloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const res = await b2bAdminAPI.downloadInvoicePdf(detail.invoice._id);
      downloadBlobResponse(res, `${detail.invoice.invoiceNumber.replace(/\//g, '-')}.pdf`);
    } catch {
      toast.error('Could not download invoice PDF');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const overrideHold = async () => {
    setHoldSubmitting(true);
    try {
      await b2bAdminAPI.overrideCreditHold(detail._id, { note: 'Overridden by admin' });
      toast.success('Credit hold overridden');
      refreshAfter();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to override hold');
    } finally {
      setHoldSubmitting(false);
    }
  };

  return (
    <div>
      <B2BDisabledNotice />
      <div className="mb-4">
        <h2 className="font-serif font-black text-brown-dark text-lg">B2B Orders</h2>
        <p className="text-brown-mid/60 text-sm mt-0.5">{total} order{total === 1 ? '' : 's'}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-4 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 capitalize"
            style={{ height: 40, ...(statusFilter === s ? { background: 'linear-gradient(135deg,#e07000,#ff9010)', color: '#fff' } : { background: '#fff', color: '#2d1a00', border: '1px solid rgba(224,112,0,0.15)' }) }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">No orders match this filter.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <button key={o._id} onClick={() => openDetail(o._id)} className="card p-4 flex items-center justify-between gap-3 text-left w-full">
              <div className="min-w-0">
                <div className="font-bold text-brown-dark text-sm flex items-center gap-2">
                  {o.orderNumber}
                  {o.business?.isTest && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#f3e8ff', color: '#7e22ce' }}>TEST</span>}
                </div>
                <div className="text-xs text-brown-mid/60 mt-0.5">{o.business?.businessName} · {formatDate(o.createdAt)}</div>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                <div className="font-bold text-brown-dark text-sm"><Money value={o.totals?.payable} /></div>
                <StatusPill status={o.status} />
                {o.creditHold && <span className="text-[10px] font-bold text-red-600">ON HOLD</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      <B2BModal open={!!detailId} onClose={closeDetail} title="B2B Order" widthClass="sm:max-w-lg">
        {detailLoading || !detail ? (
          <div className="py-10 text-center text-brown-mid/50 text-sm">Loading…</div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif font-black text-brown-dark text-lg">{detail.orderNumber}</div>
                <div className="text-sm text-brown-mid/60">{detail.business?.businessName}</div>
              </div>
              <StatusPill status={detail.status} />
            </div>

            {detail.creditHold && (
              <div className="p-3 rounded-xl text-sm flex items-center justify-between gap-2" style={{ background: '#fef2f2', color: '#991b1b' }}>
                <span>On credit hold</span>
                <button onClick={overrideHold} disabled={holdSubmitting} className="font-bold underline disabled:opacity-60">
                  {holdSubmitting ? 'Overriding…' : 'Override'}
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {detail.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-brown-dark">{item.name} ({item.size}) × {item.cases}</span>
                  <span className="font-semibold text-brown-dark"><Money value={item.lineTotal} /></span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between font-bold text-brown-dark border-t pt-3" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
              <span>Total</span><span><Money value={detail.totals?.payable} /></span>
            </div>

            <div className="text-sm text-brown-mid/70">
              <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-1">Ship to</div>
              {detail.shippingAddress?.line1}, {detail.shippingAddress?.city}, {detail.shippingAddress?.state} {detail.shippingAddress?.pincode}
            </div>

            {detail.invoice ? (
              <div className="p-3 rounded-xl flex items-center justify-between gap-2 text-sm" style={{ background: '#fef3e0' }}>
                <span className="font-semibold text-brown-dark">Invoice {detail.invoice.invoiceNumber}</span>
                <button onClick={downloadInvoice} disabled={downloadingInvoice} className="text-saffron font-semibold disabled:opacity-60">
                  {downloadingInvoice ? 'Downloading…' : 'Download PDF ↓'}
                </button>
              </div>
            ) : !['placed', 'cancelled', 'rejected'].includes(detail.status) && (
              <button onClick={issueInvoice} disabled={invoiceSubmitting}
                className="w-full rounded-xl text-sm font-semibold text-brown-dark disabled:opacity-60"
                style={{ minHeight: 44, background: '#fef3e0' }}>
                {invoiceSubmitting ? 'Issuing…' : 'Issue invoice'}
              </button>
            )}

            {(NEXT_STATUSES[detail.status] || []).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
                {NEXT_STATUSES[detail.status].map((s) => (
                  <button key={s} onClick={() => openStatusModal(s)}
                    className="flex-1 rounded-xl text-sm font-semibold capitalize"
                    style={{
                      minHeight: 44,
                      ...(['cancelled', 'rejected'].includes(s) ? { color: '#dc2626', background: '#fef2f2' } : { color: '#fff', background: 'linear-gradient(135deg,#e07000,#ff9010)' }),
                    }}>
                    Mark {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </B2BModal>

      <B2BModal open={!!statusModal} onClose={() => setStatusModal(null)} title={statusModal ? `Mark order ${statusModal}` : ''}>
        <form onSubmit={submitStatus} className="flex flex-col gap-4" noValidate>
          {statusModal === 'dispatched' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-brown-dark mb-1.5">Dispatch mode *</label>
                <select className="form-input text-base" required value={statusForm.dispatch.mode}
                  onChange={(e) => setStatusForm((f) => ({ ...f, dispatch: { ...f.dispatch, mode: e.target.value } }))}>
                  <option value="">Select…</option>
                  {DISPATCH_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-brown-dark mb-1.5">Transporter</label>
                  <input className="form-input text-base" value={statusForm.dispatch.transporterName || ''}
                    onChange={(e) => setStatusForm((f) => ({ ...f, dispatch: { ...f.dispatch, transporterName: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brown-dark mb-1.5">LR number</label>
                  <input className="form-input text-base" value={statusForm.dispatch.lrNumber || ''}
                    onChange={(e) => setStatusForm((f) => ({ ...f, dispatch: { ...f.dispatch, lrNumber: e.target.value } }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brown-dark mb-1.5">Vehicle number</label>
                <input className="form-input text-base" value={statusForm.dispatch.vehicleNumber || ''}
                  onChange={(e) => setStatusForm((f) => ({ ...f, dispatch: { ...f.dispatch, vehicleNumber: e.target.value } }))} />
              </div>
            </>
          )}

          {['rejected', 'cancelled'].includes(statusModal) && (
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Reason *</label>
              <textarea className="form-input text-base" rows={3} required
                value={statusForm.reason} onChange={(e) => setStatusForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Note (optional)</label>
            <textarea className="form-input text-base" rows={2}
              value={statusForm.note} onChange={(e) => setStatusForm((f) => ({ ...f, note: e.target.value }))} />
          </div>

          <button type="submit" disabled={statusSubmitting} className="btn-saffron disabled:opacity-60" style={{ minHeight: 48 }}>
            {statusSubmitting ? 'Saving…' : `Mark ${statusModal}`}
          </button>
        </form>
      </B2BModal>
    </div>
  );
}
