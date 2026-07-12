import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { DetailSkeleton } from '../components/Skeletons';
import PageWrapper from '../components/PageWrapper';

const TABS = ['Ingredients', 'Nutrition', 'Info'];

/* Heritage palette accents — layered on top of the existing brand tokens
   (cream / brown / saffron) without touching the tailwind config. */
const GOLD = '#B8862E';
const GOLD_SOFT = 'rgba(184,134,46,0.18)';
const MAROON = '#6E1E27';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  const [product, setProduct]                 = useState(null);
  const [related, setRelated]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [qty, setQty]                         = useState(1);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [mainImg, setMainImg]                 = useState('');
  const [activeTab, setActiveTab]             = useState('Ingredients');
  const [added, setAdded]                     = useState(false);
  const [zoomOrigin, setZoomOrigin]           = useState('50% 50%');
  const [isZooming, setIsZooming]             = useState(false);
  const [mobileIdx, setMobileIdx]             = useState(0);
  const [stickyVisible, setStickyVisible]     = useState(true);

  const mobileScrollRef = useRef(null);

  // Hide the sticky "Add to Cart" bar once the person scrolls near the
  // bottom of the page (footer territory) so it never sits on top of
  // contact info / copyright text. Reappears if they scroll back up.
  useEffect(() => {
    const onScroll = () => {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 420;
      setStickyVisible(!scrolledToBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const handleMobileScroll = () => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setMobileIdx(idx);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream">

        {/* ── Top bar: breadcrumb + back (desktop only — mobile gets a floating bar over the image) ── */}
        <div className="hidden lg:block max-w-7xl mx-auto px-6 xl:px-10 pt-5 pb-1">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-1.5 text-xs text-brown-mid/50">
              <Link to="/" className="hover:text-saffron transition-colors">Home</Link>
              <span>›</span>
              <Link to="/products" className="hover:text-saffron transition-colors">Products</Link>
              <span>›</span>
              <span className="text-brown-dark font-medium truncate max-w-48">{product.name}</span>
            </nav>
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs text-brown-mid hover:text-saffron transition-colors font-semibold">
              ← Back
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            MOBILE — full-bleed hero carousel, floating nav, sheet below
            ════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden">
          <div className="relative">
            {/* Floating top bar over the image */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
              <button onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm shadow flex items-center justify-center text-brown-dark text-lg">
                ←
              </button>
              <button onClick={() => toggle(product._id)}
                className={`w-9 h-9 rounded-full backdrop-blur-sm shadow flex items-center justify-center text-lg transition-all
                  ${wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/85 text-brown-mid'}`}>
                {wishlisted ? '♥' : '♡'}
              </button>
            </div>

            {/* Swipeable image carousel — solid, opaque background so nothing behind it ever shows through */}
            <div
              ref={mobileScrollRef}
              onScroll={handleMobileScroll}
              className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
              style={{ scrollbarWidth: 'none', backgroundColor: '#DEDAD2' }}
            >
              {thumbs.map((img, i) => (
                <div key={i}
                  className="relative flex-shrink-0 w-full snap-center"
                  style={{ aspectRatio: '1/1', backgroundColor: '#DEDAD2' }}>
                  {i === 0 && product.badge && (
                    <span className="absolute top-16 left-4 z-10 text-[11px] font-bold px-2.5 py-1 rounded-full text-white shadow-md tracking-wide"
                      style={{ background: product.badgeColor || '#e07000' }}>
                      {product.badge}
                    </span>
                  )}
                  <img src={img} alt={product.name}
                    className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Dot indicators */}
            {thumbs.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {thumbs.map((_, i) => (
                  <span key={i}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === mobileIdx ? '18px' : '6px',
                      background: i === mobileIdx ? GOLD : 'rgba(110,30,39,0.25)',
                    }} />
                ))}
              </div>
            )}
          </div>

          {/* Overlapping sheet */}
          <div className="relative -mt-6 rounded-t-[28px] bg-white shadow-[0_-8px_24px_rgba(58,35,23,0.08)] px-5 pt-6 pb-28">
            <MobileHandle />
            <ProductInfo
              product={product} currentSize={currentSize} discount={discount}
              selectedSizeIdx={selectedSizeIdx} setSelectedSizeIdx={setSelectedSizeIdx}
              activeTab={activeTab} setActiveTab={setActiveTab}
            />
          </div>

          {/* Sticky bottom action bar — hides itself near the footer */}
          <motion.div
            initial={false}
            animate={{ y: stickyVisible ? 0 : '120%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-saffron/10 px-4 py-3"
            style={{ boxShadow: '0 -6px 20px rgba(58,35,23,0.10)' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-cream-mid rounded-full px-1 py-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 rounded-full text-saffron font-bold flex items-center justify-center text-lg">−</button>
                <span className="font-bold text-brown-dark w-6 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 rounded-full text-saffron font-bold flex items-center justify-center text-lg">+</button>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 py-3 rounded-full font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{
                  background: !product.inStock ? '#9ca3af' : added ? '#16a34a' : `linear-gradient(135deg,${MAROON},#c0392b)`,
                  boxShadow: product.inStock ? `0 6px 18px rgba(110,30,39,0.30)` : 'none',
                }}>
                <span>₹{currentSize.price * qty}</span>
                <span className="opacity-60">·</span>
                <span>{!product.inStock ? 'Out of Stock' : added ? 'Added ✓' : 'Add to Cart'}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            DESKTOP — heritage spotlight gallery + refined info column
            ════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block max-w-7xl mx-auto px-6 xl:px-10 pb-16">
          <div className="grid grid-cols-[72px_1fr] xl:grid-cols-[84px_1fr] gap-5 items-start">

            {/* Vertical film-strip thumbnails */}
            <div className="sticky top-24 flex flex-col gap-3">
              {thumbs.map((img, i) => (
                <button key={i} onClick={() => setMainImg(img)}
                  className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                    mainImg === img ? 'ring-2 shadow-md' : 'ring-1 ring-brown-dark/5 opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    aspectRatio: '1/1',
                    ...(mainImg === img ? { boxShadow: `0 0 0 2px ${GOLD}` } : {}),
                  }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Gallery stage + info, side by side */}
            <div className="grid grid-cols-2 gap-10 xl:gap-14 items-start">

              {/* Spotlight stage */}
              <div className="sticky top-24">
                <div
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  className="relative rounded-[28px] overflow-hidden cursor-zoom-in"
                  style={{
                    aspectRatio: '1/1',
                    background: `radial-gradient(circle at 50% 38%, ${GOLD_SOFT}, transparent 60%), linear-gradient(180deg,#FBF6EC 0%, #F2E9D8 100%)`,
                    boxShadow: '0 18px 40px -12px rgba(58,35,23,0.18), inset 0 0 0 1px rgba(184,134,46,0.14)',
                  }}
                >
                  {product.badge && (
                    <span className="absolute top-4 left-4 z-10 text-xs font-bold px-3 py-1 rounded-full text-white shadow-md tracking-wide"
                      style={{ background: product.badgeColor || '#e07000' }}>
                      {product.badge}
                    </span>
                  )}
                  <button onClick={() => toggle(product._id)}
                    className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md transition-all
                      ${wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/85 text-brown-mid hover:text-red-400'}`}>
                    {wishlisted ? '♥' : '♡'}
                  </button>

                  <motion.img
                    key={mainImg}
                    src={mainImg} alt={product.name}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover transition-transform duration-200 ease-out"
                    style={{
                      transformOrigin: zoomOrigin,
                      transform: isZooming ? 'scale(1.35)' : 'scale(1.06)',
                    }}
                  />

                  {/* Heritage plate */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm"
                      style={{ color: MAROON }}>
                      Solapur · Since 1873
                    </span>
                  </div>
                </div>
                <p className="text-center text-xs text-brown-mid/40 mt-3 italic">Hover to inspect the craft</p>
              </div>

              {/* Info column */}
              <div>
                <ProductInfo
                  product={product} currentSize={currentSize} discount={discount}
                  selectedSizeIdx={selectedSizeIdx} setSelectedSizeIdx={setSelectedSizeIdx}
                  activeTab={activeTab} setActiveTab={setActiveTab}
                />

                {/* Qty + Add to Cart (desktop) */}
                <div className="flex items-center gap-3 mt-5">
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

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ y: -1 }}
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className="flex-1 py-3.5 rounded-full font-bold text-white text-sm transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      background: !product.inStock ? '#9ca3af' : added ? '#16a34a' : `linear-gradient(135deg,${MAROON},#c0392b)`,
                      boxShadow: product.inStock ? `0 8px 22px -4px rgba(110,30,39,0.38)` : 'none',
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
              </div>
            </div>
          </div>

          {/* ── Related Products ─────────────────────────────────── */}
          {related.length > 0 && (
            <div className="mt-16 pt-10 border-t border-saffron/10">
              <div className="mb-6">
                <div className="section-eyebrow">You May Also Like</div>
                <h3 className="font-serif font-bold text-brown-dark text-xl">Related Products</h3>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
            </div>
          )}
        </div>

        {/* Related products — mobile */}
        {related.length > 0 && (
          <div className="lg:hidden px-5 pb-10">
            <div className="mb-5">
              <div className="section-eyebrow">You May Also Like</div>
              <h3 className="font-serif font-bold text-brown-dark text-lg">Related Products</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

/* Small drag handle shown at the top of the mobile bottom sheet */
function MobileHandle() {
  return <div className="w-10 h-1 rounded-full bg-brown-dark/10 mx-auto mb-5" />;
}

/* Shared info block: tag/name/rating, price, description, size selector, trust strip, tabs.
   Used by both the desktop info column and the mobile sheet — kept identical so the two
   surfaces never drift out of sync. */
function ProductInfo({ product, currentSize, discount, selectedSizeIdx, setSelectedSizeIdx, activeTab, setActiveTab }) {
  return (
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
          style={{ fontSize: 'clamp(1.5rem,3vw,2.1rem)' }}>
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

      {/* Trust strip */}
      <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-cream-mid/60 rounded-xl border border-saffron/10">
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
  );
}
