import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import PageWrapper from '../../components/PageWrapper';
import InvoiceStatusPill from '../../components/b2b/InvoiceStatusPill';
import Money from '../../components/b2b/Money';
import { formatDate } from '../../utils/b2bFormat';
import { b2bAPI } from '../../services/api';
import { downloadBlobResponse } from '../../utils/downloadBlob';

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
    <PageWrapper>
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
          {invoices.map((inv, i) => (
            <motion.div
              key={inv._id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.04 }}
              className="card p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-bold text-brown-dark text-sm">{inv.invoiceNumber}</div>
                <div className="text-xs text-brown-mid/50 mt-0.5">
                  Issued {formatDate(inv.issuedAt)} · Due {formatDate(inv.dueDate)}
                </div>
                <InvoiceStatusPill status={inv.status} className="mt-1.5" />
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
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
