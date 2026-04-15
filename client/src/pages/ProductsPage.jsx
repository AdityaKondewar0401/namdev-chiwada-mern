import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';
import { ProductSkeleton } from '../components/Skeletons';

const SORTS = [
  { value: 'popular',    label: 'Most Popular' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Highest Rated' },
];

function ProductCard({ product, index }) {
  const [selectedSize, setSelectedSize] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const sizes = product.sizes || [{ weight: product.weight, price: product.price }];

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(
      { _id: product._id, name: product.name, img: product.img },
      sizes[selectedSize].weight,
      sizes[selectedSize].price
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onClick={() => navigate(`/products/${product._id}`)}
      className="bg-white rounded-3xl overflow-hidden flex flex-col cursor-pointer group"
      style={{ boxShadow: '0 4px 24px rgba(45,26,0,0.08)' }}
      whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(224,112,0,0.15)' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img src={product.img} alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

        {!product.inStock && (
  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-t-3xl">
    <span className="px-4 py-2 rounded-full text-sm font-bold text-white bg-gray-700">
      Out of Stock
    </span>
  </div>
)}
{product.badge && product.inStock && (
  <div className="absolute top-3 left-3">
    <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
      style={{ background: product.badgeColor || '#e07000' }}>
      {product.badge}
    </span>
  </div>
)}

        <button onClick={(e) => { e.stopPropagation(); setWishlisted(!wishlisted); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          style={{ color: wishlisted ? '#e53e3e' : '#a07050' }}>
          {wishlisted ? '♥' : '♡'}
        </button>

        {product.namMarathi && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
            style={{ background: 'linear-gradient(to top,rgba(45,26,0,0.65),transparent)' }}>
            <span style={{ fontFamily: "'Gotu',sans-serif", color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
              {product.namMarathi}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pt-4 pb-5 flex flex-col flex-1">
        {product.tag && (
          <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#e07000' }}>
            {product.tag}
          </div>
        )}

        <h3 className="font-serif font-black text-brown-dark text-xl leading-tight mb-1">
          {product.name}
        </h3>

        {product.intro && (
          <p className="text-xs text-brown-mid/60 mb-3">{product.intro}</p>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-sm"
                style={{ color: i < Math.floor(product.rating) ? '#f59e0b' : '#d1d5db' }}>★</span>
            ))}
          </div>
          <span className="text-xs text-brown-mid/60">({product.reviews})</span>
        </div>

        {/* Size */}
        <div className="mb-4" onClick={(e) => e.stopPropagation()}>
          <div className="text-xs font-bold uppercase tracking-wider text-brown-dark mb-2">Net Weight</div>
          <div className="flex gap-2 flex-wrap">
            {sizes.map((size, i) => (
              <button key={i}
                onClick={(e) => { e.stopPropagation(); setSelectedSize(i); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                style={{
                  background: selectedSize === i ? '#e07000' : 'transparent',
                  borderColor: selectedSize === i ? '#e07000' : 'rgba(224,112,0,0.3)',
                  color: selectedSize === i ? '#fff' : '#e07000',
                }}>
                {size.weight}
              </button>
            ))}
          </div>
        </div>

        {/* Price + Cart */}
        <div className="flex items-center gap-3 mt-auto" onClick={(e) => e.stopPropagation()}>
          <div>
            <div className="text-2xl font-black" style={{ color: '#e07000' }}>
              ₹{sizes[selectedSize].price}
            </div>
            <div className="text-xs text-brown-mid/50">MRP incl. of all taxes</div>
          </div>
          <button
  onClick={handleAddToCart}
  disabled={!product.inStock}
  className="flex-1 py-3 rounded-full font-bold text-sm text-white transition-all disabled:cursor-not-allowed"
  style={{
    background: !product.inStock
      ? '#9ca3af'
      : addedToCart
        ? 'linear-gradient(135deg,#2d5a1b,#4a9a2e)'
        : 'linear-gradient(135deg,#e07000,#ff9010)',
    opacity: !product.inStock ? 0.7 : 1,
  }}>
  {!product.inStock ? '❌ Out of Stock' : addedToCart ? '✓ Added!' : '🛒 Add to Cart'}
</button>
        </div>
      </div>

      <div className="h-1 w-full"
        style={{ background: `linear-gradient(90deg,${product.badgeColor || '#e07000'},transparent)` }} />
    </motion.div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'popular');

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = { sort };
    if (search) params.search = search;

    productAPI.getAll(params)
      .then((res) => {
        setProducts(res.data.products || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
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

          {/* Search */}
          <form onSubmit={(e) => { e.preventDefault(); fetchProducts(); }}
            className="flex gap-2 max-w-md mx-auto">
            <input type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chiwada, bakarvadi..."
              className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/25 text-white placeholder-white/50 outline-none focus:border-white/60 text-sm" />
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
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-24">
              <div className="text-5xl mb-4">🔍</div>
              <div className="font-serif font-bold text-brown-dark text-xl mb-2">
                No products found
              </div>
              <div className="text-brown-mid/60 mb-6">Try a different search term</div>
              <button onClick={() => setSearch('')}
                className="btn-saffron px-6 py-2.5 text-sm">
                Clear Search
              </button>
            </motion.div>
          ) : (
            <motion.div key={sort + search}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}