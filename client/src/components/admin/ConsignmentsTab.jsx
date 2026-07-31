import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { partnerAPI, consignmentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { CONSIGNMENT_STATUS_CONFIG } from './adminConstants';

const EMPTY_ITEM = { name: '', size: '', qty: 1, unitPrice: '' };

// ─────────────────────────────────────────────
// ConsignmentsTab — Phase 1: dispatch products to a partner, auto-generate
// the advance/final Payment records, and mark them paid manually.
// Automated reminders (Phase 3) aren't wired up yet — this is pure tracking.
// ─────────────────────────────────────────────
export default function ConsignmentsTab() {
  const [partners, setPartners] = useState([]);
  const [consignments, setConsignments] = useState([]);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [sendingReminders, setSendingReminders] = useState(false);

  const [form, setForm] = useState({
    partnerId: '',
    advancePercent: '',
    notes: '',
    items: [{ ...EMPTY_ITEM }],
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([partnerAPI.getAll(), consignmentAPI.getAll(), consignmentAPI.getDues()])
      .then(([partnersRes, consignmentsRes, duesRes]) => {
        setPartners((partnersRes.data.partners || []).filter((p) => p.active));
        setConsignments(consignmentsRes.data.consignments || []);
        setDues(duesRes.data.dues || []);
      })
      .catch(() => toast.error('Failed to load consignments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedPartner = partners.find((p) => p._id === form.partnerId);

  const updateItem = (index, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItemRow = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  };

  const removeItemRow = (index) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const totalPreview = form.items.reduce(
    (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0
  );

  const handleCreate = async () => {
    if (!form.partnerId) {
      toast.error('Select a partner');
      return;
    }
    const validItems = form.items.filter((i) => i.name && Number(i.qty) > 0 && Number(i.unitPrice) >= 0);
    if (validItems.length === 0) {
      toast.error('Add at least one valid product line');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        partnerId: form.partnerId,
        items: validItems.map((i) => ({
          name: i.name,
          size: i.size || undefined,
          qty: Number(i.qty),
          unitPrice: Number(i.unitPrice),
        })),
        notes: form.notes || undefined,
        advancePercent: form.advancePercent !== '' ? Number(form.advancePercent) : undefined,
      };
      const res = await consignmentAPI.create(payload);
      setConsignments((prev) => [
        { ...res.data.consignment, partner: selectedPartner, payments: res.data.payments },
        ...prev,
      ]);
      toast.success('Consignment dispatched');
      setShowForm(false);
      setForm({ partnerId: '', advancePercent: '', notes: '', items: [{ ...EMPTY_ITEM }] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create consignment');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (paymentId, consignmentId) => {
    try {
      const res = await consignmentAPI.markPaymentPaid(paymentId);
      setConsignments((prev) =>
        prev.map((c) => {
          if (c._id !== consignmentId) return c;
          const payments = c.payments.map((p) => (p._id === paymentId ? res.data.payment : p));
          const allPaid = payments.every((p) => p.status === 'paid');
          const anyPaid = payments.some((p) => p.status === 'paid');
          return {
            ...c,
            payments,
            status: allPaid ? 'settled' : anyPaid ? 'partially_settled' : 'dispatched',
          };
        })
      );
      toast.success('Payment marked as paid');
      // Outstanding-dues totals are now stale — refresh in the background.
      consignmentAPI.getDues().then((res) => setDues(res.data.dues || [])).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment');
    }
  };

  const handleRunReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await consignmentAPI.runReminders();
      toast.success(`Checked ${res.data.checked} pending payment(s), sent ${res.data.sent} reminder(s)`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const filteredConsignments = consignments.filter((c) =>
    (c.partner?.businessName || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-serif font-black text-brown-dark text-2xl">Consignments</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRunReminders}
            disabled={sendingReminders}
            className="px-4 py-2.5 rounded-full font-bold text-xs border disabled:opacity-60"
            style={{ borderColor: 'rgba(224,112,0,0.2)', color: '#e07000', minHeight: 44 }}
            title="Manually run the reminder check instead of waiting for the daily 9 AM job"
          >
            {sendingReminders ? 'Checking...' : '🔔 Send Reminders Now'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={partners.length === 0}
            className="px-5 py-2.5 rounded-full font-bold text-white text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 44 }}
          >
            {showForm ? 'Cancel' : '+ New Consignment'}
          </button>
        </div>
      </div>

      {dues.length > 0 && (
        <div
          className="bg-white rounded-2xl p-5 mb-5"
          style={{ boxShadow: '0 2px 12px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/60 mb-3">
            Outstanding Dues
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dues.map((d) => (
              <div key={d.partner._id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50">
                <span className="text-xs font-semibold text-brown-dark truncate">{d.partner.businessName}</span>
                <span className="text-xs font-bold text-amber-700 whitespace-nowrap ml-2">
                  ₹{d.totalOutstanding.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {partners.length === 0 && (
        <div className="text-sm text-brown-mid/60 mb-4">
          Add a partner in the Partners tab before creating a consignment.
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 mb-5"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.15)' }}
          >
            <h3 className="font-bold text-brown-dark mb-4">New Consignment</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Partner
                </label>
                <select
                  value={form.partnerId}
                  onChange={(e) => setForm((p) => ({ ...p, partnerId: e.target.value }))}
                  className="form-input text-sm"
                >
                  <option value="">Select partner...</option>
                  {partners.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.businessName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Advance % {selectedPartner ? `(default: ${selectedPartner.defaultAdvancePercent}%)` : ''}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder={selectedPartner ? String(selectedPartner.defaultAdvancePercent) : '50'}
                  value={form.advancePercent}
                  onChange={(e) => setForm((p) => ({ ...p, advancePercent: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>
            </div>

            <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-2">
              Products
            </label>
            <div className="space-y-3 sm:space-y-2 mb-3">
              {form.items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl border border-brown-mid/10 bg-cream/40 sm:p-0 sm:border-0 sm:bg-transparent"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
                    <input
                      placeholder="Product name"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      className="form-input text-sm col-span-2 sm:col-span-5"
                    />
                    <input
                      placeholder="Size (e.g. 250g)"
                      value={item.size}
                      onChange={(e) => updateItem(index, 'size', e.target.value)}
                      className="form-input text-sm col-span-2 sm:col-span-3"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', e.target.value)}
                      className="form-input text-sm col-span-1 sm:col-span-2"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="₹/unit"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      className="form-input text-sm col-span-1 sm:col-span-1"
                    />
                    <button
                      onClick={() => removeItemRow(index)}
                      disabled={form.items.length === 1}
                      className="col-span-2 sm:col-span-1 text-red-500 text-xs font-bold disabled:opacity-30
                                 py-2.5 sm:py-0 rounded-lg sm:rounded-none border sm:border-0 border-red-200"
                      style={{ minHeight: 44 }}
                    >
                      <span className="sm:hidden">Remove product</span>
                      <span className="hidden sm:inline">✕</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addItemRow}
              className="text-xs font-bold text-saffron mb-4"
            >
              + Add another product
            </button>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                Notes (optional)
              </label>
              <input
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="form-input text-sm"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm font-bold text-brown-dark">
                Total: ₹{totalPreview.toLocaleString()}
              </div>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-6 py-2.5 rounded-full font-bold text-white text-sm disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', minHeight: 44 }}
              >
                {saving ? 'Dispatching...' : '✅ Dispatch Consignment'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by partner name..."
          className="form-input text-sm mb-1"
        />
        {filteredConsignments.map((c) => {
          const statusConfig = CONSIGNMENT_STATUS_CONFIG[c.status] || CONSIGNMENT_STATUS_CONFIG.dispatched;
          return (
            <div
              key={c._id}
              className="bg-white rounded-2xl p-5"
              style={{ boxShadow: '0 2px 12px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <div className="font-bold text-brown-dark text-sm">
                    {c.partner?.businessName || 'Unknown partner'}
                  </div>
                  <div className="text-xs text-brown-mid/60">
                    {new Date(c.dispatchDate).toLocaleDateString()} · ₹{c.totalAmount.toLocaleString()} total ·{' '}
                    {c.advancePercent}% advance
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: statusConfig.bg, color: statusConfig.color }}
                >
                  {statusConfig.label}
                </span>
              </div>

              <div className="text-xs text-brown-mid/70 mb-3">
                {c.items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty}`).join(', ')}
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                {(c.payments || []).map((payment) => (
                  <div
                    key={payment._id}
                    className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl text-xs w-full sm:w-auto"
                    style={{
                      background: payment.status === 'paid' ? '#dcfce7' : '#fef3c7',
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold capitalize">
                        {payment.installment}: ₹{payment.amountDue.toLocaleString()}
                      </span>
                      <span className={payment.status === 'paid' ? 'text-green-700' : 'text-amber-700'}>
                        {payment.status === 'paid' ? '✓ Paid' : 'Pending'}
                        {payment.status !== 'paid' && payment.reminderCount > 0 && (
                          <span className="text-brown-mid/50"> · {payment.reminderCount} reminder{payment.reminderCount > 1 ? 's' : ''} sent</span>
                        )}
                      </span>
                    </div>
                    {payment.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkPaid(payment._id, c._id)}
                        className="font-bold text-saffron underline sm:no-underline sm:border sm:border-saffron/30 sm:rounded-lg sm:px-2.5 sm:py-1 text-left sm:text-center"
                        style={{ minHeight: 40 }}
                      >
                        Mark paid
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filteredConsignments.length === 0 && (
          <div className="text-center py-12 text-brown-mid/50">
            {search ? 'No consignments match your search' : 'No consignments yet'}
          </div>
        )}
      </div>
    </div>
  );
}
