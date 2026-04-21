import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';
import { ProductSkeleton } from '../components/Skeletons';

const SORTS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Highest Rated' },
];

function ProductCard({ product, index }) {
  const [selectedSize, setSelectedSize] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  const sizes =
    product.sizes || [{ weight: product.weight, price: product.price }];

  const handleAddToCart = (e) => {
    e.stopPropagation();

    addToCart(
      {
        _id: product._id,
        name: product.name,
        img: product.img,
      },
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
      whileHover={{
        y: -6,
        boxShadow: '0 20px 50px rgba(224,112,0,0.15)',
      }}
    >
      {/* IMAGE */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-t-3xl">
            <span className="px-4 py-2 rounded-full text-sm font-bold text-white bg-gray-700">
              Out of Stock
            </span>
          </div>
        )}

        {product.badge && product.inStock && (
          <div className="absolute top-3 left-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{
                background: product.badgeColor || '#e07000',
              }}
            >
              {product.badge}
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setWishlisted(!wishlisted);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          style={{
            color: wishlisted ? '#e53e3e' : '#a07050',
          }}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </div>

      {/* CONTENT */}
      <div className="px-5 pt-4 pb-5 flex flex-col flex-1">
        <h3 className="font-serif font-black text-xl mb-2">
          {product.name}
        </h3>

        <div className="mb-4">
          <div className="text-xs font-bold mb-2">Net Weight</div>

          <div className="flex gap-2 flex-wrap">
            {sizes.map((size, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSize(i);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2"
                style={{
                  background:
                    selectedSize === i ? '#e07000' : 'transparent',
                  borderColor:
                    selectedSize === i
                      ? '#e07000'
                      : 'rgba(224,112,0,0.3)',
                  color:
                    selectedSize === i ? '#fff' : '#e07000',
                }}
              >
                {size.weight}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto">
          <div>
            <div
              className="text-2xl font-black"
              style={{ color: '#e07000' }}
            >
              ₹{sizes[selectedSize].price}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="flex-1 py-3 rounded-full font-bold text-sm text-white"
            style={{
              background: !product.inStock
                ? '#9ca3af'
                : addedToCart
                ? '#2d5a1b'
                : '#e07000',
            }}
          >
            {!product.inStock
              ? 'Out of Stock'
              : addedToCart
              ? 'Added!'
              : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);   // ✅ FIXED HERE
  const [search, setSearch] = useState(
    searchParams.get('search') || ''
  );
  const [sort, setSort] = useState(
    searchParams.get('sort') || 'popular'
  );

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = { sort };

    if (search) {
      params.search = search;
    }

    productAPI
      .getAll(params)
      .then((res) => {
        setProducts(res.data.products || []);
        setTotal(res.data.total || 0);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load products.');
      })
      .finally(() => setLoading(false));
  }, [sort, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const p = {};

    if (sort !== 'popular') p.sort = sort;
    if (search) p.search = search;

    setSearchParams(p, { replace: true });
  }, [sort, search, setSearchParams]);

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div className="flex justify-between mb-8 flex-wrap gap-3">
          <span>{total} products found</span>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          value={search}
          placeholder="Search..."
          onChange={(e) => setSearch(e.target.value)}
          className="border px-4 py-2 mb-8 w-full"
        />

        {/* ERROR */}
        {error && (
          <div className="text-red-500 mb-6">{error}</div>
        )}

        {/* PRODUCTS */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
            </div>
          ) : products.length === 0 ? (
            <div>No products found</div>
          ) : (
            <motion.div
              key={sort + search}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {products.map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}