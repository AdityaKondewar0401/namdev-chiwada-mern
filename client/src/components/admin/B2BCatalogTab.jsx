import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { b2bAdminAPI, productAPI } from '../../services/api';
import B2BModal from '../b2b/B2BModal';
import B2BDisabledNotice from './B2BDisabledNotice';

const EMPTY_FORM = { name: '', code: '', description: '', discountPercent: '', isDefault: false, active: true };
const EMPTY_ITEM_FORM = { product: '', size: '', unitsPerCase: '', moqCases: '', basePricePerUnit: '', hsnCode: '', tierOverrides: [], active: true, sortOrder: '' };

function sizesForProduct(product) {
  if (!product) return [];
  if (Array.isArray(product.sizes) && product.sizes.length) return product.sizes.map((s) => s.weight);
  return product.weight ? [product.weight] : [];
}

export default function B2BCatalogTab() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [itemErrors, setItemErrors] = useState({});
  const [itemSubmitting, setItemSubmitting] = useState(false);

  const fetchTiers = useCallback(() => {
    setLoading(true);
    b2bAdminAPI.listTiers()
      .then((res) => setTiers(res.data.tiers))
      .catch(() => toast.error('Failed to load pricing tiers'))
      .finally(() => setLoading(false));
  }, []);

  const fetchItems = useCallback(() => {
    setItemsLoading(true);
    b2bAdminAPI.listCatalogItems()
      .then((res) => setItems(res.data.items))
      .catch(() => toast.error('Failed to load catalog items'))
      .finally(() => setItemsLoading(false));
  }, []);

  useEffect(() => { fetchTiers(); }, [fetchTiers]);
  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { productAPI.getAll({ limit: 100 }).then((res) => setProducts(res.data.products || [])).catch(() => {}); }, []);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (tier) => {
    setEditingId(tier._id);
    setForm({
      name: tier.name, code: tier.code, description: tier.description || '',
      discountPercent: String(tier.discountPercent), isDefault: tier.isDefault, active: tier.active,
    });
    setErrors({});
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const payload = { ...form, discountPercent: Number(form.discountPercent) };
    try {
      if (editingId) {
        await b2bAdminAPI.updateTier(editingId, payload);
        toast.success('Tier updated');
      } else {
        await b2bAdminAPI.createTier(payload);
        toast.success('Tier created');
      }
      setModalOpen(false);
      fetchTiers();
    } catch (err) {
      if (err.response?.status === 400 && Array.isArray(err.response.data?.errors)) {
        const fe = {};
        err.response.data.errors.forEach((e2) => { fe[e2.field] = e2.message; });
        setErrors(fe);
      } else {
        toast.error(err.response?.data?.message || 'Failed to save tier');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTier = async (tier) => {
    if (!window.confirm(`Delete pricing tier "${tier.name}"? This cannot be undone.`)) return;
    try {
      await b2bAdminAPI.deleteTier(tier._id);
      toast.success('Tier deleted');
      fetchTiers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete tier');
    }
  };

  /* ── Catalog items ─────────────────────────────────────────── */
  const openCreateItem = () => { setEditingItemId(null); setItemForm(EMPTY_ITEM_FORM); setItemErrors({}); setItemModalOpen(true); };
  const openEditItem = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      product: item.product._id, size: item.size,
      unitsPerCase: String(item.unitsPerCase), moqCases: String(item.moqCases), basePricePerUnit: String(item.basePricePerUnit),
      hsnCode: item.hsnCode || '', active: item.active, sortOrder: String(item.sortOrder || 0),
      tierOverrides: (item.tierOverrides || []).map((o) => ({ tier: o.tier?._id || o.tier, pricePerUnit: String(o.pricePerUnit) })),
    });
    setItemErrors({});
    setItemModalOpen(true);
  };

  const submitItem = async (e) => {
    e.preventDefault();
    setItemSubmitting(true);
    setItemErrors({});
    const payload = {
      ...itemForm,
      unitsPerCase: Number(itemForm.unitsPerCase),
      moqCases: Number(itemForm.moqCases),
      basePricePerUnit: Number(itemForm.basePricePerUnit),
      sortOrder: itemForm.sortOrder ? Number(itemForm.sortOrder) : 0,
      tierOverrides: itemForm.tierOverrides
        .filter((o) => o.tier && o.pricePerUnit !== '')
        .map((o) => ({ tier: o.tier, pricePerUnit: Number(o.pricePerUnit) })),
    };
    try {
      if (editingItemId) {
        delete payload.product;
        delete payload.size;
        await b2bAdminAPI.updateCatalogItem(editingItemId, payload);
        toast.success('Catalog item updated');
      } else {
        await b2bAdminAPI.createCatalogItem(payload);
        toast.success('Catalog item created');
      }
      setItemModalOpen(false);
      fetchItems();
    } catch (err) {
      if (err.response?.status === 400 && Array.isArray(err.response.data?.errors)) {
        const fe = {};
        err.response.data.errors.forEach((e2) => { fe[e2.field] = e2.message; });
        setItemErrors(fe);
      } else {
        toast.error(err.response?.data?.message || 'Failed to save catalog item');
      }
    } finally {
      setItemSubmitting(false);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.product.name} (${item.size})" from the wholesale catalog?`)) return;
    try {
      await b2bAdminAPI.deleteCatalogItem(item._id);
      toast.success('Catalog item deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete catalog item');
    }
  };

  const selectedProduct = products.find((p) => p._id === itemForm.product);
  const availableSizes = sizesForProduct(selectedProduct);

  const setOverride = (index, field, value) => {
    setItemForm((f) => {
      const next = [...f.tierOverrides];
      next[index] = { ...next[index], [field]: value };
      return { ...f, tierOverrides: next };
    });
  };
  const addOverride = () => setItemForm((f) => ({ ...f, tierOverrides: [...f.tierOverrides, { tier: '', pricePerUnit: '' }] }));
  const removeOverride = (index) => setItemForm((f) => ({ ...f, tierOverrides: f.tierOverrides.filter((_, i) => i !== index) }));

  return (
    <div>
      <B2BDisabledNotice />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif font-black text-brown-dark text-lg">Wholesale Pricing</h2>
          <p className="text-brown-mid/60 text-sm mt-0.5">Pricing tiers apply a % discount off the base wholesale price.</p>
        </div>
        <button onClick={openCreate} className="btn-saffron text-sm px-5" style={{ minHeight: 44 }}>
          + New tier
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">Loading…</div>
      ) : tiers.length === 0 ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">No pricing tiers yet. Create your first one to start approving businesses.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tiers.map((t) => (
            <div key={t._id} className="card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-brown-dark text-sm">{t.name}</div>
                  <div className="text-xs text-brown-mid/50 mt-0.5">{t.code}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {t.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>DEFAULT</span>
                  )}
                  {!t.active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#f3f4f6', color: '#6b7280' }}>INACTIVE</span>
                  )}
                </div>
              </div>
              <div className="font-serif font-black text-saffron text-xl">{t.discountPercent}% off</div>
              {t.description && <p className="text-brown-mid/60 text-xs leading-relaxed">{t.description}</p>}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => openEdit(t)} className="flex-1 rounded-xl text-sm font-semibold text-brown-dark"
                  style={{ minHeight: 44, background: '#fef3e0' }}>
                  Edit
                </button>
                <button onClick={() => deleteTier(t)} className="flex-1 rounded-xl text-sm font-semibold text-red-600"
                  style={{ minHeight: 44, background: '#fef2f2' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-8 mb-4 pt-6 border-t" style={{ borderColor: 'rgba(224,112,0,0.12)' }}>
        <div>
          <h2 className="font-serif font-black text-brown-dark text-lg">Wholesale Catalog</h2>
          <p className="text-brown-mid/60 text-sm mt-0.5">Products and sizes available for bulk ordering, by the case.</p>
        </div>
        <button onClick={openCreateItem} className="btn-saffron text-sm px-5" style={{ minHeight: 44 }}>
          + New item
        </button>
      </div>

      {itemsLoading ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-brown-mid/50 text-sm">No catalog items yet. Add your first wholesale item above.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item._id} className="card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.product?.img && <img src={item.product.img} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="font-bold text-brown-dark text-sm truncate">{item.product?.name || 'Unknown product'}</div>
                    <div className="text-xs text-brown-mid/50">{item.size}</div>
                  </div>
                </div>
                {!item.active && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#f3f4f6', color: '#6b7280' }}>INACTIVE</span>
                )}
              </div>
              <div className="text-sm text-brown-dark">₹{item.basePricePerUnit}/unit · {item.unitsPerCase}/case · MOQ {item.moqCases}</div>
              {item.tierOverrides?.length > 0 && (
                <div className="text-xs text-brown-mid/50">{item.tierOverrides.length} tier override{item.tierOverrides.length > 1 ? 's' : ''}</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => openEditItem(item)} className="flex-1 rounded-xl text-sm font-semibold text-brown-dark"
                  style={{ minHeight: 44, background: '#fef3e0' }}>
                  Edit
                </button>
                <button onClick={() => deleteItem(item)} className="flex-1 rounded-xl text-sm font-semibold text-red-600"
                  style={{ minHeight: 44, background: '#fef2f2' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <B2BModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit pricing tier' : 'New pricing tier'}>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Name *</label>
            <input className="form-input text-base" required
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Code *</label>
              <input className="form-input text-base uppercase" required
                value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
              {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Discount % *</label>
              <input type="number" inputMode="numeric" min="0" max="100" step="0.01" className="form-input text-base" required
                value={form.discountPercent} onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))} />
              {errors.discountPercent && <p className="mt-1 text-xs text-red-600">{errors.discountPercent}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Description (optional)</label>
            <textarea className="form-input text-base" rows={2}
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-brown-dark" style={{ minHeight: 44 }}>
              <input type="checkbox" className="w-5 h-5" checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
              Make this the default tier
            </label>
            <label className="flex items-center gap-2.5 text-sm font-semibold text-brown-dark" style={{ minHeight: 44 }}>
              <input type="checkbox" className="w-5 h-5" checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
              Active
            </label>
          </div>
          <button type="submit" disabled={submitting} className="btn-saffron disabled:opacity-60" style={{ minHeight: 48 }}>
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create tier'}
          </button>
        </form>
      </B2BModal>

      <B2BModal open={itemModalOpen} onClose={() => setItemModalOpen(false)} title={editingItemId ? 'Edit catalog item' : 'New catalog item'} widthClass="sm:max-w-lg">
        <form onSubmit={submitItem} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Product *</label>
              <select className="form-input text-base" required disabled={!!editingItemId}
                value={itemForm.product} onChange={(e) => setItemForm((f) => ({ ...f, product: e.target.value, size: '' }))}>
                <option value="">Select…</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              {itemErrors.product && <p className="mt-1 text-xs text-red-600">{itemErrors.product}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Size *</label>
              <select className="form-input text-base" required disabled={!!editingItemId || !selectedProduct}
                value={itemForm.size} onChange={(e) => setItemForm((f) => ({ ...f, size: e.target.value }))}>
                <option value="">Select…</option>
                {availableSizes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {itemErrors.size && <p className="mt-1 text-xs text-red-600">{itemErrors.size}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">Units per case *</label>
              <input type="number" inputMode="numeric" min="1" className="form-input text-base" required
                value={itemForm.unitsPerCase} onChange={(e) => setItemForm((f) => ({ ...f, unitsPerCase: e.target.value }))} />
              {itemErrors.unitsPerCase && <p className="mt-1 text-xs text-red-600">{itemErrors.unitsPerCase}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown-dark mb-1.5">MOQ (cases) *</label>
              <input type="number" inputMode="numeric" min="1" className="form-input text-base" required
                value={itemForm.moqCases} onChange={(e) => setItemForm((f) => ({ ...f, moqCases: e.target.value }))} />
              {itemErrors.moqCases && <p className="mt-1 text-xs text-red-600">{itemErrors.moqCases}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">Base price per unit (₹) *</label>
            <input type="number" inputMode="numeric" min="0.01" step="0.01" className="form-input text-base" required
              value={itemForm.basePricePerUnit} onChange={(e) => setItemForm((f) => ({ ...f, basePricePerUnit: e.target.value }))} />
            {itemErrors.basePricePerUnit && <p className="mt-1 text-xs text-red-600">{itemErrors.basePricePerUnit}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-brown-dark mb-1.5">HSN code (optional, for future GST use)</label>
            <input className="form-input text-base" value={itemForm.hsnCode} onChange={(e) => setItemForm((f) => ({ ...f, hsnCode: e.target.value }))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-brown-dark">Tier price overrides (optional)</label>
              <button type="button" onClick={addOverride} className="text-saffron font-semibold text-xs">+ Add</button>
            </div>
            <div className="flex flex-col gap-2">
              {itemForm.tierOverrides.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select className="form-input text-base flex-1" value={o.tier} onChange={(e) => setOverride(i, 'tier', e.target.value)}>
                    <option value="">Tier…</option>
                    {tiers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                  <input type="number" inputMode="numeric" min="0" step="0.01" placeholder="₹/unit" className="form-input text-base" style={{ width: 100 }}
                    value={o.pricePerUnit} onChange={(e) => setOverride(i, 'pricePerUnit', e.target.value)} />
                  <button type="button" onClick={() => removeOverride(i)} aria-label="Remove override"
                    className="flex-shrink-0 rounded-lg text-red-600 font-bold" style={{ width: 44, height: 44, background: '#fef2f2' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm font-semibold text-brown-dark" style={{ minHeight: 44 }}>
            <input type="checkbox" className="w-5 h-5" checked={itemForm.active} onChange={(e) => setItemForm((f) => ({ ...f, active: e.target.checked }))} />
            Active
          </label>

          <button type="submit" disabled={itemSubmitting} className="btn-saffron disabled:opacity-60" style={{ minHeight: 48 }}>
            {itemSubmitting ? 'Saving…' : editingItemId ? 'Save changes' : 'Create catalog item'}
          </button>
        </form>
      </B2BModal>
    </div>
  );
}
