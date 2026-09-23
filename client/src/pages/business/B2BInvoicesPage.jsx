import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import { b2bAPI } from '../../services/api';
import { downloadBlobResponse } from '../../utils/downloadBlob';

const STATUS_COLORS = {
  issued: { bg: '#dcfce7', color: '#15803d' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c' },
};

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
function Money({ value }) { return <span>₹{Number(value || 0).toLocaleString('en-IN')}</span>; }

export default function B2BInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchInvoices = useCallback(() => {
    setLoading(true);
    setError(false);
    b2bAPI.getInvoices()
      .then((res) => setInvoices(res.data.invoices))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const download = async (invoice) => {
    setDownloadingId(invoice._id);
    try {
      const res = await b2bAPI.downloadInvoicePdf(invoice._id);
      downloadBlobResponse(res, `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`);
    } catch {
      toast.error('Could not download invoice PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <SEO title="Invoices" canonical="/b2b/invoices" robots="noindex,nofollow" />
      <h1 className="font-serif font-black text-brown-dark text-xl sm:text-2xl mb-4">Invoices</h1>

      {loading ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">Loading invoices…</div>
      ) : error ? (
        <div className="py-12 text-center text-red-600 text-sm">Couldn't load invoices. Please try again.</div>
      ) : invoices.length === 0 ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">No invoices yet. They'll appear here once your orders are confirmed and dispatched.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {invoices.map((inv) => {
            const colors = STATUS_COLORS[inv.status] || {};
            return (
              <div key={inv._id} className="card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-brown-dark text-sm">{inv.invoiceNumber}</div>
                  <div className="text-xs text-brown-mid/50 mt-0.5">
                    Issued {formatDate(inv.issuedAt)} · Due {formatDate(inv.dueDate)}
                  </div>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ background: colors.bg, color: colors.color }}>
                    {inv.status === 'cancelled' ? 'Credited' : inv.status}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                  <div className="font-bold text-brown-dark text-sm"><Money value={inv.totals?.payable} /></div>
                  <button
                    onClick={() => download(inv)}
                    disabled={downloadingId === inv._id}
                    className="text-saffron font-semibold text-xs disabled:opacity-60"
                  >
                    {downloadingId === inv._id ? 'Downloading…' : 'Download PDF ↓'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
