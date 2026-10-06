import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, FileCheck2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminSheet from './AdminSheet';
import { invoiceAPI } from '../../services/api';
import { apiErrorMessage } from '../../utils/pdfDownload';
import { formatINR, previewTotals, todayIST, financialYearStartIST } from '../../utils/invoiceFormat';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'bank', label: 'Bank transfer' },
  { id: 'card', label: 'Card' },
  { id: 'credit', label: 'Credit (unpaid)' },
];

const PHONE_RE = /^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let lineSeq = 0;
function lineFor(product) {
  lineSeq += 1;
  const size = product?.sizes?.[0];
  return {
    key: lineSeq,
    productId: product?._id || '',
    name: product?.name || '',
    size: size?.weight || product?.weight || '',
    price: size?.price ?? product?.price ?? '',
    qty: 1,
  };
}

function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-bold text-brown-dark mb-1.5">
        {label}{hint && <span className="font-normal text-brown-mid/60"> {hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function NewInvoiceSheet({ products, onClose, onCreated }) {
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [lookup, setLookup] = useState('');
  const [issuedOn, setIssuedOn] = useState(todayIST());
  const [items, setItems] = useState(() => [lineFor(products[0])]);
  const [discountType, setDiscountType] = useState('flat');
  const [discountValue, setDiscountValue] = useState('');
  const [shipping, setShipping] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [emailNow, setEmailNow] = useState(true);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const lookupTimer = useRef(null);

  const productsById = useMemo(() => Object.fromEntries(products.map((p) => [p._id, p])), [products]);
  const totals = previewTotals(items, discountType, discountValue, shipping);

  useEffect(() => {
    clearTimeout(lookupTimer.current);
    if (lookup.trim().length < 2) { setSuggestions([]); return undefined; }
    lookupTimer.current = setTimeout(() => {
      invoiceAPI.searchCustomers(lookup.trim())
        .then((res) => setSuggestions(res.data.customers || []))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(lookupTimer.current);
  }, [lookup]);

  const setCustomerField = (field, value) => {
    setCustomer((c) => ({ ...c, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    if (field === 'name' || field === 'phone') setLookup(value);
  };

  const pickSuggestion = (c) => {
    setCustomer({ name: c.name || '', phone: c.phone || '', email: c.email || '', address: (c.addressLines || []).join('\n') });
    setSuggestions([]);
    setLookup('');
  };

  const updateLine = (key, patch) => {
    setItems((lines) => lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
    setErrors((e) => ({ ...e, items: undefined }));
  };

  const chooseProduct = (key, productId) => {
    if (!productId) { updateLine(key, { productId: '', name: '', size: '', price: '' }); return; }
    const { key: _drop, ...fresh } = lineFor(productsById[productId]);
    updateLine(key, fresh);
  };

  const chooseSize = (line, weight) => {
    const size = productsById[line.productId]?.sizes?.find((s) => s.weight === weight);
    updateLine(line.key, { size: weight, price: size ? size.price : line.price });
  };

  const validate = () => {
    const next = {};
    if (!customer.name.trim()) next.name = 'Customer name is required';
    if (customer.phone.trim() && !PHONE_RE.test(customer.phone.trim())) next.phone = 'Enter a 10-digit Indian mobile number';
    if (customer.email.trim() && !EMAIL_RE.test(customer.email.trim())) next.email = 'Enter a valid email address';
    const badLine = items.find((l) => !String(l.name).trim() || !(Number(l.price) >= 0) || l.price === ''
      || !Number.isInteger(Number(l.qty)) || Number(l.qty) < 1);
    if (!items.length) next.items = 'Add at least one item';
    else if (badLine) next.items = 'Every item needs a name, a price and a whole-number quantity';
    if (discountType === 'percent' && Number(discountValue) > 100) next.discount = 'A percentage discount can be at most 100%';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await invoiceAPI.create({
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim(),
          address: customer.address.trim(),
        },
        issuedOn,
        items: items.map((l) => ({
          product: l.productId || undefined,
          name: String(l.name).trim(),
          size: String(l.size || '').trim(),
          price: Number(l.price),
          qty: Number(l.qty),
        })),
        discountType,
        discountValue: Number(discountValue) || 0,
        shipping: Number(shipping) || 0,
        paymentMethod,
        paymentReference: paymentReference.trim(),
        notes: notes.trim(),
      });
      const invoice = res.data.invoice;
      toast.success(res.data.message || `Invoice ${invoice.number} created`);

      if (emailNow && customer.email.trim()) {
        try {
          const sent = await invoiceAPI.send(invoice.id, { to: customer.email.trim() });
          toast.success(sent.data.message);
        } catch (err) {
          toast.error(await apiErrorMessage(err, "Invoice saved, but the email couldn't be sent."));
        }
      }
      onCreated(invoice);
    } catch (err) {
      toast.error(await apiErrorMessage(err, "The invoice couldn't be created."));
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[11px] uppercase tracking-wider font-bold text-brown-mid/60">
          {paymentMethod === 'credit' ? 'Amount due' : 'Total'}
        </div>
        <div className="font-black text-xl text-saffron tabular-nums">{formatINR(totals.total)}</div>
      </div>
      <button type="button" onClick={submit} disabled={saving}
        className="inline-flex items-center gap-2 rounded-full font-bold text-white text-sm px-6 min-h-[44px] disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
        <FileCheck2 size={16} /> {saving ? 'Creating…' : 'Create invoice'}
      </button>
    </div>
  );

  return (
    <AdminSheet title="New offline invoice" onClose={onClose} footer={footer}>
      <div className="space-y-6">
        {/* Customer */}
        <section className="space-y-3">
          <h4 className="font-serif font-bold text-brown-dark">Customer</h4>
          <div className="relative">
            <Field label="Name" htmlFor="inv-name" error={errors.name} hint="(person or business)">
              <input id="inv-name" className="form-input w-full" autoComplete="off" value={customer.name}
                placeholder="Semtech Pvt. Ltd." onChange={(e) => setCustomerField('name', e.target.value)} />
            </Field>
            {suggestions.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-xl border border-saffron/20 shadow-lg overflow-hidden">
                {suggestions.map((c, i) => (
                  <li key={`${c.phone}-${c.name}-${i}`}>
                    <button type="button" onClick={() => pickSuggestion(c)}
                      className="w-full text-left px-3 py-2.5 hover:bg-saffron-pale text-sm">
                      <span className="font-semibold text-brown-dark">{c.name}</span>
                      {c.phone && <span className="text-brown-mid/70"> · {c.phone}</span>}
                      {c.addressLines?.[0] && <span className="block text-xs text-brown-mid/60 truncate">{c.addressLines[0]}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone" htmlFor="inv-phone" error={errors.phone} hint="(optional)">
              <input id="inv-phone" className="form-input w-full" inputMode="tel" autoComplete="off" value={customer.phone}
                placeholder="9876543210" onChange={(e) => setCustomerField('phone', e.target.value)} />
            </Field>
            <Field label="Email" htmlFor="inv-email" error={errors.email} hint="(to send the invoice)">
              <input id="inv-email" type="email" className="form-input w-full" autoComplete="off" value={customer.email}
                placeholder="accounts@company.com" onChange={(e) => setCustomerField('email', e.target.value)} />
            </Field>
          </div>
          <Field label="Address" htmlFor="inv-address" hint="(optional, one line per row)">
            <textarea id="inv-address" rows={2} maxLength={300} className="form-input w-full resize-none" value={customer.address}
              placeholder={'8th Floor, ICC Trade Park, SB Road\nPune, Maharashtra 411016'}
              onChange={(e) => setCustomerField('address', e.target.value)} />
          </Field>
        </section>

        {/* Items */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-brown-dark">Items</h4>
            <label className="flex items-center gap-2 text-xs text-brown-mid/80">
              Invoice date
              <input type="date" className="form-input py-1.5" value={issuedOn}
                min={financialYearStartIST()} max={todayIST()} onChange={(e) => setIssuedOn(e.target.value)} />
            </label>
          </div>

          {items.map((line, index) => {
            const product = productsById[line.productId];
            return (
              <div key={line.key} className="rounded-2xl border border-saffron/15 bg-cream/60 p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <select aria-label={`Item ${index + 1} product`} className="form-input flex-1 min-w-0" value={line.productId}
                    onChange={(e) => chooseProduct(line.key, e.target.value)}>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    <option value="">Custom item…</option>
                  </select>
                  {items.length > 1 && (
                    <button type="button" aria-label={`Remove item ${index + 1}`}
                      onClick={() => setItems((ls) => ls.filter((l) => l.key !== line.key))}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 flex-shrink-0">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {!line.productId && (
                  <input aria-label={`Item ${index + 1} name`} className="form-input w-full" value={line.name} maxLength={120}
                    placeholder="Item name, e.g. Gift box" onChange={(e) => updateLine(line.key, { name: e.target.value })} />
                )}

                <div className="grid grid-cols-3 gap-2">
                  {product?.sizes?.length > 1 ? (
                    <select aria-label={`Item ${index + 1} pack`} className="form-input" value={line.size}
                      onChange={(e) => chooseSize(line, e.target.value)}>
                      {product.sizes.map((s) => <option key={s.weight} value={s.weight}>{s.weight}</option>)}
                    </select>
                  ) : (
                    <input aria-label={`Item ${index + 1} pack`} className="form-input" value={line.size} maxLength={30}
                      placeholder="Pack" onChange={(e) => updateLine(line.key, { size: e.target.value })} />
                  )}
                  <input aria-label={`Item ${index + 1} price`} className="form-input" inputMode="decimal" value={line.price}
                    placeholder="Price ₹" onChange={(e) => updateLine(line.key, { price: e.target.value })} />
                  <input aria-label={`Item ${index + 1} quantity`} className="form-input" inputMode="numeric" value={line.qty}
                    placeholder="Qty" onChange={(e) => updateLine(line.key, { qty: e.target.value })} />
                </div>
                <div className="text-right text-sm text-brown-mid/80">
                  Amount <span className="font-bold text-brown-dark tabular-nums">{formatINR((Number(line.price) || 0) * (Number(line.qty) || 0))}</span>
                </div>
              </div>
            );
          })}
          {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}
          <button type="button" onClick={() => setItems((ls) => [...ls, lineFor(products[0])])}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-saffron min-h-[40px]">
            <Plus size={16} /> Add item
          </button>
        </section>

        {/* Adjustments */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Discount" htmlFor="inv-discount" error={errors.discount}>
            <div className="flex gap-2">
              <div className="inline-flex rounded-full border border-saffron/25 p-0.5 flex-shrink-0" role="group" aria-label="Discount type">
                {[['flat', '₹'], ['percent', '%']].map(([id, sym]) => (
                  <button key={id} type="button" aria-pressed={discountType === id} onClick={() => setDiscountType(id)}
                    className={`w-9 h-9 rounded-full text-sm font-bold ${discountType === id ? 'bg-brown-dark text-white' : 'text-brown-dark'}`}>
                    {sym}
                  </button>
                ))}
              </div>
              <input id="inv-discount" className="form-input flex-1 min-w-0" inputMode="decimal" value={discountValue}
                placeholder="0" onChange={(e) => { setDiscountValue(e.target.value); setErrors((er) => ({ ...er, discount: undefined })); }} />
            </div>
          </Field>
          <Field label="Delivery charge" htmlFor="inv-shipping" hint="(optional)">
            <input id="inv-shipping" className="form-input w-full" inputMode="decimal" value={shipping}
              placeholder="₹0" onChange={(e) => setShipping(e.target.value)} />
          </Field>
        </section>

        {/* Payment */}
        <section className="space-y-3">
          <h4 className="font-serif font-bold text-brown-dark">Payment</h4>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment method">
            {PAYMENT_METHODS.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={paymentMethod === m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={`px-4 min-h-[40px] rounded-full text-sm font-semibold border transition-colors ${
                  paymentMethod === m.id ? 'bg-brown-dark text-white border-brown-dark' : 'bg-white text-brown-dark border-saffron/25 hover:border-saffron/50'}`}>
                {m.label}
              </button>
            ))}
          </div>
          {paymentMethod !== 'credit' && paymentMethod !== 'cash' && (
            <Field label="Payment reference" htmlFor="inv-ref" hint="(optional, e.g. UPI transaction ID)">
              <input id="inv-ref" className="form-input w-full" maxLength={100} value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)} />
            </Field>
          )}
          <Field label="Note on invoice" htmlFor="inv-notes" hint="(optional)">
            <textarea id="inv-notes" rows={2} maxLength={500} className="form-input w-full resize-none" value={notes}
              placeholder="Balance to be paid within 15 days of delivery." onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </section>

        {/* Summary */}
        <section className="rounded-2xl bg-cream p-4 space-y-1.5 text-sm tabular-nums">
          <div className="flex justify-between text-brown-mid/80"><span>Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-brown-mid/80"><span>Discount</span><span>− {formatINR(totals.discount)}</span></div>
          )}
          {totals.shipping > 0 && (
            <div className="flex justify-between text-brown-mid/80"><span>Delivery charge</span><span>{formatINR(totals.shipping)}</span></div>
          )}
          <div className="flex justify-between font-black text-brown-dark text-base pt-1.5 border-t border-saffron/15">
            <span>Total</span><span>{formatINR(totals.total)}</span>
          </div>
        </section>

        {customer.email.trim() && (
          <label className="flex items-center gap-2.5 text-sm text-brown-dark">
            <input type="checkbox" className="w-5 h-5" checked={emailNow} onChange={(e) => setEmailNow(e.target.checked)} />
            Email the invoice PDF to {customer.email.trim()} after creating it
          </label>
        )}
      </div>
    </AdminSheet>
  );
}
