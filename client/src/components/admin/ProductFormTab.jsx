import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CATEGORIES } from './adminConstants';

// ─────────────────────────────────────────────
// ProductFormTab — unchanged logic/fields from the original, moved
// into its own file. All upload/save behavior is exactly as before.
// ─────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', namMarathi: '', sub: '', intro: '', desc: '',
  category: 'mild', tag: '', badge: '', badgeColor: '#e07000',
  price: '', originalPrice: '', weight: '250g', img: '', images: '',
  rating: 4.5, reviews: 0, featured: false, inStock: true, info: '',
  ingredients: '', sizes: '250g:180,500g:340', partnerDiscountPercent: 30,
};

const Field = ({ label, fieldKey, type = 'text', placeholder = '', hint = '', form, onChange }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">{label}</label>
    <input
      type={type}
      value={form[fieldKey] || ''}
      onChange={(e) => onChange(fieldKey, e.target.value)}
      placeholder={placeholder}
      className="form-input text-sm"
    />
    {hint && <p className="text-xs text-brown-mid/40 mt-1">{hint}</p>}
  </div>
);

export default function ProductFormTab({ editProduct, onSave, onCancel }) {
  const [form, setForm] = useState(editProduct ? {
    ...editProduct,
    images: editProduct.images?.join(',') || '',
    ingredients: editProduct.ingredients?.join(',') || '',
    sizes: editProduct.sizes?.map((s) => `${s.weight}:${s.price}`).join(',') || '',
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingMultiple, setUploadingMultiple] = useState(false);
  const [uploadedImages, setUploadedImages] = useState(editProduct?.images || []);

  const f = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleMainImageUpload = async (file) => {
    if (!file) return;
    setUploadingMain(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        f('img', res.data.url);
        toast.success('Main image uploaded! ✅');
      } else {
        toast.error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Check Cloudinary env vars on Render.');
    } finally {
      setUploadingMain(false);
    }
  };

  const handleMultipleImagesUpload = async (files) => {
    if (!files.length) return;
    setUploadingMultiple(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      const res = await api.post('/api/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        const urls = res.data.images.map((img) => img.url);
        const allUrls = [...uploadedImages, ...urls];
        setUploadedImages(allUrls);
        f('images', allUrls.join(','));
        toast.success(`${urls.length} images uploaded! ✅`);
      } else {
        toast.error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Check Cloudinary env vars on Render.');
    } finally {
      setUploadingMultiple(false);
    }
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
      const sizes = form.sizes.split(',').map((s) => {
        const [weight, price] = s.trim().split(':');
        return { weight: weight?.trim(), price: Number(price) };
      }).filter((s) => s.weight && s.price);

      const images = form.images
        ? form.images.split(',').map((i) => i.trim()).filter(Boolean)
        : [form.img];

      const ingredients = form.ingredients
        ? form.ingredients.split(',').map((i) => i.trim()).filter(Boolean)
        : [];

      const data = {
        ...form, sizes, images, ingredients,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || undefined,
        rating: Number(form.rating),
        reviews: Number(form.reviews),
        partnerDiscountPercent: Number(form.partnerDiscountPercent) || 30,
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
            <Field label="Product Name *" fieldKey="name" placeholder="Namdev Chiwda" form={form} onChange={f} />
            <Field label="Marathi Name" fieldKey="namMarathi" placeholder="नामदेव चिवडा" form={form} onChange={f} />
            <Field label="Sub Title" fieldKey="sub" placeholder="House Signature Blend" form={form} onChange={f} />
            <Field label="Short Intro" fieldKey="intro" placeholder="1-line card description" form={form} onChange={f} />
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Full Description *</label>
              <textarea value={form.desc || ''} onChange={(e) => f('desc', e.target.value)}
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
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">
                Partner Discount % <span className="normal-case font-normal text-brown-mid/40">(wholesale rate)</span>
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={form.partnerDiscountPercent ?? 30}
                onChange={(e) => f('partnerDiscountPercent', e.target.value)}
                placeholder="30"
                className="form-input text-sm"
              />
              <p className="text-xs text-brown-mid/40 mt-1">
                % off retail a partner sees, e.g. 30 = partner pays 70% of listed price
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Category *</label>
              <select value={form.category} onChange={(e) => f('category', e.target.value)} className="form-input text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Sizes (weight:price)</label>
              <input value={form.sizes || ''} onChange={(e) => f('sizes', e.target.value)}
                placeholder="250g:180,500g:340,1kg:640" className="form-input text-sm" />
              <p className="text-xs text-brown-mid/40 mt-1">Format: 250g:180,500g:340</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-1.5">Rating</label>
              <input type="number" min="0" max="5" step="0.1"
                value={form.rating} onChange={(e) => f('rating', e.target.value)} className="form-input text-sm" />
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
                <input type="color" value={form.badgeColor || '#e07000'} onChange={(e) => f('badgeColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                <input value={form.badgeColor || '#e07000'} onChange={(e) => f('badgeColor', e.target.value)} className="form-input text-sm flex-1" />
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
                  onChange={(e) => handleMainImageUpload(e.target.files[0])} />
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
              <input value={form.img || ''} onChange={(e) => f('img', e.target.value)}
                placeholder="https://res.cloudinary.com/..." className="form-input text-sm mt-3" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-mid/70 mb-2">Additional Images (Gallery)</label>
              <div onClick={() => document.getElementById('multipleImagesInput').click()}
                className="border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all hover:border-saffron hover:bg-saffron/5"
                style={{ borderColor: uploadingMultiple ? '#e07000' : 'rgba(224,112,0,0.2)' }}>
                <input id="multipleImagesInput" type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => handleMultipleImagesUpload(Array.from(e.target.files))} />
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
              <input value={form.images || ''} onChange={(e) => f('images', e.target.value)}
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
              <input value={form.ingredients || ''} onChange={(e) => f('ingredients', e.target.value)}
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
