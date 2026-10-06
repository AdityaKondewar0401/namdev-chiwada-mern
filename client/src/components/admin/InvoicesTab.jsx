import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, Download, Receipt, Wallet, AlertCircle, Mail, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { StatTile, Pill } from './AdminUI';
import NewInvoiceSheet from './NewInvoiceSheet';
import InvoiceDetailSheet from './InvoiceDetailSheet';
import SendInvoiceDialog from './SendInvoiceDialog';
import { invoiceAPI } from '../../services/api';
import { downloadPdf, apiErrorMessage } from '../../utils/pdfDownload';
import { formatINR, formatDate, STATUS_TONES } from '../../utils/invoiceFormat';

const SOURCES = [
  { id: '', label: 'All' },
  { id: 'offline', label: 'Offline' },
  { id: 'website', label: 'Website' },
];
const STATES = [
  { id: '', label: 'Any status' },
  { id: 'paid', label: 'Paid' },
  { id: 'due', label: 'Due' },
  { id: 'cancelled', label: 'Cancelled' },
];

function Chips({ options, value, onChange, label }) {
  return (
    <div className="flex gap-1.5 flex-wrap" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id || 'all'} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}
          className={`px-3.5 min-h-[36px] rounded-full text-xs font-bold border transition-colors ${
            value === o.id ? 'bg-brown-dark text-white border-brown-dark' : 'bg-white text-brown-dark border-saffron/20 hover:border-saffron/50'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function InvoicesTab({ products, summary, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [sendTarget, setSendTarget] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await invoiceAPI.list({ q: search || undefined, source: source || undefined, state: state || undefined, page, limit: 20 });
      setRows(res.data.invoices);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      setError(await apiErrorMessage(err, "Invoices couldn't be loaded."));
    } finally {
      setLoading(false);
    }
  }, [search, source, state, page]);

  useEffect(() => { load(); }, [load]);

  const refresh = () => { load(); onChanged?.(); };

  const download = async (e, row) => {
    e.stopPropagation();
    setDownloadingId(row.id);
    try {
      await downloadPdf(() => invoiceAPI.downloadPdf(row.id), `${row.number.replace(/\//g, '-')}.pdf`);
    } catch (err) {
      toast.error(await apiErrorMessage(err, "The PDF couldn't be downloaded."));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-serif font-black text-brown-dark text-2xl mb-1">Invoices</h2>
          <p className="text-xs text-brown-mid/60">Every website and offline sale, numbered in one series.</p>
        </div>
        <button type="button" onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full font-bold text-white text-sm px-5 min-h-[44px]"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 4px 12px rgba(224,112,0,0.25)' }}>
          <Plus size={16} /> New offline invoice
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatTile icon={<Wallet size={19} />} label="Offline sales" value={formatINR(summary?.offlineSales || 0)} color="#2d5a1b" />
        <StatTile icon={<AlertCircle size={19} />} label="Offline amount due" value={formatINR(summary?.offlineDue || 0)}
          color={summary?.offlineDue > 0 ? '#b45309' : '#2d5a1b'}
          sub={summary?.offlineDueCount ? `${summary.offlineDueCount} unpaid` : undefined} />
        <div className="col-span-2 lg:col-span-1">
          <StatTile icon={<Receipt size={19} />} label="Offline invoices" value={summary?.offlineCount || 0} color="#e07000" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-mid/50 pointer-events-none" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search invoices"
            placeholder="Search by invoice number, customer name or phone"
            className="form-input w-full pl-10" />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Chips label="Source" options={SOURCES} value={source} onChange={(v) => { setSource(v); setPage(1); }} />
          <Chips label="Status" options={STATES} value={state} onChange={(v) => { setState(v); setPage(1); }} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && !rows.length ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-[72px] rounded-2xl skeleton" />)}</div>
      ) : !rows.length ? (
        <div className="text-center py-14 text-brown-mid/70">
          <Inbox size={34} className="mx-auto mb-3 text-saffron/60" />
          <p className="font-semibold text-brown-dark">{search || source || state ? 'No invoices match these filters' : 'No invoices yet'}</p>
          <p className="text-sm mt-1">
            {search || source || state ? 'Try a different search or filter.' : 'Website orders get one automatically. Create one for an offline sale with New offline invoice.'}
          </p>
        </div>
      ) : (
        <ul className={`space-y-2 ${loading ? 'opacity-60' : ''}`}>
          {rows.map((row) => {
            const tone = STATUS_TONES[row.statusTone];
            return (
              <li key={row.id}>
                <div role="button" tabIndex={0} onClick={() => setOpenId(row.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(row.id); } }}
                  className="w-full flex items-center gap-3 rounded-2xl border border-saffron/10 bg-white px-4 py-3 hover:border-saffron/40 cursor-pointer text-left">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-brown-dark">{row.number}</span>
                      <Pill color={row.source === 'offline' ? '#7a3300' : '#1d4ed8'} bg={row.source === 'offline' ? '#fff0d6' : '#dbeafe'}>
                        {row.source === 'offline' ? 'Offline' : 'Website'}
                      </Pill>
                      <Pill color={tone.color} bg={tone.bg} border={tone.border}>{row.statusLabel}</Pill>
                    </div>
                    <div className="text-xs text-brown-mid/75 mt-1 truncate">
                      {row.customer.name}{row.customer.phone ? ` · ${row.customer.phone}` : ''} · {formatDate(row.issuedAt)}
                      {row.lastEmail?.ok && (
                        <span className="inline-flex items-center gap-1 ml-2 text-green-700"><Mail size={11} /> Emailed</span>
                      )}
                    </div>
                  </div>
                  <div className="font-black text-brown-dark tabular-nums text-sm sm:text-base whitespace-nowrap">{formatINR(row.total)}</div>
                  <button type="button" onClick={(e) => download(e, row)} disabled={downloadingId === row.id}
                    aria-label={`Download ${row.number} as PDF`}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-saffron hover:bg-saffron-pale flex-shrink-0 disabled:opacity-50">
                    <Download size={17} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-4 min-h-[40px] rounded-full border border-saffron/25 font-semibold disabled:opacity-40">Previous</button>
          <span className="text-brown-mid/70">Page {page} of {pages} · {total} invoices</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
            className="px-4 min-h-[40px] rounded-full border border-saffron/25 font-semibold disabled:opacity-40">Next</button>
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <NewInvoiceSheet
            products={products}
            onClose={() => setCreating(false)}
            onCreated={(invoice) => { setCreating(false); setOpenId(invoice.id); refresh(); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openId && (
          <InvoiceDetailSheet
            invoiceId={openId}
            refreshKey={detailVersion}
            onClose={() => setOpenId(null)}
            onChanged={refresh}
            onSendRequest={(invoice) => setSendTarget({ id: invoice.id, number: invoice.number, email: invoice.customer.email })}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sendTarget && (
          <SendInvoiceDialog
            label={`Invoice ${sendTarget.number}`}
            defaultEmail={sendTarget.email}
            onSend={(data) => invoiceAPI.send(sendTarget.id, data)}
            onSent={() => { setDetailVersion((v) => v + 1); refresh(); }}
            onClose={() => setSendTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
