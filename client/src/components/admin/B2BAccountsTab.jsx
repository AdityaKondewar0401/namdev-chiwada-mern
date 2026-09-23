import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { b2bAdminAPI } from '../../services/api';
import B2BStatusBadge from '../b2b/B2BStatusBadge';
import B2BModal from '../b2b/B2BModal';
import B2BDisabledNotice from './B2BDisabledNotice';
import FilterPills from '../b2b/FilterPills';
import StatGrid from '../b2b/StatGrid';
import Money from '../b2b/Money';
import { formatDate } from '../../utils/b2bFormat';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

const BUSINESS_TYPES = [
  { value: 'retailer', label: 'Retailer' },
  { value: 'sweet_shop', label: 'Sweet Shop' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'caterer', label: 'Caterer' },
  { value: 'other', label: 'Other' },
];

export default function B2BAccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState([]);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', businessName: '', businessType: '', tier: '', advancePercent: 100, creditLimit: '' });
  const [createErrors, setCreateErrors] = useState({});
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject'|'suspend'|'reactivate', account }
  const [actionForm, setActionForm] = useState({});
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const LIMIT = 20;

  const fetchAccounts = useCallback(() => {
    setLoading(true);
    b2bAdminAPI.listAccounts({ status: statusFilter || undefined, search: search || undefined, page, limit: LIMIT })
      .then((res) => { setAccounts(res.data.accounts); setTotal(res.data.total); })
      .catch(() => toast.error('Failed to load business accounts'))
      .finally(() => setLoading(false));
  }, [statusFilter, search, page]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { b2bAdminAPI.listTiers().then((res) => setTiers(res.data.tiers)).catch(() => {}); }, []);

  const openDetail = (id) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    b2bAdminAPI.getAccount(id)
      .then((res) => setDetail(res.data))
      .catch(() => toast.error('Failed to load account details'))
      .finally(() => setDetailLoading(false));
  };

  const closeDetail = () => { setDetailId(null); setDetail(null); };

  const refreshAfterAction = () => {
    fetchAccounts();
    if (detailId) openDetail(detailId);
  };

  const toggleTest = async (account) => {
    try {
      await b2bAdminAPI.updateAccount(account._id, { isTest: !account.isTest });
      toast.success(account.isTest ? 'Marked as a real account' : 'Marked as a TEST account');
      refreshAfterAction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  /* ── Create account for existing user ─────────────────────── */
  const submitCreate = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateErrors({});
    try {
      await b2bAdminAPI.createAccount({
        ...createForm,
        tier: createForm.tier || undefined,
        advancePercent: createForm.advancePercent === '' ? undefined : Number(createForm.advancePercent),
        creditLimit: createForm.creditLimit === '' ? undefined : Number(createForm.creditLimit),
      });
      toast.success('Business account created');
      setCreateOpen(false);
      setCreateForm({ email: '', businessName: '', businessType: '', tier: '', advancePercent: 100, creditLimit: '' });
      fetchAccounts();
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setCreateErrors({ email: 'No user found with this email. Ask them to create an account on the website first.' });
      } else if (status === 409) {
        setDuplicateInfo(err.response.data);
        setCreateOpen(false);
      } else if (status === 400 && Array.isArray(err.response.data?.errors)) {
        const fe = {};
        err.response.data.errors.forEach((e2) => { fe[e2.field] = e2.message; });
        setCreateErrors(fe);
      } else {
        toast.error(err.response?.data?.message || 'Failed to create account');
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  /* ── Approve / reject / suspend / reactivate ──────────────── */
  const openAction = (type, account) => {
    setActionModal({ type, account });
    setActionForm(type === 'approve'
      ? { tier: tiers.find((t) => t.isDefault)?._id || '', advancePercent: 100, creditLimit: '', note: '' }
      : { reason: '', note: '' });
  };

  const submitAction = async (e) => {
    e.preventDefault();
    if (!actionModal) return;
    setActionSubmitting(true);
    try {
      const { type, account } = actionModal;
      if (type === 'approve') {
        await b2bAdminAPI.approveAccount(account._id, {
          tier: actionForm.tier,
          advancePercent: Number(actionForm.advancePercent),
          creditLimit: actionForm.creditLimit === '' ? 0 : Number(actionForm.creditLimit),
          note: actionForm.note || undefined,
        });
        toast.success('Account approved');
      } else if (type === 'reject') {
        await b2bAdminAPI.rejectAccount(account._id, { reason: actionForm.reason });
        toast.success('Account rejected');
      } else if (type === 'suspend') {
        await b2bAdminAPI.suspendAccount(account._id, { note: actionForm.note || undefined });
        toast.success('Account suspended');
      } else if (type === 'reactivate') {
        await b2bAdminAPI.reactivateAccount(account._id, { note: actionForm.note || undefined });
        toast.success('Account reactivated');
      }
      setActionModal(null);
      refreshAfterAction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <B2BDisabledNotice />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif font-black text-brown-dark text-lg">Business Accounts</h2>
          <p className="text-brown-mid/60 text-sm mt-0.5">{total} wholesale application{total === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-saffron text-sm px-5" style={{ minHeight: 44 }}>
          + Create for existing user
        </button>
      </div>

      {/* Filters — stacked full-width on mobile */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <FilterPills
          layoutId="b2b-accounts-status-filter"
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
        />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search business, contact, email…"
          className="form-input text-base sm:max-w-xs"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">Loading…</div>
      ) : accounts.length === 0 ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">No business accounts match this filter.</div>
      ) : (
        <>
          {/* MOBILE: stacked cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {accounts.map((a, i) => (
              <motion.div
                key={a._id} className="card p-4"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-brown-dark text-sm truncate">{a.businessName}</div>
                    <div className="text-xs text-brown-mid/60 truncate">{a.user?.email}</div>
                  </div>
                  <B2BStatusBadge status={a.status} isTest={a.isTest} />
                </div>
                <div className="text-xs text-brown-mid/50 mt-2">{formatDate(a.createdAt)}</div>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => openDetail(a._id)}
                    className="flex-1 rounded-xl text-sm font-semibold text-brown-dark"
                    style={{ minHeight: 44, background: '#fef3e0' }}>
                    View
                  </button>
                  {a.status === 'pending' && (
                    <button onClick={() => openAction('approve', a)}
                      className="flex-1 rounded-xl text-sm font-semibold text-white"
                      style={{ minHeight: 44, background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
                      Approve
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* DESKTOP: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-brown-mid/50">
                  <th className="pb-2 pr-4">Business</th>
                  <th className="pb-2 pr-4">Contact</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Applied</th>
                  <th className="pb-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a._id} className="border-t transition-colors hover:bg-saffron/5" style={{ borderColor: 'rgba(224,112,0,0.08)' }}>
                    <td className="py-3 pr-4 font-semibold text-brown-dark">{a.businessName}</td>
                    <td className="py-3 pr-4 text-brown-mid/70">{a.user?.email}</td>
                    <td className="py-3 pr-4"><B2BStatusBadge status={a.status} isTest={a.isTest} /></td>
                    <td className="py-3 pr-4 text-brown-mid/60">{formatDate(a.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetail(a._id)} className="text-saffron font-semibold hover:underline">View</button>
                        {a.status === 'pending' && (
                          <button onClick={() => openAction('approve', a)} className="text-green-700 font-semibold hover:underline">Approve</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-4 rounded-full text-sm font-semibold disabled:opacity-40" style={{ minHeight: 44, background: '#fef3e0' }}>
                ← Prev
              </button>
              <span className="text-sm text-brown-mid/60">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-4 rounded-full text-sm font-semibold disabled:opacity-40" style={{ minHeight: 44, background: '#fef3e0' }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Detail drawer ──────────────────────────────────────── */}
      <B2BModal open={!!detailId} onClose={closeDetail} title="Business Account" widthClass="sm:max-w-lg">
        {detailLoading || !detail ? (
          <div className="py-10 text-center text-brown-mid/50 text-sm">Loading…</div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif font-black text-brown-dark text-lg">{detail.business.businessName}</div>
                <div className="text-sm text-brown-mid/60">{detail.business.user?.email} · {detail.business.user?.phone || detail.business.phone || '—'}</div>
              </div>
              <B2BStatusBadge status={detail.business.status} isTest={detail.business.isTest} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-brown-mid/50">Type</span><div className="font-semibold text-brown-dark">{detail.business.businessType}</div></div>
              <div><span className="text-brown-mid/50">GSTIN</span><div className="font-semibold text-brown-dark">{detail.business.gstin || '—'}</div></div>
              <div><span className="text-brown-mid/50">Tier</span><div className="font-semibold text-brown-dark">{detail.business.tier?.name || '—'}</div></div>
              <div><span className="text-brown-mid/50">Advance</span><div className="font-semibold text-brown-dark">{detail.business.advancePercent}% at order, rest in 14 days</div></div>
            </div>

            <button
              onClick={() => toggleTest(detail.business)}
              className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold"
              style={{ minHeight: 44, background: detail.business.isTest ? '#f3e8ff' : '#f3f4f6', color: detail.business.isTest ? '#7e22ce' : '#374151', border: `1px solid ${detail.business.isTest ? '#e9d5ff' : '#e5e7eb'}` }}
            >
              {detail.business.isTest ? 'Unmark as TEST account' : 'Mark as TEST account'}
            </button>

            {detail.business.rejectionReason && (
              <div className="p-3 rounded-xl text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
                <strong>Rejection reason:</strong> {detail.business.rejectionReason}
              </div>
            )}

            {detail.creditSummary && (
              <StatGrid compact tiles={[
                { label: 'Outstanding', value: <Money value={detail.creditSummary.outstanding} /> },
                { label: 'Available', value: <Money value={detail.creditSummary.availableCredit} /> },
                { label: 'Limit', value: <Money value={detail.creditSummary.creditLimit} /> },
              ]} />
            )}

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/50 mb-2">Recent orders</div>
              {detail.recentOrders?.length ? (
                <div className="flex flex-col gap-2">
                  {detail.recentOrders.map((o) => (
                    <div key={o._id} className="text-sm text-brown-dark">{o.orderNumber}</div>
                  ))}
                </div>
              ) : (
                <p className="text-brown-mid/50 text-sm">No orders yet.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
              {detail.business.status === 'pending' && (
                <>
                  <button onClick={() => openAction('approve', detail.business)}
                    className="flex-1 rounded-xl text-sm font-semibold text-white" style={{ minHeight: 44, background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
                    Approve
                  </button>
                  <button onClick={() => openAction('reject', detail.business)}
                    className="flex-1 rounded-xl text-sm font-semibold text-red-600" style={{ minHeight: 44, background: '#fef2f2' }}>
                    Reject
                  </button>
                </>
              )}
              {detail.business.status === 'approved' && (
                <button onClick={() => openAction('suspend', detail.business)}
                  className="flex-1 rounded-xl text-sm font-semibold text-red-600" style={{ minHeight: 44, background: '#fef2f2' }}>
                  Suspend
                </button>
              )}
              {detail.business.status === 'suspended' && (
                <button onClick={() => openAction('reactivate', detail.business)}
                  className="flex-1 rounded-xl text-sm font-semibold text-white" style={{ minHeight: 44, background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
                  Reactivate
                </button>
              )}
            </div>
          </div>
        )}
      </B2BModal>

      {/* ── Create account for existing user ──────────────────── */}
      <B2BModal open={createOpen} onClose={() => setCreateOpen(false)} title="Create account for existing user">
        <form onSubmit={submitCreate} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">User's email *</label>
            <input type="email" inputMode="email" className="form-input text-base" autoComplete="email" required
              value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
            {createErrors.email && <p className="mt-1 text-xs text-red-600">{createErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Business name *</label>
            <input className="form-input text-base" required
              value={createForm.businessName} onChange={(e) => setCreateForm((f) => ({ ...f, businessName: e.target.value }))} />
            {createErrors.businessName && <p className="mt-1 text-xs text-red-600">{createErrors.businessName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Business type *</label>
            <select className="form-input text-base" required
              value={createForm.businessType} onChange={(e) => setCreateForm((f) => ({ ...f, businessType: e.target.value }))}>
              <option value="">Select…</option>
              {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {createErrors.businessType && <p className="mt-1 text-xs text-red-600">{createErrors.businessType}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Tier</label>
              <select className="form-input text-base"
                value={createForm.tier} onChange={(e) => setCreateForm((f) => ({ ...f, tier: e.target.value }))}>
                <option value="">None yet</option>
                {tiers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Advance %</label>
              <input type="number" inputMode="numeric" min="0" max="100" className="form-input text-base"
                value={createForm.advancePercent} onChange={(e) => setCreateForm((f) => ({ ...f, advancePercent: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Credit limit (₹)</label>
            <input type="number" inputMode="numeric" min="0" className="form-input text-base"
              value={createForm.creditLimit} onChange={(e) => setCreateForm((f) => ({ ...f, creditLimit: e.target.value }))} />
          </div>
          <p className="text-xs text-brown-mid/50 -mt-1">Advance % is collected via Razorpay when the order is placed. The rest is due 14 days later.</p>
          <button type="submit" disabled={createSubmitting} className="btn-saffron disabled:opacity-60" style={{ minHeight: 48 }}>
            {createSubmitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </B2BModal>

      {/* ── Duplicate-account friendly modal (409) ────────────── */}
      <B2BModal open={!!duplicateInfo} onClose={() => setDuplicateInfo(null)} title="Already has a business account">
        <div className="text-center py-2">
          <div className="text-3xl mb-3">🤝</div>
          <p className="text-brown-dark font-semibold">{duplicateInfo?.businessName}</p>
          <div className="flex justify-center mt-2 mb-4"><B2BStatusBadge status={duplicateInfo?.status} /></div>
          <p className="text-brown-mid/60 text-sm">This user already has a business account on file.</p>
          <button
            onClick={() => { const id = duplicateInfo.accountId; setDuplicateInfo(null); openDetail(id); }}
            className="btn-saffron w-full mt-5" style={{ minHeight: 48 }}
          >
            View account
          </button>
        </div>
      </B2BModal>

      {/* ── Approve / reject / suspend / reactivate ───────────── */}
      <B2BModal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal ? { approve: 'Approve account', reject: 'Reject application', suspend: 'Suspend account', reactivate: 'Reactivate account' }[actionModal.type] : ''}
      >
        {actionModal?.type === 'approve' && (
          <form onSubmit={submitAction} className="flex flex-col gap-4" noValidate>
            {tiers.length === 0 ? (
              <p className="text-sm text-brown-mid/60">No pricing tiers exist yet — create one in Wholesale Pricing first.</p>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-brown-dark mb-1.5">Pricing tier *</label>
                  <select className="form-input text-base" required
                    value={actionForm.tier} onChange={(e) => setActionForm((f) => ({ ...f, tier: e.target.value }))}>
                    <option value="">Select…</option>
                    {tiers.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.discountPercent}% off)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brown-dark mb-1.5">Advance % *</label>
                  <input type="number" inputMode="numeric" min="0" max="100" required className="form-input text-base"
                    value={actionForm.advancePercent} onChange={(e) => setActionForm((f) => ({ ...f, advancePercent: e.target.value }))} />
                  <p className="text-xs text-brown-mid/50 mt-1">Collected via Razorpay at order placement. The rest is due 14 days later.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brown-dark mb-1.5">Credit limit (₹)</label>
                  <input type="number" inputMode="numeric" min="0" className="form-input text-base"
                    value={actionForm.creditLimit} onChange={(e) => setActionForm((f) => ({ ...f, creditLimit: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brown-dark mb-1.5">Note (optional)</label>
                  <textarea className="form-input text-base" rows={2}
                    value={actionForm.note} onChange={(e) => setActionForm((f) => ({ ...f, note: e.target.value }))} />
                </div>
                <button type="submit" disabled={actionSubmitting} className="btn-saffron disabled:opacity-60" style={{ minHeight: 48 }}>
                  {actionSubmitting ? 'Approving…' : 'Approve account'}
                </button>
              </>
            )}
          </form>
        )}

        {actionModal?.type === 'reject' && (
          <form onSubmit={submitAction} className="flex flex-col gap-4" noValidate>
            <p className="text-sm text-brown-mid/60">This will let the applicant see the reason and re-apply.</p>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Reason *</label>
              <textarea className="form-input text-base" rows={3} required
                value={actionForm.reason} onChange={(e) => setActionForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
            <button type="submit" disabled={actionSubmitting}
              className="rounded-full font-bold text-white disabled:opacity-60" style={{ minHeight: 48, background: '#dc2626' }}>
              {actionSubmitting ? 'Rejecting…' : 'Reject application'}
            </button>
          </form>
        )}

        {actionModal?.type === 'suspend' && (
          <form onSubmit={submitAction} className="flex flex-col gap-4" noValidate>
            <p className="text-sm text-brown-mid/60">The account will lose access to wholesale pricing and ordering until reactivated.</p>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Note (optional)</label>
              <textarea className="form-input text-base" rows={2}
                value={actionForm.note} onChange={(e) => setActionForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
            <button type="submit" disabled={actionSubmitting}
              className="rounded-full font-bold text-white disabled:opacity-60" style={{ minHeight: 48, background: '#dc2626' }}>
              {actionSubmitting ? 'Suspending…' : 'Suspend account'}
            </button>
          </form>
        )}

        {actionModal?.type === 'reactivate' && (
          <form onSubmit={submitAction} className="flex flex-col gap-4" noValidate>
            <p className="text-sm text-brown-mid/60">This restores approved access with the same tier and terms as before.</p>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Note (optional)</label>
              <textarea className="form-input text-base" rows={2}
                value={actionForm.note} onChange={(e) => setActionForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
            <button type="submit" disabled={actionSubmitting} className="btn-saffron disabled:opacity-60" style={{ minHeight: 48 }}>
              {actionSubmitting ? 'Reactivating…' : 'Reactivate account'}
            </button>
          </form>
        )}
      </B2BModal>
    </div>
  );
}
