import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Sidebar Tabs ───────────────────────────────────────
const TABS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'products', icon: '🍛', label: 'Products' },
  { id: 'add', icon: '➕', label: 'Add Product' },
  { id: 'orders', icon: '📦', label: 'Orders' },
  { id: 'promos', icon: '🎟️', label: 'Promo Codes' },
];

const CATEGORIES = ['mild', 'spicy', 'special'];

const EMPTY_FORM = {
  name: '', namMarathi: '', sub: '', intro: '', desc: '',
  category: 'mild', tag: '', badge: '', badgeColor: '#e07000',
  price: '', originalPrice: '', weight: '250g', img: '', images: '',
  rating: 4.5, reviews: 0, featured: false, inStock: true, info: '',
  ingredients: '', sizes: '250g:180,500g:340',
};

const Field = ({ label, fieldKey, type = 'text', placeholder = '', hint = '', form, onChange }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">{label}</label>
    <input
      type={type}
      value={form[fieldKey] || ''}
      onChange={e => onChange(fieldKey, e.target.value)}
      placeholder={placeholder}
      className="form-input text-sm"
    />
    {hint && <p className="text-xs text-brown-mid/40 mt-1">{hint}</p>}
  </div>
);

// ── Dashboard Tab ──────────────────────────────────────
function DashboardTab({ products, orders }) {
  const deliveredRevenue = orders
    .filter(o => o.status?.toLowerCase() === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const stats = [
    { icon: '🍛', label: 'Total Products', value: products.length, color: '#e07000' },
    { icon: '📦', label: 'Total Orders', value: orders.length, color: '#d4af37' },
    { icon: '💰', label: 'Total Revenue', value: `₹${deliveredRevenue.toLocaleString()}`, color: '#2d5a1b' },
    { icon: '⭐', label: 'Featured Products', value: products.filter(p => p.featured).length, color: '#7c3aed' },
  ];

  return (
    <div>
      <h2 className="font-serif font-black text-brown-dark text-2xl mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
            <div className="text-3xl mb-3">{s.icon}</div>
            <div className="font-black text-2xl mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-brown-mid/60 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6"
        style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
        <h3 className="font-bold text-brown-dark mb-4">Recent Products</h3>
        <div className="space-y-3">
          {products.slice(0, 5).map(p => (
            <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#fef3e0' }}>
              <img src={p.img} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-brown-dark text-sm truncate">{p.name}</div>
                <div className="text-xs text-brown-mid/60">₹{p.price} · {p.category}</div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {p.inStock ? 'In Stock' : 'Out'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Products Tab ───────────────────────────────────────
function ProductsTab({ products, onDelete, onEdit, loading }) {
  const [search, setSearch] = useState('');
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-2xl skeleton" />)}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-serif font-black text-brown-dark text-2xl">
          Products <span className="text-lg text-brown-mid/50 font-normal">({products.length})</span>
        </h2>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products..." className="form-input py-2 px-4 rounded-full text-sm w-48" />
      </div>
      <div className="space-y-3">
        {filtered.map(p => (
          <motion.div key={p._id} layout
            className="bg-white rounded-2xl p-4 flex items-center gap-4"
            style={{ boxShadow: '0 2px 12px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
            <img src={p.img} alt={p.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-serif font-bold text-brown-dark">{p.name}</div>
              <div className="text-xs text-brown-mid/60 mt-0.5">₹{p.price} · {p.category} · ⭐{p.rating} ({p.reviews})</div>
              <div className="flex gap-2 mt-1.5">
                {p.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Featured</span>}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {p.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => onEdit(p)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{ background: '#fef3e0', color: '#e07000', border: '1px solid rgba(224,112,0,0.2)' }}>
                ✏️ Edit
              </button>
              <button onClick={() => onDelete(p._id, p.name)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}>
                🗑️ Delete
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-brown-mid/50">No products found</div>}
      </div>
    </div>
  );
}

// ── Add/Edit Product Tab ───────────────────────────────
function ProductFormTab({ editProduct, onSave, onCancel }) {
  const [form, setForm] = useState(editProduct ? {
    ...editProduct,
    images: editProduct.images?.join(',') || '',
    ingredients: editProduct.ingredients?.join(',') || '',
    sizes: editProduct.sizes?.map(s => `${s.weight}:${s.price}`).join(',') || '',
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingMultiple, setUploadingMultiple] = useState(false);
  const [uploadedImages, setUploadedImages] = useState(editProduct?.images || []);

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleMainImageUpload = async (file) => {
    if (!file) return;
    setUploadingMain(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('nc_token')}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) { f('img', data.url); toast.success('Main image uploaded! ✅'); }
      else toast.error(data.message || 'Upload failed');
    } catch { toast.error('Upload failed. Check your server is running.'); }
    finally { setUploadingMain(false); }
  };

  const handleMultipleImagesUpload = async (files) => {
    if (!files.length) return;
    setUploadingMultiple(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      const res = await fetch('/api/upload/multiple', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('nc_token')}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const urls = data.images.map(img => img.url);
        const allUrls = [...uploadedImages, ...urls];
        setUploadedImages(allUrls);
        f('images', allUrls.join(','));
        toast.success(`${urls.length} images uploaded! ✅`);
      } else toast.error(data.message || 'Upload failed');
    } catch { toast.error('Upload failed. Check your server is running.'); }
    finally { setUploadingMultiple(false); }
  };

  const removeUploadedImage = (index) => {
    const updated = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updated);
    f('images', updated.join(','));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sizes = form.sizes.split(',').map(s => {
        const [weight, price] = s.trim().split(':');
        return { weight: weight?.trim(), price: Number(price) };
      }).filter(s => s.weight && s.price);

      const images = form.images
        ? form.images.split(',').map(i => i.trim()).filter(Boolean)
        : [form.img];

      const ingredients = form.ingredients
        ? form.ingredients.split(',').map(i => i.trim()).filter(Boolean)
        : [];

      const data = {
        ...form, sizes, images, ingredients,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || undefined,
        rating: Number(form.rating),
        reviews: Number(form.reviews),
      };

      await onSave(data, !!editProduct);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif font-black text-brown-dark text-2xl">
          {editProduct ? '✏️ Edit Product' : '➕ Add New Product'}
        </h2>
        {editProduct && (
          <button onClick={onCancel} className="text-sm text-brown-mid/60 hover:text-brown-dark transition-colors">
            ← Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
          <h3 className="font-bold text-brown-dark mb-4 text-sm uppercase tracking-wider">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Product Name *" fieldKey="name" placeholder="Namdev Chiwada" form={form} onChange={f} />
            <Field label="Marathi Name" fieldKey="namMarathi" placeholder="नामदेव चिवडा" form={form} onChange={f} />
            <Field label="Sub Title" fieldKey="sub" placeholder="House Signature Blend" form={form} onChange={f} />
            <Field label="Short Intro" fieldKey="intro" placeholder="1-line card description" form={form} onChange={f} />
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Full Description *</label>
              <textarea value={form.desc || ''} onChange={e => f('desc', e.target.value)}
                placeholder="Full product description..." rows={3} className="form-input text-sm resize-y" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
          <h3 className="font-bold text-brown-dark mb-4 text-sm uppercase tracking-wider">Pricing & Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Base Price ₹ *" fieldKey="price" type="number" placeholder="180" form={form} onChange={f} />
            <Field label="Original Price ₹" fieldKey="originalPrice" type="number" placeholder="210" form={form} onChange={f} />
            <Field label="Default Weight" fieldKey="weight" placeholder="250g" form={form} onChange={f} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Category *</label>
              <select value={form.category} onChange={e => f('category', e.target.value)} className="form-input text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Sizes (weight:price)</label>
              <input value={form.sizes || ''} onChange={e => f('sizes', e.target.value)}
                placeholder="250g:180,500g:340,1kg:640" className="form-input text-sm" />
              <p className="text-xs text-brown-mid/40 mt-1">Format: 250g:180,500g:340</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Rating</label>
              <input type="number" min="0" max="5" step="0.1"
                value={form.rating} onChange={e => f('rating', e.target.value)} className="form-input text-sm" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
          <h3 className="font-bold text-brown-dark mb-4 text-sm uppercase tracking-wider">Badge & Tags</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Badge Text" fieldKey="badge" placeholder="Bestseller" form={form} onChange={f} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Badge Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.badgeColor || '#e07000'} onChange={e => f('badgeColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                <input value={form.badgeColor || '#e07000'} onChange={e => f('badgeColor', e.target.value)} className="form-input text-sm flex-1" />
              </div>
            </div>
            <Field label="Tag" fieldKey="tag" placeholder="🏆 Most Loved" form={form} onChange={f} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
          <h3 className="font-bold text-brown-dark mb-4 text-sm uppercase tracking-wider">Images</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-2">Main Product Image *</label>
              <div onClick={() => document.getElementById('mainImageInput').click()}
                className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-saffron hover:bg-saffron/5"
                style={{ borderColor: uploadingMain ? '#e07000' : 'rgba(224,112,0,0.3)' }}>
                <input id="mainImageInput" type="file" accept="image/*" className="hidden"
                  onChange={e => handleMainImageUpload(e.target.files[0])} />
                {uploadingMain ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-saffron font-medium">Uploading to Cloudinary...</span>
                  </div>
                ) : form.img ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={form.img} alt="main" className="w-32 h-32 rounded-2xl object-cover shadow-saffron" />
                    <span className="text-xs text-brown-mid/60">Click to change image</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-brown-mid/50">
                    <span className="text-4xl">📸</span>
                    <span className="text-sm font-medium">Click to upload main image</span>
                    <span className="text-xs">JPG, PNG, WebP · Max 5MB</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-px bg-saffron/15" />
                <span className="text-xs text-brown-mid/40 font-medium">OR enter URL manually</span>
                <div className="flex-1 h-px bg-saffron/15" />
              </div>
              <input value={form.img || ''} onChange={e => f('img', e.target.value)}
                placeholder="https://res.cloudinary.com/..." className="form-input text-sm mt-3" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-2">Additional Images (Gallery)</label>
              <div onClick={() => document.getElementById('multipleImagesInput').click()}
                className="border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all hover:border-saffron hover:bg-saffron/5"
                style={{ borderColor: uploadingMultiple ? '#e07000' : 'rgba(224,112,0,0.2)' }}>
                <input id="multipleImagesInput" type="file" accept="image/*" multiple className="hidden"
                  onChange={e => handleMultipleImagesUpload(Array.from(e.target.files))} />
                {uploadingMultiple ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-saffron font-medium">Uploading images...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-brown-mid/50">
                    <span className="text-3xl">🖼️</span>
                    <span className="text-sm font-medium">Click to upload multiple images</span>
                    <span className="text-xs">Select up to 4 images at once</span>
                  </div>
                )}
              </div>
              {uploadedImages.length > 0 && (
                <div className="flex gap-3 mt-3 flex-wrap">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt={`gallery-${i}`} className="w-20 h-20 rounded-xl object-cover"
                        style={{ border: '2px solid rgba(224,112,0,0.3)' }} />
                      <button type="button" onClick={() => removeUploadedImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-px bg-saffron/15" />
                <span className="text-xs text-brown-mid/40 font-medium">OR enter URLs manually</span>
                <div className="flex-1 h-px bg-saffron/15" />
              </div>
              <input value={form.images || ''} onChange={e => f('images', e.target.value)}
                placeholder="url1,url2,url3" className="form-input text-sm mt-3" />
              <p className="text-xs text-brown-mid/40 mt-1">Separate multiple URLs with commas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
          <h3 className="font-bold text-brown-dark mb-4 text-sm uppercase tracking-wider">Product Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Ingredients (comma separated)</label>
              <input value={form.ingredients || ''} onChange={e => f('ingredients', e.target.value)}
                placeholder="Besan Sev, Peanuts, Curry Leaves, Rock Salt" className="form-input text-sm" />
            </div>
            <Field label="Shelf Life / Info" fieldKey="info"
              placeholder="Shelf life: 45 days. No artificial colors. 100% Vegetarian." form={form} onChange={f} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
          <h3 className="font-bold text-brown-dark mb-4 text-sm uppercase tracking-wider">Settings</h3>
          <div className="flex gap-6">
            {[{ key: 'featured', label: 'Featured on Homepage' }, { key: 'inStock', label: 'In Stock' }].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => f(key, !form[key])}
                  className="w-12 h-6 rounded-full transition-all duration-200 flex items-center px-1"
                  style={{ background: form[key] ? '#e07000' : '#d1d5db' }}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form[key] ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-medium text-brown-dark">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-8 py-4 rounded-full font-bold text-white text-base transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 4px 16px rgba(224,112,0,0.3)' }}>
            {loading ? 'Saving...' : editProduct ? '✅ Update Product' : '➕ Add Product'}
          </button>
          {editProduct && (
            <button type="button" onClick={onCancel}
              className="px-6 py-4 rounded-full font-bold text-brown-mid border-2 border-brown-mid/20 hover:bg-cream transition-all">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Orders Tab — REDESIGNED ────────────────────────────
const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_CONFIG = {
  pending:    { color: '#b45309', bg: '#fef3c7', border: '#fde68a', icon: '🕐', dot: '#f59e0b' },
  confirmed:  { color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', icon: '✅', dot: '#3b82f6' },
  processing: { color: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe', icon: '⚙️', dot: '#8b5cf6' },
  shipped:    { color: '#0e7490', bg: '#cffafe', border: '#a5f3fc', icon: '🚚', dot: '#06b6d4' },
  delivered:  { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', icon: '🎉', dot: '#22c55e' },
  cancelled:  { color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', icon: '✕',  dot: '#ef4444' },
};

const PAYMENT_ICONS = { ONLINE: '💳', COD: '💵', online: '💳', cod: '💵' };

function OrderCard({ order, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const status = order.status?.toLowerCase() || 'pending';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const payMethod = order.paymentMethod || order.payment?.method || 'COD';
  const payStatus = order.paymentStatus || (payMethod === 'COD' ? 'Pay on delivery' : 'Paid');

  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      border: `1px solid ${cfg.border}`,
      boxShadow: '0 2px 16px rgba(45,26,0,0.06)',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Status bar at top */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.dot}88)`,
      }} />

      {/* Main row */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>

          {/* Left — order ID + customer */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: 15,
                color: '#3d2800',
                letterSpacing: '0.04em',
              }}>
                #{order._id.slice(-8).toUpperCase()}
              </span>
              {/* Status badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 20,
                background: cfg.bg, color: cfg.color,
                fontSize: 11, fontWeight: 700,
                border: `1px solid ${cfg.border}`,
                textTransform: 'capitalize',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                {cfg.icon} {status}
              </span>
              {/* Payment badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 20,
                background: payMethod.toUpperCase() === 'ONLINE' ? '#dbeafe' : '#f0fdf4',
                color: payMethod.toUpperCase() === 'ONLINE' ? '#1d4ed8' : '#15803d',
                fontSize: 10, fontWeight: 700,
                border: `1px solid ${payMethod.toUpperCase() === 'ONLINE' ? '#bfdbfe' : '#bbf7d0'}`,
              }}>
                {PAYMENT_ICONS[payMethod] || '💵'} {payMethod.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #e07000, #ff9010)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>
                {(order.user?.name || 'G').charAt(0).toUpperCase()}
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#3d2800' }}>
                  {order.user?.name || 'Guest'}
                </span>
                <span style={{ color: '#9a7c5a', fontSize: 12, marginLeft: 6 }}>
                  {order.user?.email}
                </span>
              </div>
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#9a7c5a', display: 'flex', alignItems: 'center', gap: 4 }}>
                📅 {dateStr} · {timeStr}
              </span>
              <span style={{ fontSize: 11, color: '#9a7c5a', display: 'flex', alignItems: 'center', gap: 4 }}>
                📦 {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
              </span>
              {order.shippingAddress?.city && (
                <span style={{ fontSize: 11, color: '#9a7c5a', display: 'flex', alignItems: 'center', gap: 4 }}>
                  📍 {order.shippingAddress.city}, {order.shippingAddress.state}
                </span>
              )}
              <span style={{ fontSize: 11, color: payMethod.toUpperCase() === 'ONLINE' ? '#15803d' : '#9a7c5a' }}>
                💰 {payStatus}
              </span>
            </div>
          </div>

          {/* Right — amount + status dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontWeight: 900, fontSize: 22,
                color: '#e07000',
                fontFamily: "'Lora', Georgia, serif",
                lineHeight: 1,
              }}>
                ₹{(order.total || 0).toLocaleString()}
              </div>
              {order.discount > 0 && (
                <div style={{ fontSize: 10, color: '#15803d', marginTop: 2 }}>
                  −₹{order.discount} discount applied
                </div>
              )}
            </div>

            {/* Status dropdown */}
            <select
              value={order.status || 'pending'}
              onChange={e => onUpdateStatus(order._id, e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 10,
                border: `1.5px solid ${cfg.border}`,
                background: cfg.bg,
                color: cfg.color,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                textTransform: 'capitalize',
                appearance: 'none',
                paddingRight: 28,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(cfg.color)}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s} style={{ background: 'white', color: '#3d2800', textTransform: 'capitalize' }}>
                  {STATUS_CONFIG[s]?.icon} {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                fontSize: 11, fontWeight: 700, color: '#e07000',
                background: '#fff4e6', border: '1px solid rgba(224,112,0,0.2)',
                borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {expanded ? '▲ Hide details' : '▼ View details'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              borderTop: '1px solid rgba(224,160,80,0.12)',
              background: '#fef9f3',
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 20,
            }}>

              {/* Order items */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9a7c5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Items Ordered
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(order.items || []).map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'white', borderRadius: 10, padding: '8px 10px',
                      border: '1px solid rgba(224,160,80,0.1)',
                    }}>
                      {item.img && (
                        <img src={item.img} alt={item.name}
                          style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#3d2800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name || item.product?.name || 'Product'}
                        </div>
                        <div style={{ fontSize: 11, color: '#9a7c5a' }}>
                          {item.size && `${item.size} · `}Qty: {item.qty}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#e07000', flexShrink: 0 }}>
                        ₹{(item.price * item.qty).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping address */}
              {order.shippingAddress && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9a7c5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Delivery Address
                  </div>
                  <div style={{
                    background: 'white', borderRadius: 10, padding: '12px 14px',
                    border: '1px solid rgba(224,160,80,0.1)',
                    fontSize: 12, lineHeight: 1.7, color: '#3d2800',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>
                      {order.shippingAddress.fullName}
                    </div>
                    <div style={{ color: '#7a5c3a' }}>{order.shippingAddress.line1}</div>
                    {order.shippingAddress.line2 && <div style={{ color: '#7a5c3a' }}>{order.shippingAddress.line2}</div>}
                    <div style={{ color: '#7a5c3a' }}>
                      {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                    </div>
                    {order.shippingAddress.phone && (
                      <div style={{ marginTop: 4, color: '#e07000', fontWeight: 600 }}>
                        📞 {order.shippingAddress.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price breakdown */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9a7c5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Price Breakdown
                </div>
                <div style={{
                  background: 'white', borderRadius: 10, padding: '12px 14px',
                  border: '1px solid rgba(224,160,80,0.1)',
                }}>
                  {[
                    { label: 'Subtotal', value: `₹${(order.subtotal || order.total || 0).toLocaleString()}` },
                    { label: 'Shipping', value: order.shipping === 0 ? '🚚 FREE' : `₹${order.shipping || 0}` },
                    order.discount > 0 && { label: 'Discount', value: `-₹${order.discount}`, green: true },
                    { label: 'Total Paid', value: `₹${(order.total || 0).toLocaleString()}`, bold: true },
                  ].filter(Boolean).map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 0',
                      borderTop: row.bold ? '1px solid rgba(224,160,80,0.15)' : 'none',
                      marginTop: row.bold ? 4 : 0,
                    }}>
                      <span style={{ fontSize: 12, color: '#9a7c5a' }}>{row.label}</span>
                      <span style={{
                        fontSize: row.bold ? 14 : 12,
                        fontWeight: row.bold ? 800 : 600,
                        color: row.green ? '#15803d' : row.bold ? '#e07000' : '#3d2800',
                        fontFamily: "'Lora', serif",
                      }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Promo info */}
                {order.promoCode && (
                  <div style={{
                    marginTop: 8, padding: '6px 12px', borderRadius: 8,
                    background: '#dcfce7', border: '1px solid #bbf7d0',
                    fontSize: 11, fontWeight: 700, color: '#15803d',
                  }}>
                    🎟️ Promo: <span style={{ letterSpacing: '0.05em' }}>{order.promoCode}</span>
                  </div>
                )}

                {/* Razorpay ID */}
                {order.razorpayPaymentId && (
                  <div style={{
                    marginTop: 6, padding: '6px 12px', borderRadius: 8,
                    background: '#dbeafe', border: '1px solid #bfdbfe',
                    fontSize: 10, fontWeight: 600, color: '#1d4ed8',
                    wordBreak: 'break-all',
                  }}>
                    🔑 {order.razorpayPaymentId}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/orders/admin')
      .then(res => setOrders(res.data.orders || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      toast.success('Order status updated!');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status?.toLowerCase() === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o._id.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.shippingAddress?.city?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Stats
  const stats = STATUS_OPTIONS.map(s => ({
    status: s,
    count: orders.filter(o => o.status?.toLowerCase() === s).length,
    cfg: STATUS_CONFIG[s],
  }));

  const totalRevenue = orders
    .filter(o => o.status?.toLowerCase() === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl skeleton" />)}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="font-serif font-black text-brown-dark text-2xl" style={{ marginBottom: 2 }}>
            All Orders
            <span style={{ fontSize: 16, fontWeight: 400, color: '#9a7c5a', marginLeft: 8 }}>({orders.length})</span>
          </h2>
          <p style={{ fontSize: 12, color: '#9a7c5a' }}>
            💰 Delivered revenue: <strong style={{ color: '#15803d' }}>₹{totalRevenue.toLocaleString()}</strong>
          </p>
        </div>
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, city, ID..."
          style={{
            padding: '8px 16px', borderRadius: 30, border: '1.5px solid rgba(224,112,0,0.2)',
            background: 'white', fontSize: 13, color: '#3d2800', outline: 'none', width: 240,
          }}
        />
      </div>

      {/* Status summary chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: '1.5px solid',
            borderColor: filter === 'all' ? '#e07000' : 'rgba(224,112,0,0.2)',
            background: filter === 'all' ? '#e07000' : 'white',
            color: filter === 'all' ? 'white' : '#9a7c5a',
            transition: 'all 0.15s',
          }}
        >
          All ({orders.length})
        </button>
        {stats.filter(s => s.count > 0).map(({ status, count, cfg }) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1.5px solid ${filter === status ? cfg.dot : cfg.border}`,
              background: filter === status ? cfg.bg : 'white',
              color: filter === status ? cfg.color : '#9a7c5a',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {cfg.icon} {status} ({count})
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9a7c5a' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700 }}>No orders found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(order => (
            <OrderCard key={order._id} order={order} onUpdateStatus={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Promo Codes Tab ────────────────────────────────────
function PromoCodesTab() {
  const DEFAULT_PROMOS = [
    { code: 'NAMDEV10', type: 'percent', value: 10, active: true, uses: 0 },
    { code: 'SOLAPUR', type: 'shipping', value: 0, active: true, uses: 0 },
    { code: 'FLAT50', type: 'flat', value: 50, active: true, uses: 0 },
  ];

  const [promos, setPromos] = useState(DEFAULT_PROMOS);
  const [form, setForm] = useState({ code: '', type: 'percent', value: '' });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.code || (!form.value && form.type !== 'shipping')) { toast.error('Fill all fields'); return; }
    if (promos.find(p => p.code === form.code.toUpperCase())) { toast.error('Promo code already exists'); return; }

    const newPromo = {
      code: form.code.toUpperCase(), type: form.type,
      value: form.type === 'shipping' ? 0 : Number(form.value),
      active: true, uses: 0,
    };

    setSaving(true);
    try {
      await api.post('/api/admin/promos', newPromo);
      setPromos(prev => [...prev, newPromo]);
      setForm({ code: '', type: 'percent', value: '' });
      setAdding(false);
      toast.success(`Promo "${newPromo.code}" added & active!`);
    } catch {
      setPromos(prev => [...prev, newPromo]);
      setForm({ code: '', type: 'percent', value: '' });
      setAdding(false);
      toast.success(`Promo "${newPromo.code}" added!`);
    } finally { setSaving(false); }
  };

  const togglePromo = (code) => setPromos(prev => prev.map(p => p.code === code ? { ...p, active: !p.active } : p));

  const deletePromo = (code) => {
    if (DEFAULT_PROMOS.find(p => p.code === code)) { toast.error('Cannot delete default promo codes'); return; }
    setPromos(prev => prev.filter(p => p.code !== code));
    toast.success('Promo deleted');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif font-black text-brown-dark text-2xl">Promo Codes</h2>
        <button onClick={() => setAdding(!adding)}
          className="px-5 py-2.5 rounded-full font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
          {adding ? 'Cancel' : '+ Add Code'}
        </button>
      </div>

      <div className="mb-4 px-4 py-3 rounded-xl text-xs text-amber-700 bg-amber-50 border border-amber-200">
        💡 <strong>New codes</strong> are synced to the backend via <code>POST /api/admin/promos</code>.
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 mb-5"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.15)' }}>
            <h3 className="font-bold text-brown-dark mb-4">New Promo Code</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Code</label>
                <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20" className="form-input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value, value: e.target.value === 'shipping' ? '0' : p.value }))}
                  className="form-input text-sm">
                  <option value="percent">Percentage Off</option>
                  <option value="flat">Flat Discount ₹</option>
                  <option value="shipping">Free Shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                  Value {form.type === 'percent' ? '(%)' : form.type === 'flat' ? '(₹)' : '(auto)'}
                </label>
                <input type="number" value={form.type === 'shipping' ? '0' : form.value}
                  onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                  placeholder={form.type === 'percent' ? '10' : '50'}
                  disabled={form.type === 'shipping'} className="form-input text-sm disabled:opacity-50" />
              </div>
            </div>
            <button onClick={handleAdd} disabled={saving}
              className="px-6 py-2.5 rounded-full font-bold text-white text-sm disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
              {saving ? 'Saving...' : '✅ Add Promo Code'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {promos.map(promo => (
          <div key={promo.code} className="bg-white rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3"
            style={{ boxShadow: '0 2px 12px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-xl font-black text-lg tracking-wider"
                style={{ background: promo.active ? '#fff0d6' : '#f5f5f5', color: promo.active ? '#e07000' : '#9ca3af' }}>
                {promo.code}
              </div>
              <div>
                <div className="font-semibold text-brown-dark text-sm">
                  {promo.type === 'shipping' ? 'Free Shipping' : `${promo.type === 'flat' ? '₹' : ''}${promo.value}${promo.type === 'percent' ? '% off' : ' off'}`}
                </div>
                <div className="text-xs text-brown-mid/60">{promo.uses} uses · {promo.type}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${promo.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {promo.active ? 'Active' : 'Inactive'}
              </span>
              <button onClick={() => togglePromo(promo.code)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-all"
                style={{ borderColor: 'rgba(224,112,0,0.2)', color: '#e07000' }}>
                {promo.active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => deletePromo(promo.code)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: '#fef2f2', color: '#dc2626' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ADMIN PAGE ────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
  }, [user, navigate]);

  useEffect(() => {
    productAPI.getAll({ limit: 100 })
      .then(res => setProducts(res.data.products || []))
      .catch(() => { })
      .finally(() => setLoading(false));

    api.get('/api/orders/admin')
      .then(res => setOrders(res.data.orders || []))
      .catch(() => { });
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await productAPI.delete(id);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success(`"${name}" deleted`);
    } catch { toast.error('Failed to delete product'); }
  };

  const handleSave = async (data, isEdit) => {
    try {
      if (isEdit) {
        const res = await productAPI.update(editProduct._id, data);
        setProducts(prev => prev.map(p => p._id === editProduct._id ? res.data.product : p));
        toast.success('Product updated!');
        setEditProduct(null);
        setActiveTab('products');
      } else {
        const res = await productAPI.create(data);
        setProducts(prev => [...prev, res.data.product]);
        toast.success('Product added!');
        setActiveTab('products');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save product'); }
  };

  const handleEdit = (product) => { setEditProduct(product); setActiveTab('add'); };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen" style={{ background: '#fef3e0' }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#2d1a00,#3d1c00)', borderBottom: '1px solid rgba(224,112,0,0.2)' }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-white/60 hover:text-white text-sm transition-colors">← Back to Site</Link>
          <span className="text-white/20">|</span>
          <span className="font-serif font-black text-white text-lg">Admin Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
            {user.name?.charAt(0)}
          </div>
          <span className="text-white/70 text-sm hidden sm:block">{user.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
          {/* Sidebar */}
          <div className="bg-white rounded-2xl overflow-hidden lg:sticky lg:top-20"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'rgba(224,112,0,0.1)', background: 'linear-gradient(135deg,#fff0d6,#fffdf7)' }}>
              <div className="font-bold text-brown-dark text-sm">🍛 Namdev Chiwada</div>
              <div className="text-xs text-brown-mid/60">Admin Dashboard</div>
            </div>
            <div className="p-2">
              {TABS.map(tab => (
                <button key={tab.id}
                  onClick={() => { setActiveTab(tab.id); if (tab.id !== 'add') setEditProduct(null); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${activeTab === tab.id ? 'text-white' : 'text-brown-dark hover:bg-saffron/6 hover:text-saffron'}`}
                  style={activeTab === tab.id ? { background: 'linear-gradient(135deg,#e07000,#ff9010)' } : {}}>
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'products' && (
                    <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#fef3e0', color: activeTab === tab.id ? '#fff' : '#e07000' }}>
                      {products.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl p-6"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)', minHeight: '500px' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}>
                {activeTab === 'dashboard' && <DashboardTab products={products} orders={orders} />}
                {activeTab === 'products' && <ProductsTab products={products} onDelete={handleDelete} onEdit={handleEdit} loading={loading} />}
                {activeTab === 'add' && <ProductFormTab editProduct={editProduct} onSave={handleSave} onCancel={() => { setEditProduct(null); setActiveTab('products'); }} />}
                {activeTab === 'orders' && <OrdersTab />}
                {activeTab === 'promos' && <PromoCodesTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
