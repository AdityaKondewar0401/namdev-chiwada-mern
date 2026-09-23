import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { b2bAdminAPI } from '../../services/api';
import B2BModal from '../b2b/B2BModal';
import B2BDisabledNotice from './B2BDisabledNotice';
import StatGrid from '../b2b/StatGrid';
import InvoiceStatusPill from '../b2b/InvoiceStatusPill';
import Money from '../b2b/Money';
import { formatDate } from '../../utils/b2bFormat';
import { downloadBlobResponse } from '../../utils/downloadBlob';

const TYPE_LABELS = {
  opening_balance: 'Opening balance',
  invoice: 'Invoice',
  payment: 'Payment received',
  credit_note: 'Credit note',
  adjustment: 'Adjustment',
};

export default function B2BLedgerTab() {
  /* ── Summary ─────────────────────────────────────────────── */
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  const fetchSummary = useCallback(() => {
    setSummaryLoading(true);
    setSummaryError(false);
    b2bAdminAPI.getSummary()
      .then((res) => setSummary(res.data.summary))
      .catch(() => { toast.error('Failed to load B2B summary'); setSummaryError(true); })
      .finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  /* ── Account search + selection ─────────────────────────── */
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null); // { _id, businessName }

  const runSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const res = await b2bAdminAPI.listAccounts({ search: searchTerm, limit: 8 });
      setSearchResults(res.data.accounts);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const selectAccount = (account) => {
    setSelectedAccount({ _id: account._id || account.business, businessName: account.businessName });
    setSearchResults(null);
    setSearchTerm('');
  };

  /* ── Selected account's statement ───────────────────────── */
  const [statement, setStatement] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementError, setStatementError] = useState(false);
  const [range, setRange] = useState({ from: '', to: '' });
  const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const fetchStatement = useCallback(() => {
    if (!selectedAccount) return;
    setStatementLoading(true);
    setStatementError(false);
    b2bAdminAPI.getAccountLedger(selectedAccount._id, { from: appliedRange.from || undefined, to: appliedRange.to || undefined })
      .then((res) => setStatement(res.data))
      .catch(() => { toast.error('Failed to load statement'); setStatementError(true); })
      .finally(() => setStatementLoading(false));
  }, [selectedAccount, appliedRange]);

  useEffect(() => {
    setRange({ from: '', to: '' });
    setAppliedRange({ from: '', to: '' });
    setStatement(null);
    setStatementError(false);
  }, [selectedAccount]);

  useEffect(() => { fetchStatement(); }, [fetchStatement]);

  const applyRange = (e) => { e.preventDefault(); setAppliedRange(range); };

  const downloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const res = await b2bAdminAPI.downloadAccountLedgerCsv(selectedAccount._id, { from: appliedRange.from || undefined, to: appliedRange.to || undefined });
      downloadBlobResponse(res, `${selectedAccount.businessName.replace(/[^a-z0-9]+/gi, '-')}-statement.csv`);
    } catch {
      toast.error('Could not download statement CSV');
    } finally {
      setDownloadingCsv(false);
    }
  };

  /* ── Record payment / adjustment / opening balance ──────── */
  const [actionModal, setActionModal] = useState(null); // 'payment' | 'adjustment' | 'opening'
  const [actionForm, setActionForm] = useState({});
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const openAction = (type) => {
    setActionModal(type);
    setActionForm(type === 'payment' ? { amount: '', method: 'upi', reference: '', note: '', date: '' }
      : type === 'adjustment' ? { type: 'credit', amount: '', note: '' }
        : { amount: '', note: '' });
  };

  const submitAction = async (e) => {
    e.preventDefault();
    setActionSubmitting(true);
    try {
      if (actionModal === 'payment') {
        await b2bAdminAPI.recordPayment(selectedAccount._id, {
          amount: Number(actionForm.amount), method: actionForm.method,
          reference: actionForm.reference || undefined, note: actionForm.note || undefined,
          date: actionForm.date || undefined,
        });
        toast.success('Payment recorded');
      } else if (actionModal === 'adjustment') {
        await b2bAdminAPI.recordAdjustment(selectedAccount._id, {
          type: actionForm.type, amount: Number(actionForm.amount), note: actionForm.note || undefined,
        });
        toast.success('Adjustment recorded');
      } else if (actionModal === 'opening') {
        await b2bAdminAPI.recordOpeningBalance(selectedAccount._id, {
          amount: Number(actionForm.amount), note: actionForm.note || undefined,
        });
        toast.success('Opening balance recorded');
      }
      setActionModal(null);
      fetchStatement();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionSubmitting(false);
    }
  };

  /* ── Invoices + credit notes ─────────────────────────────── */
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [downloadingDocId, setDownloadingDocId] = useState(null);
  const [creditNoteModal, setCreditNoteModal] = useState(null); // invoice
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [creditNoteSubmitting, setCreditNoteSubmitting] = useState(false);

  const fetchInvoices = useCallback(() => {
    setInvoicesLoading(true);
    b2bAdminAPI.listInvoices(selectedAccount ? { business: selectedAccount._id } : {})
      .then((res) => setInvoices(res.data.invoices))
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setInvoicesLoading(false));
  }, [selectedAccount]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const downloadInvoicePdf = async (invoice) => {
    setDownloadingDocId(invoice._id);
    try {
      const res = await b2bAdminAPI.downloadInvoicePdf(invoice._id);
      downloadBlobResponse(res, `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`);
    } catch {
      toast.error('Could not download invoice PDF');
    } finally {
      setDownloadingDocId(null);
    }
  };

  const submitCreditNote = async (e) => {
    e.preventDefault();
    setCreditNoteSubmitting(true);
    try {
      await b2bAdminAPI.createCreditNote(creditNoteModal._id, { reason: creditNoteReason });
      toast.success('Credit note issued');
      setCreditNoteModal(null);
      setCreditNoteReason('');
      fetchInvoices();
      fetchSummary();
      if (selectedAccount) fetchStatement();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue credit note');
    } finally {
      setCreditNoteSubmitting(false);
    }
  };

  const turnover = summary?.turnover;
  const turnoverPct = Math.min(100, turnover?.percentOfThreshold || 0);

  return (
    <div>
      <B2BDisabledNotice />
      <div className="mb-4">
        <h2 className="font-serif font-black text-brown-dark text-lg">Ledger &amp; Finance</h2>
        <p className="text-brown-mid/60 text-sm mt-0.5">Outstanding balances, payments, invoices and credit notes</p>
      </div>

      {/* ── Summary cards ─────────────────────────────────────── */}
      {summaryLoading ? (
        <div className="py-8 text-center text-brown-mid/50 text-sm">Loading summary…</div>
      ) : summaryError ? (
        <div className="py-8 text-center text-red-600 text-sm">Couldn't load the summary. Please refresh.</div>
      ) : summary && (
        <div className="flex flex-col gap-4 mb-6">
          <StatGrid cols={4} tiles={[
            { label: 'Pending applications', value: summary.pendingApplications },
            { label: 'Total outstanding', value: <Money value={summary.totalOutstanding} /> },
            { label: 'Test accounts', value: summary.testAccountCount },
            { label: 'Orders (all-time)', value: Object.values(summary.ordersByStatus || {}).reduce((a, b) => a + b, 0) },
          ]} />

          {/* GST registration threshold watch */}
          {turnover && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50">
                  FY turnover vs. GST registration threshold
                </div>
                <span className="text-xs font-bold" style={{ color: turnoverPct >= 90 ? '#b91c1c' : '#7a3300' }}>
                  {turnover.percentOfThreshold}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: '#fef3e0' }}>
                <div className="h-full rounded-full" style={{
                  width: `${turnoverPct}%`,
                  background: turnoverPct >= 90 ? '#dc2626' : 'linear-gradient(135deg,#e07000,#ff9010)',
                }} />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-2 text-xs text-brown-mid/60">
                <span>Retail <Money value={turnover.retail} /> + Wholesale <Money value={turnover.wholesale} /> = <strong className="text-brown-dark"><Money value={turnover.total} /></strong></span>
                <span>Threshold <Money value={turnover.threshold} /></span>
              </div>
              {turnoverPct >= 90 && (
                <p className="text-xs font-semibold mt-2" style={{ color: '#b91c1c' }}>
                  Approaching the GST registration threshold — talk to your CA soon.
                </p>
              )}
            </div>
          )}

          {/* Aging buckets */}
          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-3">Overdue aging</div>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(summary.agingBuckets || {}).map(([bucket, amount]) => (
                <div key={bucket} className="text-center p-2 rounded-xl" style={{ background: amount > 0 ? '#fef2f2' : '#f9fafb' }}>
                  <div className="text-[10px] font-semibold text-brown-mid/50">{bucket}d</div>
                  <div className="font-bold text-sm mt-0.5" style={{ color: amount > 0 ? '#b91c1c' : '#9ca3af' }}><Money value={amount} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Top outstanding accounts */}
          {summary.topOutstandingAccounts?.length > 0 && (
            <div className="card p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-3">Top outstanding accounts</div>
              <div className="flex flex-col divide-y divide-brown-dark/5">
                {summary.topOutstandingAccounts.map((a) => (
                  <button key={a.business} onClick={() => selectAccount(a)} className="flex items-center justify-between py-2.5 text-left">
                    <span className="text-sm font-semibold text-brown-dark">{a.businessName}</span>
                    <span className="text-sm font-bold text-red-600"><Money value={a.outstanding} /></span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Account ledger ────────────────────────────────────── */}
      <div className="card p-4 mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-3">Account statement</div>

        <form onSubmit={runSearch} className="flex gap-2 mb-3">
          <input
            aria-label="Search business name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search business name…"
            className="form-input text-base flex-1"
          />
          <button type="submit" disabled={searching} className="rounded-xl text-sm font-semibold text-brown-dark px-4 flex-shrink-0 disabled:opacity-60" style={{ minHeight: 44, background: '#fef3e0' }}>
            {searching ? '…' : 'Search'}
          </button>
        </form>

        {searchResults && (
          <div className="flex flex-col gap-1.5 mb-4">
            {searchResults.length === 0 ? (
              <p className="text-sm text-brown-mid/50">No accounts found.</p>
            ) : searchResults.map((a) => (
              <button key={a._id} onClick={() => selectAccount(a)} className="text-left px-3 py-2 rounded-xl text-sm font-semibold text-brown-dark hover:bg-saffron/10" style={{ background: '#fef3e0' }}>
                {a.businessName} <span className="text-brown-mid/50 font-normal">· {a.user?.email}</span>
              </button>
            ))}
          </div>
        )}

        {!selectedAccount ? (
          <p className="text-sm text-brown-mid/50 py-4 text-center">Search for a business above, or pick one from "Top outstanding accounts".</p>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="font-serif font-black text-brown-dark text-base">{selectedAccount.businessName}</div>
              <button onClick={() => setSelectedAccount(null)} className="text-xs font-semibold text-saffron">Change</button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => openAction('payment')} className="rounded-xl text-xs font-semibold text-white px-4" style={{ minHeight: 40, background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
                + Record payment
              </button>
              <button onClick={() => openAction('adjustment')} className="rounded-xl text-xs font-semibold text-brown-dark px-4" style={{ minHeight: 40, background: '#fef3e0' }}>
                + Adjustment
              </button>
              <button onClick={() => openAction('opening')} className="rounded-xl text-xs font-semibold text-brown-dark px-4" style={{ minHeight: 40, background: '#fef3e0' }}>
                + Opening balance
              </button>
            </div>

            <form onSubmit={applyRange} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 mb-4">
              <div className="flex-1">
                <label htmlFor="ledger-from" className="block text-xs font-semibold text-brown-dark mb-1">From</label>
                <input id="ledger-from" type="date" className="form-input text-base" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label htmlFor="ledger-to" className="block text-xs font-semibold text-brown-dark mb-1">To</label>
                <input id="ledger-to" type="date" className="form-input text-base" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
              </div>
              <button type="submit" className="rounded-xl text-sm font-semibold text-brown-dark px-4 flex-shrink-0" style={{ minHeight: 44, background: '#fef3e0' }}>Apply</button>
              <button type="button" onClick={downloadCsv} disabled={downloadingCsv || statementLoading} className="rounded-xl text-sm font-semibold text-brown-dark px-4 flex-shrink-0 disabled:opacity-60" style={{ minHeight: 44, background: '#fef3e0' }}>
                {downloadingCsv ? '…' : 'CSV ↓'}
              </button>
            </form>

            {statementLoading ? (
              <div className="py-8 text-center text-brown-mid/50 text-sm">Loading statement…</div>
            ) : statementError || !statement ? (
              <div className="py-8 text-center text-red-600 text-sm">Couldn't load the statement. Please try again.</div>
            ) : (
              <div>
                <div className="flex items-center justify-between py-2.5 border-t" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
                  <span className="text-sm font-semibold text-brown-mid/70">Opening balance</span>
                  <span className="font-bold text-brown-dark text-sm"><Money value={statement.openingBalance} /></span>
                </div>
                {statement.entries.length === 0 ? (
                  <p className="text-brown-mid/50 text-sm py-4 text-center">No entries in this period.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-brown-dark/5">
                    {statement.entries.map((e) => (
                      <div key={e._id} className="py-2.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-brown-dark text-sm">{TYPE_LABELS[e.type] || e.type}</div>
                          <div className="text-xs text-brown-mid/50">{formatDate(e.date)}{e.reference ? ` · ${e.reference}` : ''}{e.note ? ` · ${e.note}` : ''}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {e.debit > 0 && <div className="font-semibold text-sm text-red-600">+<Money value={e.debit} /></div>}
                          {e.credit > 0 && <div className="font-semibold text-sm text-green-700">-<Money value={e.credit} /></div>}
                          <div className="text-xs text-brown-mid/50">Bal: <Money value={e.runningBalance} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
                  <span className="font-bold text-brown-dark text-sm">Closing balance</span>
                  <span className="font-serif font-black text-brown-dark"><Money value={statement.closingBalance} /></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Invoices + credit notes ─────────────────────────────── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50">
            Invoices{selectedAccount ? ` · ${selectedAccount.businessName}` : ''}
          </div>
          {selectedAccount && (
            <button onClick={() => setSelectedAccount(null)} className="text-xs font-semibold text-saffron">Show all</button>
          )}
        </div>

        {invoicesLoading ? (
          <div className="py-8 text-center text-brown-mid/50 text-sm">Loading invoices…</div>
        ) : invoices.length === 0 ? (
          <p className="text-brown-mid/50 text-sm py-4 text-center">No invoices yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-brown-dark/5">
            {invoices.map((inv, i) => (
              <motion.div
                key={inv._id} className="py-3 flex items-center justify-between gap-3 flex-wrap"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.02 }}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-brown-dark text-sm flex items-center gap-2">
                    {inv.invoiceNumber}
                    {inv.business?.isTest && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#f3e8ff', color: '#7e22ce' }}>TEST</span>}
                  </div>
                  <div className="text-xs text-brown-mid/50 mt-0.5">
                    {inv.business?.businessName} · {formatDate(inv.issuedAt)}
                  </div>
                  <InvoiceStatusPill status={inv.status} className="mt-1" />
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-brown-dark text-sm"><Money value={inv.totals?.payable} /></span>
                  <button onClick={() => downloadInvoicePdf(inv)} disabled={downloadingDocId === inv._id} className="text-saffron font-semibold text-xs disabled:opacity-60">
                    {downloadingDocId === inv._id ? '…' : 'PDF ↓'}
                  </button>
                  {inv.status === 'issued' && (
                    <button onClick={() => setCreditNoteModal(inv)} className="text-red-600 font-semibold text-xs">
                      Credit note
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Record payment / adjustment / opening balance ──────── */}
      <B2BModal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal ? { payment: 'Record payment', adjustment: 'Record adjustment', opening: 'Record opening balance' }[actionModal] : ''}
      >
        <form onSubmit={submitAction} className="flex flex-col gap-4" noValidate>
          {actionModal === 'adjustment' && (
            <div>
              <label htmlFor="action-type" className="block text-sm font-semibold text-brown-dark mb-1.5">Type *</label>
              <select id="action-type" className="form-input text-base" value={actionForm.type} onChange={(e) => setActionForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="credit">Credit (reduces outstanding)</option>
                <option value="debit">Debit (increases outstanding)</option>
              </select>
            </div>
          )}
          {actionModal === 'opening' && (
            <p className="text-sm text-brown-mid/60">A positive amount means the account owes this much; negative means they have a credit balance. This can only be recorded once, before any other ledger entries exist.</p>
          )}
          <div>
            <label htmlFor="action-amount" className="block text-sm font-semibold text-brown-dark mb-1.5">Amount (₹) *</label>
            <input id="action-amount" type="number" inputMode="decimal" step="0.01" className="form-input text-base" required
              value={actionForm.amount} onChange={(e) => setActionForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          {actionModal === 'payment' && (
            <>
              <div>
                <label htmlFor="action-method" className="block text-sm font-semibold text-brown-dark mb-1.5">Method *</label>
                <select id="action-method" className="form-input text-base" value={actionForm.method} onChange={(e) => setActionForm((f) => ({ ...f, method: e.target.value }))}>
                  <option value="upi">UPI</option>
                  <option value="neft_rtgs">NEFT / RTGS</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="action-reference" className="block text-sm font-semibold text-brown-dark mb-1.5">Reference (UTR / cheque no.)</label>
                <input id="action-reference" className="form-input text-base" value={actionForm.reference} onChange={(e) => setActionForm((f) => ({ ...f, reference: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="action-date" className="block text-sm font-semibold text-brown-dark mb-1.5">Date</label>
                <input id="action-date" type="date" className="form-input text-base" value={actionForm.date} onChange={(e) => setActionForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </>
          )}
          <div>
            <label htmlFor="action-note" className="block text-sm font-semibold text-brown-dark mb-1.5">Note</label>
            <textarea id="action-note" className="form-input text-base" rows={2} value={actionForm.note} onChange={(e) => setActionForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
          <button type="submit" disabled={actionSubmitting} className="btn-saffron disabled:opacity-60" style={{ minHeight: 48 }}>
            {actionSubmitting ? 'Saving…' : 'Save'}
          </button>
        </form>
      </B2BModal>

      {/* ── Issue credit note ──────────────────────────────────── */}
      <B2BModal open={!!creditNoteModal} onClose={() => setCreditNoteModal(null)} title={creditNoteModal ? `Credit note for ${creditNoteModal.invoiceNumber}` : ''}>
        <form onSubmit={submitCreditNote} className="flex flex-col gap-4" noValidate>
          <p className="text-sm text-brown-mid/60">This fully reverses the invoice's ₹{creditNoteModal ? Number(creditNoteModal.totals?.payable || 0).toLocaleString('en-IN') : 0} outstanding and cannot be undone. Partial credit notes aren't supported.</p>
          <div>
            <label htmlFor="credit-note-reason" className="block text-sm font-semibold text-brown-dark mb-1.5">Reason *</label>
            <textarea id="credit-note-reason" className="form-input text-base" rows={3} required value={creditNoteReason} onChange={(e) => setCreditNoteReason(e.target.value)} />
          </div>
          <button type="submit" disabled={creditNoteSubmitting || creditNoteReason.trim().length < 3}
            className="rounded-full font-bold text-white disabled:opacity-60" style={{ minHeight: 48, background: '#dc2626' }}>
            {creditNoteSubmitting ? 'Issuing…' : 'Issue credit note'}
          </button>
        </form>
      </B2BModal>
    </div>
  );
}
