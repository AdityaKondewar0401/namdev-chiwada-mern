import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI } from '../services/api';
import { ProductSkeleton } from '../components/Skeletons';
import ProductCard from '../components/ProductCard';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import { buildBreadcrumbSchema } from '../utils/structuredData';
import { SITE_NAME } from '../config/seo.config';

const BREADCRUMB_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
];

const SORTS = [
  { value: 'popular',    label: 'Most Popular' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Highest Rated' },
];

// ── Sort dropdown — custom popover instead of a native <select>, which
// mobile browsers render as their own full-width OS picker sheet.
// ─────────────────────────────────────────────────────
function SortDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="form-input py-2 pl-4 pr-3 rounded-full text-sm w-auto cursor-pointer flex items-center gap-2"
      >
        {selected?.label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15 }}
          role="listbox"
          className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-30 bg-white"
          style={{ boxShadow: '0 12px 32px rgba(45,26,0,0.15)', border: '1px solid rgba(224,112,0,0.1)' }}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors"
                style={active
                  ? { background: '#fff0d6', color: '#e07000', fontWeight: 700 }
                  : { color: '#3d2800' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#fef3e0'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {o.label}
                {active && <span>✓</span>}
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

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
      <SEO
        title={`Chiwada & Maharashtrian Snacks | ${SITE_NAME}`}
        description={`Shop authentic Solapuri Chiwada and Bakarwadi from ${SITE_NAME} — freshly made and delivered across Maharashtra.`}
        canonical="/products"
        jsonLd={buildBreadcrumbSchema(BREADCRUMB_ITEMS)}
      />
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <div className="pt-16 pb-10 px-6 text-center"
          style={{ background: 'linear-gradient(135deg,#3d1c00 0%,#7a3300 60%,#e07000 100%)' }}>
          <div className="max-w-3xl mx-auto">
            <Breadcrumbs items={BREADCRUMB_ITEMS} dark className="justify-center mb-3" />
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
                placeholder="Search chiwda, bakarwadi..."
                className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/25 text-white placeholder-white/50 outline-none focus:border-white/60 text-sm"
              />
              <button type="submit"
                className="px-5 py-3 rounded-full font-semibold text-sm hover:-translate-y-0.5 transition-all"
                style={{ background: 'linear-gradient(135deg,#d4af37,#f0cc5a)', color: '#2d1a00' }}>
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-5 text-xs text-white/50">
              <span>Looking for something specific?</span>
              <Link to="/chiwada" className="text-white/80 hover:text-white underline underline-offset-2 transition-colors">Chiwada</Link>
              <Link to="/solapuri-chiwada" className="text-white/80 hover:text-white underline underline-offset-2 transition-colors">Solapuri Chiwada</Link>
              <Link to="/maharashtrian-snacks" className="text-white/80 hover:text-white underline underline-offset-2 transition-colors">Maharashtrian Snacks</Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Sort + Count */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <span className="text-sm text-brown-mid/60">
              {total} product{total !== 1 ? 's' : ''} found
            </span>
            <SortDropdown value={sort} onChange={setSort} options={SORTS} />
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
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
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
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