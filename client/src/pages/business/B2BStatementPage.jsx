import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import PageWrapper from '../../components/PageWrapper';
import StatGrid from '../../components/b2b/StatGrid';
import Money from '../../components/b2b/Money';
import { formatDate } from '../../utils/b2bFormat';
import { b2bAPI } from '../../services/api';
import { downloadBlobResponse } from '../../utils/downloadBlob';

const TYPE_LABELS = {
  opening_balance: 'Opening balance',
  invoice: 'Invoice',
  payment: 'Payment received',
  credit_note: 'Credit note',
  adjustment: 'Adjustment',
};

export default function B2BStatementPage() {
  const [statement, setStatement] = useState(null);
  const [creditSummary, setCreditSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [range, setRange] = useState({ from: '', to: '' });
  const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });

  const fetchStatement = useCallback(() => {
    setLoading(true);
    setError(false);
    b2bAPI.getLedger({ from: appliedRange.from || undefined, to: appliedRange.to || undefined })
      .then((res) => {
        setStatement(res.data);
        setCreditSummary(res.data.creditSummary || null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [appliedRange]);

  useEffect(() => { fetchStatement(); }, [fetchStatement]);

  const applyRange = (e) => {
    e.preventDefault();
    setAppliedRange(range);
  };

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const res = await b2bAPI.downloadLedgerCsv({ from: appliedRange.from || undefined, to: appliedRange.to || undefined });
      downloadBlobResponse(res, 'statement.csv');
    } catch {
      toast.error('Could not download statement CSV');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <PageWrapper>
      <SEO title="Statement" canonical="/b2b/statement" robots="noindex,nofollow" />
      <h1 className="font-serif font-black text-brown-dark text-xl sm:text-2xl mb-4">Statement</h1>

      {creditSummary && (
        <div className="mb-4">
          <StatGrid tiles={[
            { label: 'Outstanding', value: <Money value={creditSummary.outstanding} /> },
            { label: 'Available credit', value: <Money value={creditSummary.availableCredit} /> },
            { label: 'Credit limit', value: <Money value={creditSummary.creditLimit} /> },
          ]} />
        </div>
      )}

      <form onSubmit={applyRange} className="card p-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-4">
        <div className="flex-1">
          <label htmlFor="statement-from" className="block text-xs font-semibold text-brown-dark mb-1.5">From</label>
          <input id="statement-from" type="date" className="form-input text-base" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
        </div>
        <div className="flex-1">
          <label htmlFor="statement-to" className="block text-xs font-semibold text-brown-dark mb-1.5">To</label>
          <input id="statement-to" type="date" className="form-input text-base" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
        </div>
        <button type="submit" className="rounded-xl text-sm font-semibold text-brown-dark flex-shrink-0 transition-transform active:scale-95" style={{ minHeight: 48, background: '#fef3e0', padding: '0 20px' }}>
          Apply
        </button>
        <button type="button" onClick={downloadCsv} disabled={downloading || loading} className="btn-saffron text-sm flex-shrink-0 disabled:opacity-60" style={{ minHeight: 48, padding: '0 20px' }}>
          {downloading ? 'Downloading…' : 'Export CSV'}
        </button>
      </form>

      {loading ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">Loading statement…</div>
      ) : error ? (
        <div className="py-12 text-center text-red-600 text-sm">Couldn't load statement. Please try again.</div>
      ) : (
        <div className="card p-4">
          <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
            <span className="text-sm font-semibold text-brown-mid/70">Opening balance</span>
            <span className="font-bold text-brown-dark text-sm"><Money value={statement.openingBalance} /></span>
          </div>

          {statement.entries.length === 0 ? (
            <p className="text-brown-mid/50 text-sm py-6 text-center">No entries in this period.</p>
          ) : (
            <div className="flex flex-col divide-y divide-brown-dark/5">
              {statement.entries.map((e, i) => (
                <motion.div
                  key={e._id} className="py-3"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.03 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-brown-dark text-sm">{TYPE_LABELS[e.type] || e.type}</div>
                      <div className="text-xs text-brown-mid/50 mt-0.5">
                        {formatDate(e.date)}{e.reference ? ` · Ref: ${e.reference}` : ''}
                      </div>
                      {e.note && <div className="text-xs text-brown-mid/60 mt-0.5">{e.note}</div>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {e.debit > 0 && <div className="font-semibold text-sm text-red-600">+<Money value={e.debit} /></div>}
                      {e.credit > 0 && <div className="font-semibold text-sm text-green-700">-<Money value={e.credit} /></div>}
                      <div className="text-xs text-brown-mid/50 mt-0.5">Bal: <Money value={e.runningBalance} /></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 mt-1 border-t" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
            <span className="font-bold text-brown-dark text-sm">Closing balance</span>
            <span className="font-serif font-black text-brown-dark text-base"><Money value={statement.closingBalance} /></span>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
