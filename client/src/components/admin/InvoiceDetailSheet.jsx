import { useEffect, useState } from 'react';
import { Download, Send, CheckCircle2, XCircle, Mail, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminSheet from './AdminSheet';
import { Pill } from './AdminUI';
import { invoiceAPI } from '../../services/api';
import { downloadPdf, apiErrorMessage } from '../../utils/pdfDownload';
import { formatINR, formatDate, STATUS_TONES } from '../../utils/invoiceFormat';

const PAID_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'bank', label: 'Bank transfer' },
  { id: 'card', label: 'Card' },
];

const actionBtn = 'inline-flex items-center justify-center gap-2 rounded-full text-sm font-bold min-h-[44px] px-4 border transition-colors disabled:opacity-60';

// `onSendRequest` opens the Send dialog in the parent: a presence-animated
// dialog nested inside this already-animated sheet never finishes its exit.
// Bump `refreshKey` to reload after something changed outside (e.g. a send).
export default function InvoiceDetailSheet({ invoiceId, refreshKey, onClose, onChanged, onSendRequest }) {
  const [invoice, setInvoice] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [panel, setPanel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [paidMethod, setPaidMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    let active = true;
    invoiceAPI.get(invoiceId)
      .then((res) => { if (active) setInvoice(res.data.invoice); })
      .catch(async (err) => { if (active) setLoadError(await apiErrorMessage(err, "This invoice couldn't be loaded.")); });
    return () => { active = false; };
  }, [invoiceId, refreshKey]);

  const reload = async () => {
    const res = await invoiceAPI.get(invoiceId);
    setInvoice(res.data.invoice);
    onChanged?.();
  };

  const download = async () => {
    setBusy(true);
    try {
      await downloadPdf(() => invoiceAPI.downloadPdf(invoiceId), `${invoice.number.replace(/\//g, '-')}.pdf`);
    } catch (err) {
      toast.error(await apiErrorMessage(err, "The PDF couldn't be downloaded."));
    } finally {
      setBusy(false);
    }
  };

  const markPaid = async () => {
    setBusy(true);
    try {
      const res = await invoiceAPI.markPaid(invoiceId, { method: paidMethod, reference: reference.trim() });
      toast.success(res.data.message);
      setPanel(null);
      await reload();
    } catch (err) {
      toast.error(await apiErrorMessage(err, "The invoice couldn't be updated."));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (reason.trim().length < 3) { toast.error('Give a short reason (at least 3 characters)'); return; }
    setBusy(true);
    try {
      const res = await invoiceAPI.cancel(invoiceId, reason.trim());
      toast.success(res.data.message);
      setPanel(null);
      await reload();
    } catch (err) {
      toast.error(await apiErrorMessage(err, "The invoice couldn't be cancelled."));
    } finally {
      setBusy(false);
    }
  };

  const tone = invoice ? STATUS_TONES[invoice.statusTone] : null;
  const isOffline = invoice?.source === 'offline';

  return (
    <AdminSheet title="Invoice" onClose={onClose}>
      {loadError && <p className="text-sm text-red-600">{loadError}</p>}
      {!invoice && !loadError && (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}</div>
      )}

      {invoice && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="font-mono font-black text-brown-dark text-lg">{invoice.number}</div>
              <div className="text-xs text-brown-mid/70 mt-0.5">
                {invoice.issuedOn} · {isOffline ? 'Offline sale' : `Website order #${invoice.orderId?.slice(-8).toUpperCase()}`}
              </div>
            </div>
            <Pill color={tone.color} bg={tone.bg} border={tone.border}>{invoice.statusLabel}</Pill>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-brown-mid/60 mb-1">Billed to</div>
              <div className="font-semibold text-brown-dark">{invoice.customer.name}</div>
              {invoice.customer.addressLines.map((line, i) => <div key={i} className="text-brown-mid/80">{line}</div>)}
              {invoice.customer.phone && <div className="text-brown-mid/80">{invoice.customer.phone}</div>}
              {invoice.customer.email && <div className="text-brown-mid/80 break-all">{invoice.customer.email}</div>}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-brown-mid/60 mb-1">Payment</div>
              <div className="font-semibold text-brown-dark">{invoice.paymentMethod || '—'}</div>
              {invoice.paymentRef && <div className="text-brown-mid/80 break-all">Ref. {invoice.paymentRef}</div>}
              {invoice.cancelled && invoice.cancelReason && (
                <div className="text-red-700 mt-1">Cancelled: {invoice.cancelReason}</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-saffron/15 overflow-hidden text-sm">
            {invoice.lines.map((line, i) => (
              <div key={i} className="flex items-start justify-between gap-3 px-4 py-2.5 border-b border-saffron/10 last:border-b-0">
                <div className="min-w-0">
                  <div className="font-semibold text-brown-dark">{line.name}</div>
                  <div className="text-xs text-brown-mid/70">
                    {line.size ? `${line.size} · ` : ''}{formatINR(line.price)} × {line.qty}
                  </div>
                </div>
                <div className="font-bold text-brown-dark tabular-nums whitespace-nowrap">{formatINR(line.amount)}</div>
              </div>
            ))}
            <div className="bg-cream px-4 py-3 space-y-1 tabular-nums">
              <div className="flex justify-between text-brown-mid/80"><span>Subtotal</span><span>{formatINR(invoice.subtotal)}</span></div>
              {invoice.showShipping && (
                <div className="flex justify-between text-brown-mid/80">
                  <span>{invoice.shippingLabel}</span><span>{invoice.shipping ? formatINR(invoice.shipping) : 'Free'}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-brown-mid/80"><span>{invoice.discountLabel}</span><span>− {formatINR(invoice.discount)}</span></div>
              )}
              <div className="flex justify-between font-black text-brown-dark pt-1 border-t border-saffron/15">
                <span>{invoice.totalLabel}</span><span className="text-saffron">{formatINR(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && <p className="text-sm text-brown-mid/80"><span className="font-semibold text-brown-dark">Note:</span> {invoice.notes}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" onClick={download} disabled={busy}
              className={`${actionBtn} text-white border-transparent`} style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
              <Download size={16} /> Download PDF
            </button>
            <button type="button" onClick={() => onSendRequest(invoice)} disabled={busy || invoice.cancelled}
              className={`${actionBtn} text-brown-dark border-saffron/30 bg-white hover:bg-saffron-pale`}>
              <Send size={16} /> Send invoice
            </button>
            {isOffline && !invoice.cancelled && !invoice.paid && (
              <button type="button" onClick={() => setPanel(panel === 'paid' ? null : 'paid')} disabled={busy}
                className={`${actionBtn} text-green-800 border-green-200 bg-green-50 hover:bg-green-100`}>
                <CheckCircle2 size={16} /> Mark as paid
              </button>
            )}
            {isOffline && !invoice.cancelled && (
              <button type="button" onClick={() => setPanel(panel === 'cancel' ? null : 'cancel')} disabled={busy}
                className={`${actionBtn} text-red-700 border-red-200 bg-white hover:bg-red-50`}>
                <XCircle size={16} /> Cancel invoice
              </button>
            )}
          </div>

          {panel === 'paid' && (
            <div className="rounded-2xl border border-green-200 bg-green-50/60 p-4 space-y-3">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Paid by">
                {PAID_METHODS.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={paidMethod === m.id} onClick={() => setPaidMethod(m.id)}
                    className={`px-3.5 min-h-[38px] rounded-full text-sm font-semibold border ${
                      paidMethod === m.id ? 'bg-green-800 text-white border-green-800' : 'bg-white text-brown-dark border-green-200'}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <input className="form-input w-full" maxLength={100} value={reference} placeholder="Reference (optional)"
                aria-label="Payment reference" onChange={(e) => setReference(e.target.value)} />
              <button type="button" onClick={markPaid} disabled={busy}
                className={`${actionBtn} w-full text-white border-transparent bg-green-700 hover:bg-green-800`}>
                Confirm payment received
              </button>
            </div>
          )}

          {panel === 'cancel' && (
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 space-y-3">
              <p className="text-sm text-red-800 flex gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                The invoice keeps its number, is marked CANCELLED and drops out of sales totals. This can't be undone.
              </p>
              <input className="form-input w-full" maxLength={300} value={reason} placeholder="Reason, e.g. wrong quantity, reissued"
                aria-label="Reason for cancelling" onChange={(e) => setReason(e.target.value)} />
              <button type="button" onClick={cancel} disabled={busy}
                className={`${actionBtn} w-full text-white border-transparent bg-red-700 hover:bg-red-800`}>
                Cancel invoice {invoice.number}
              </button>
            </div>
          )}

          {invoice.emailLog.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-brown-mid/60 mb-2">Email history</div>
              <ul className="space-y-1.5 text-sm">
                {invoice.emailLog.slice().reverse().map((entry, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Mail size={14} className={`mt-0.5 flex-shrink-0 ${entry.ok ? 'text-green-700' : 'text-red-600'}`} />
                    <span className="text-brown-mid/80 min-w-0">
                      {entry.ok ? 'Sent' : 'Failed'} to <span className="text-brown-dark break-all">{entry.to || 'customer'}</span>
                      {' · '}{formatDate(entry.at)}{entry.kind === 'order-confirmation' ? ' · with order confirmation' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AdminSheet>
  );
}
