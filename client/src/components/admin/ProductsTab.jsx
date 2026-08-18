import { useState } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────
// ProductsTab — same list-based layout as before (kept — it already
// worked reasonably on mobile), with: search input full-width on
// mobile instead of a cramped fixed w-48, action buttons given an
// explicit 40px+ height and allowed to grow full-width on narrow
// screens instead of squeezing next to the text column.
// ─────────────────────────────────────────────
export default function ProductsTab({ products, onDelete, onEdit, loading }) {
  const [search, setSearch] = useState('');
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <h2 className="font-serif font-black text-brown-dark text-2xl">
          Products <span className="text-lg text-brown-mid/50 font-normal">({products.length})</span>
        </h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="form-input py-2.5 px-4 rounded-full text-sm w-full sm:w-56"
        />
      </div>
      <div className="space-y-3">
        {filtered.map((p) => (
          <motion.div
            key={p._id}
            layout
            className="bg-white rounded-2xl p-4 flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap"
            style={{ boxShadow: '0 2px 12px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}
          >
            <img src={p.img} alt={p.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-[140px]">
              <div className="font-serif font-bold text-brown-dark">{p.name}</div>
              <div className="text-xs text-brown-mid/60 mt-0.5">₹{p.price} · {p.category} · ⭐{p.rating} ({p.reviews})</div>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {p.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Featured</span>}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {p.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={() => onEdit(p)}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{ background: '#fef3e0', color: '#e07000', border: '1px solid rgba(224,112,0,0.2)', minHeight: 40 }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => onDelete(p._id, p.name)}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', minHeight: 40 }}
              >
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