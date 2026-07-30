import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI } from '../services/api';
import { ProductSkeleton } from '../components/Skeletons';
import ProductCard from '../components/ProductCard';
import PageWrapper from '../components/PageWrapper';

const SORTS = [
  { value: 'popular',    label: 'Most Popular' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Highest Rated' },
];

// ── Page ───────────────────────────────────────────────
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'popular');

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = { sort };
    if (search) params.search = search;

    productAPI.getAll(params)
      .then((res) => {
        setProducts(res.data.products || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => setError('Failed to load products. Please try again.'))
      .finally(() => setLoading(false));
  }, [sort, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const p = {};
    if (sort !== 'popular') p.sort = sort;
    if (search) p.search = search;
    setSearchParams(p, { replace: true });
  }, [sort, search, setSearchParams]);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <div className="pt-16 pb-10 px-6 text-center"
          style={{ background: 'linear-gradient(135deg,#3d1c00 0%,#7a3300 60%,#e07000 100%)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-xs font-bold tracking-widest uppercase text-saffron-light mb-3">
              Our Collection
            </div>
            <h1 className="font-serif font-black text-white mb-3"
              style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
              All Products
            </h1>
            <p className="text-white/70 mb-8">
              Authentic Maharashtrian snacks, crafted fresh daily in Solapur
            </p>
            <form onSubmit={(e) => { e.preventDefault(); fetchProducts(); }}
              className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chiwda, bakarvadi..."
                className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/25 text-white placeholder-white/50 outline-none focus:border-white/60 text-sm"
              />
              <button type="submit"
                className="px-5 py-3 rounded-full font-semibold text-sm hover:-translate-y-0.5 transition-all"
                style={{ background: 'linear-gradient(135deg,#d4af37,#f0cc5a)', color: '#2d1a00' }}>
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Sort + Count */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <span className="text-sm text-brown-mid/60">
              {total} product{total !== 1 ? 's' : ''} found
            </span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="form-input py-2 px-4 rounded-full text-sm w-auto cursor-pointer">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">⚠️</div>
              <div className="font-serif font-bold text-brown-dark text-xl mb-2">Could not load products</div>
              <div className="text-brown-mid/60 mb-6 text-sm">{error}</div>
              <button onClick={fetchProducts}
                className="px-6 py-2.5 rounded-full font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
                Try Again
              </button>
            </div>
          )}

          {/* Grid */}
          {!error && (
            <AnimatePresence mode="wait">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
              ) : products.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                  <div className="text-5xl mb-4">🔍</div>
                  <div className="font-serif font-bold text-brown-dark text-xl mb-2">No products found</div>
                  <div className="text-brown-mid/60 mb-6">Try a different search term</div>
                  <button onClick={() => setSearch('')}
                    className="px-6 py-2.5 rounded-full font-bold text-white text-sm"
                    style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
                    Clear Search
                  </button>
                </motion.div>
              ) : (
                <motion.div key={sort + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p, i) => (
                    <ProductCard key={p._id} product={p} index={i} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}