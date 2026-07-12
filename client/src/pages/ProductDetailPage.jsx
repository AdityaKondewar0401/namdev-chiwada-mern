import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { DetailSkeleton } from '../components/Skeletons';
import PageWrapper from '../components/PageWrapper';

const TABS = ['Ingredients', 'Nutrition', 'Info'];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  const [product, setProduct]           = useState(null);
  const [related, setRelated]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [qty, setQty]                   = useState(1);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [mainImg, setMainImg]           = useState('');
  const [activeTab, setActiveTab]       = useState('Ingredients');
  const [added, setAdded]               = useState(false);

  useEffect(() => {
    setLoading(true);
    productAPI.getOne(id)
      .then((res) => {
        const p = res.data.product;
        setProduct(p);
        setMainImg(p.img);
        setSelectedSizeIdx(Math.min(1, (p.sizes?.length || 1) - 1));
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!product) return;
    productAPI.getAll({ limit: 4 })
      .then((res) => setRelated((res.data.products || []).filter((p) => p._id !== id).slice(0, 3)))
      .catch(() => {});
  }, [product, id]);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-8 min-h-screen">
      <DetailSkeleton />
    </div>
  );
  if (!product) return null;

  const currentSize = product.sizes?.[selectedSizeIdx] || { weight: product.weight, price: product.price };
  const wishlisted  = isWishlisted(product._id);
  const thumbs      = [product.img, ...(product.images || [])];

  const handleAddToCart = () => {
    addToCart(product, currentSize.weight, currentSize.price, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - currentSize.price) / product.originalPrice) * 100)
    : null;

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream">

        {/* ── Top bar: breadcrumb + back ─────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-1.5 text-xs text-brown-mid/50">
              <Link to="/" className="hover:text-saffron transition-colors">Home</Link>
              <span>›</span>
              <Link to="/products" className="hover:text-saffron transition-colors">Products</Link>
              <span>›</span>
              <span className="text-brown-dark font-medium truncate max-w-32">{product.name}</span>
            </nav>
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs text-brown-mid hover:text-saffron transition-colors font-semibold">
              ← Back
            </button>
          </div>
        </div>

        {/* ── Main content ───────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-start">

            {/* ════════════════════════════
                LEFT — Gallery
                ════════════════════════════ */}
            <div className="md:sticky md:top-20">
              {/* Main image */}
              <motion.div
                key={mainImg}
                initial={{ opacity: 0.6, scale: 0.97 }}
                animate={{ opacity: 1,   scale: 1 }}
                transition={{ duration: 0.28 }}
                className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-cream-mid to-white shadow-saffron"
                style={{ aspectRatio: '1/1' }}   /* square — shows full packet */
              >
                {/* Badge */}
                {product.badge && (
                  <span className="absolute top-3 left-3 z-10 text-xs font-bold px-2.5 py-1 rounded-full text-white shadow"
                    style={{ background: product.badgeColor || '#e07000' }}>
                    {product.badge}
                  </span>
                )}
                {/* Wishlist */}
                <button onClick={() => toggle(product._id)}
                  className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center text-lg shadow transition-all
                    ${wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 text-brown-mid hover:text-red-400'}`}>
                  {wishlisted ? '♥' : '♡'}
                </button>
                <img src={mainImg} alt={product.name}
                  className="w-full h-full object-contain p-4 transition-transform duration-300 hover:scale-105" />
              </motion.div>

              {/* Thumbnails */}
              {thumbs.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {thumbs.map((img, i) => (
                    <button key={i} onClick={() => setMainImg(img)}
                      className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all
                        ${mainImg === img ? 'border-saffron shadow-saffron scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-contain bg-cream-mid p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ════════════════════════════
                RIGHT — Product Info
                ════════════════════════════ */}
            <div className="flex flex-col gap-4">

              {/* Tag + Name + Rating */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold tracking-widest uppercase text-saffron">{product.sub}</span>
                  {product.tag && (
                    <span className="text-xs bg-saffron/10 text-saffron font-semibold px-2 py-0.5 rounded-full">
                      {product.tag}
                    </span>
                  )}
                </div>
                <h1 className="font-serif font-black text-brown-dark leading-tight"
                  style={{ fontSize: 'clamp(1.5rem,3vw,2rem)' }}>
                  {product.name}
                </h1>
                {product.namMarathi && (
                  <div className="text-sm text-brown-mid/60 mt-0.5" style={{ fontFamily: "'Gotu', sans-serif" }}>
                    {product.namMarathi}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-amber-400 text-base tracking-tight">
                    {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
                  </span>
                  <span className="text-xs text-brown-mid/50">{product.rating} · {product.reviews} reviews</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3 py-3 border-y border-saffron/10">
                <span className="font-black text-saffron" style={{ fontSize: '2rem' }}>
                  ₹{currentSize.price}
                </span>
                {product.originalPrice && (
                  <span className="text-brown-mid/40 line-through text-base mb-1">₹{product.originalPrice}</span>
                )}
                {discount && (
                  <span className="mb-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {discount}% OFF
                  </span>
                )}
                <span className="text-brown-mid/50 text-sm mb-1">/ {currentSize.weight}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-brown-dark/65 leading-relaxed">{product.desc}</p>

              {/* Size selector */}
              {product.sizes?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-brown-dark mb-2">Select Size</div>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((s, i) => (
                      <button key={i} onClick={() => setSelectedSizeIdx(i)}
                        className={`px-3.5 py-1.5 rounded-full border-2 text-sm font-semibold transition-all ${
                          selectedSizeIdx === i
                            ? 'bg-saffron border-saffron text-white shadow-saffron'
                            : 'border-saffron/25 text-brown-dark hover:border-saffron bg-white'
                        }`}>
                        {s.weight} — ₹{s.price}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Qty + Add to Cart */}
              <div className="flex items-center gap-3">
                {/* Qty */}
                <div className="flex items-center gap-1 bg-white border border-saffron/20 rounded-full px-1 py-1 shadow-sm">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-full border border-saffron/30 text-saffron font-bold flex items-center justify-center hover:bg-saffron hover:text-white transition-all text-lg">
                    −
                  </button>
                  <span className="font-bold text-brown-dark w-7 text-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)}
                    className="w-8 h-8 rounded-full border border-saffron/30 text-saffron font-bold flex items-center justify-center hover:bg-saffron hover:text-white transition-all text-lg">
                    +
                  </button>
                </div>

                {/* Add to Cart */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 py-3 rounded-full font-bold text-white text-sm transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: !product.inStock ? '#9ca3af' : added ? '#16a34a' : 'linear-gradient(135deg,#e07000,#ff9010)',
                    boxShadow: product.inStock ? '0 4px 16px rgba(224,112,0,0.28)' : 'none',
                    transition: 'background 0.3s ease',
                  }}>
                  <AnimatePresence mode="wait">
                    <motion.span key={added ? 'added' : 'add'}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}>
                      {!product.inStock ? '❌ Out of Stock' : added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </div>

              {/* Trust strip */}
              <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-white rounded-xl border border-saffron/10 shadow-sm">
                {[
                  { icon: '🚚', text: 'Free delivery ≥₹500' },
                  { icon: '✅', text: '100% Authentic' },
                  { icon: '↩️', text: 'Easy Returns' },
                ].map((t) => (
                  <div key={t.text} className="flex flex-col items-center gap-0.5 text-center">
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-xs text-brown-mid/70 font-medium leading-tight">{t.text}</span>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div>
                <div className="flex gap-1 border-b-2 border-saffron/10 mb-3">
                  {TABS.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg border-b-2 transition-all -mb-px ${
                        activeTab === tab
                          ? 'text-saffron border-saffron bg-saffron/5'
                          : 'text-brown-mid/50 border-transparent hover:text-saffron'
                      }`}>
                      {tab}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={activeTab}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-20">
                    {activeTab === 'Ingredients' && (
                      <div className="flex flex-wrap gap-1.5">
                        {(product.ingredients || []).map((ing) => (
                          <span key={ing} className="px-3 py-1 rounded-full text-xs text-brown-dark bg-cream-mid border border-saffron/15 font-medium">
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}
                    {activeTab === 'Nutrition' && (
                      <table className="w-full text-xs">
                        <tbody>
                          {(product.nutrition || []).map(([label, val]) => (
                            <tr key={label} className="border-b border-saffron/8">
                              <td className="py-2 text-brown-mid/70 font-medium">{label}</td>
                              <td className="py-2 font-bold text-brown-dark text-right">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {activeTab === 'Info' && (
                      <p className="text-xs text-brown-dark/70 leading-relaxed">{product.info}</p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          </div>

          {/* ── Related Products ─────────────────────────────────── */}
          {related.length > 0 && (
            <div className="mt-14 pt-10 border-t border-saffron/10">
              <div className="mb-6">
                <div className="section-eyebrow">You May Also Like</div>
                <h3 className="font-serif font-bold text-brown-dark text-xl">Related Products</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}