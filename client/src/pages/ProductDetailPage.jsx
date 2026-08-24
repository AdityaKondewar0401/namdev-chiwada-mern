import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Send, ShoppingCart, Check } from 'lucide-react';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { DetailSkeleton } from '../components/Skeletons';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import { buildProductSchema, buildBreadcrumbSchema } from '../utils/structuredData';
import toast from 'react-hot-toast';

const TABS = ['Ingredients', 'Nutrition', 'Info'];

/* Heritage palette accents — layered on top of the existing brand tokens
   (cream / brown / saffron) without touching the tailwind config. */
const GOLD = '#B8862E';
const GOLD_SOFT = 'rgba(184,134,46,0.18)';
const MAROON = '#6E1E27';

/* Heart-with-plus "add to wishlist" glyph — lucide doesn't ship this as a
   single icon, so it's built by layering Heart + a small Plus badge in the
   corner. `filled` switches it to a solid red heart once the product is
   actually in the wishlist, so clicking gives clear visual feedback instead
   of just silently navigating away. */
function WishlistIcon({ size = 18, filled = false }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Heart
        size={size}
        strokeWidth={2}
        fill={filled ? 'currentColor' : 'none'}
      />
      <span
        className={`absolute flex items-center justify-center rounded-full ${filled ? 'bg-red-50' : 'bg-white'}`}
        style={{
          width: size * 0.52,
          height: size * 0.52,
          right: -size * 0.12,
          bottom: -size * 0.12,
        }}
      >
        <Plus size={size * 0.42} strokeWidth={3} />
      </span>
    </div>
  );
}

export default function ProductDetailPage() {
  // Route is /products/:slug, but the same param also has to accept a raw
  // Mongo ObjectId for backward compatibility with old links/bookmarks —
  // the backend already resolves either (see productController.getProduct).
  const { slug: routeSlug } = useParams();
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
  const relatedSentinelRef = useRef(null);

  // Broadcasts whether the mobile sticky Add-to-Cart bar is currently on
  // screen. WhatsAppFloat (rendered globally, outside this page) listens
  // for this to hide itself — that's what lets this bar go back to a
  // single full-width row instead of permanently losing width to a fixed
  // right-side gap for the float.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pdp-sticky-bar', { detail: { visible: stickyVisible } }));
    return () => {
      window.dispatchEvent(new CustomEvent('pdp-sticky-bar', { detail: { visible: false } }));
    };
  }, [stickyVisible]);

  useEffect(() => {
    const el = relatedSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrolledPast = entry.boundingClientRect.top < 0;
        setStickyVisible(!scrolledPast);
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [related.length]);

  useEffect(() => {
    setLoading(true);
    productAPI.getOne(routeSlug)
      .then((res) => {
        const p = res.data.product;

        // Backward compatibility: an old bookmarked/shared URL used the raw
        // Mongo ObjectId (/products/64xxxxx...). The API already resolved
        // it above; now redirect the browser to the canonical slug URL so
        // there's only ever one indexable URL per product, and so search
        // engines consolidate ranking signals onto the slug URL rather than
        // splitting them across two URLs for the same product.
        // `replace: true` avoids leaving the dead ID URL in browser
        // history. Note: because this is a client-rendered SPA with no
        // server-side rendering for product pages, this is the closest
        // achievable equivalent of a permanent redirect — it is NOT a true
        // HTTP 301. See the SEO report's "Remaining limitations" section.
        if (p.slug && p.slug !== routeSlug) {
          navigate(`/products/${p.slug}`, { replace: true });
          return;
        }

        setProduct(p);
        setMainImg(p.img);
        setSelectedSizeIdx(Math.min(1, (p.sizes?.length || 1) - 1));
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [routeSlug, navigate]);

  useEffect(() => {
    if (!product) return;
    const sameCategory = product.category
      ? productAPI.getAll({ category: product.category, limit: 6 })
      : Promise.resolve({ data: { products: [] } });

    sameCategory
      .then((res) => {
        const list = (res.data.products || []).filter((p) => p._id !== product._id);
        if (list.length >= 3) return list.slice(0, 3);
        return productAPI.getAll({ limit: 6 }).then((res2) => {
          const extra = (res2.data.products || []).filter(
            (p) => p._id !== product._id && !list.some((l) => l._id === p._id)
          );
          return [...list, ...extra].slice(0, 3);
        });
      })
      .then(setRelated)
      .catch(() => {});
  }, [product]);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-8 min-h-screen">
      <DetailSkeleton />
    </div>
  );
  if (!product) return null;

  const currentSize = product.sizes?.[selectedSizeIdx] || { weight: product.weight, price: product.price };
  const thumbs      = [product.img, ...(product.images || [])];
  const wishlisted  = isWishlisted(product._id);

  const productSlug = product.slug || product._id;
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: product.name, path: `/products/${productSlug}` },
  ];
  const seoDescription = (product.desc || product.intro || '').slice(0, 160);

  const handleAddToCart = () => {
    addToCart(product, currentSize.weight, currentSize.price, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Adds/removes THIS product from the wishlist in place — toggle() itself
  // already handles the "please login" guard and the success/removed toast,
  // so this just needs to pass the id through.
  const handleWishlistToggle = () => {
    toggle(product._id);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.intro || product.name, url });
      } catch {
        // person cancelled the native share sheet — not an error
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch {
        // clipboard unavailable in this context — silently skip
      }
    }
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
      <SEO
        title={`${product.name} | Authentic Solapuri Chiwada — Namdev Chiwada`}
        description={seoDescription}
        canonical={`/products/${productSlug}`}
        type="product"
        image={product.img}
        imageAlt={`${product.name} – Namdev Chiwada`}
        jsonLd={[buildProductSchema(product), buildBreadcrumbSchema(breadcrumbItems)]}
      />
      <style>{`
        .pdp-scroll-hide { scrollbar-width: none; -ms-overflow-style: none; }
        .pdp-scroll-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="min-h-screen bg-cream">

        {/* ── Top bar: breadcrumb (all breakpoints) + back (desktop only) ── */}
        <div className="max-w-7xl mx-auto px-6 xl:px-10 pt-5 pb-1">
          <div className="flex items-center justify-between">
            <Breadcrumbs items={breadcrumbItems} />
            <button onClick={() => navigate(-1)}
              className="hidden lg:flex items-center gap-1 text-xs text-brown-mid hover:text-saffron transition-colors font-semibold">
              ← Back
            </button>
          </div>
        </div>

        {/* ════════ MOBILE ════════ */}
        <div className="lg:hidden">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
              <button onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm shadow flex items-center justify-center text-brown-dark text-lg">
                ←
              </button>
              <div className="flex items-center gap-2">
                <button onClick={handleWishlistToggle} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={`w-9 h-9 rounded-full backdrop-blur-sm shadow flex items-center justify-center transition-all
                    ${wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/85 text-brown-dark'}`}>
                  <WishlistIcon size={17} filled={wishlisted} />
                </button>
                <button onClick={handleShare} aria-label="Share this product"
                  className="w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm shadow flex items-center justify-center text-brown-dark">
                  <Send size={16} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div
              ref={mobileScrollRef}
              onScroll={handleMobileScroll}
              className="pdp-scroll-hide flex overflow-x-auto snap-x snap-mandatory"
              style={{ backgroundColor: '#DEDAD2' }}
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

          <div className="relative -mt-6 rounded-t-[28px] bg-white shadow-[0_-8px_24px_rgba(58,35,23,0.08)] px-5 pt-6 pb-28">
            <MobileHandle />
            <ProductInfo
              product={product} currentSize={currentSize} discount={discount}
              selectedSizeIdx={selectedSizeIdx} setSelectedSizeIdx={setSelectedSizeIdx}
              activeTab={activeTab} setActiveTab={setActiveTab}
            />
          </div>

          {/* Sticky bottom bar — back to a single row. This only works
              cleanly because WhatsAppFloat now listens for the
              'pdp-sticky-bar' event (dispatched above) and hides itself
              while this bar is on screen, so there's no fixed right-side
              gap to squeeze into anymore — the button gets the full
              width it needs. */}
          <motion.div
            initial={false}
            animate={{ y: stickyVisible ? 0 : '120%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-saffron/10 pt-3 px-4"
            style={{
              boxShadow: '0 -6px 20px rgba(58,35,23,0.10)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-cream-mid rounded-full px-1 py-1 shrink-0">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="rounded-full text-saffron font-bold flex items-center justify-center text-lg"
                  style={{ width: 40, height: 40 }}>−</button>
                <span className="font-bold text-brown-dark w-6 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="rounded-full text-saffron font-bold flex items-center justify-center text-lg"
                  style={{ width: 40, height: 40 }}>+</button>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 min-w-0 py-3.5 rounded-full font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{
                  background: !product.inStock ? '#9ca3af' : added ? '#16a34a' : `linear-gradient(135deg,${MAROON},#c0392b)`,
                  boxShadow: product.inStock ? `0 6px 18px rgba(110,30,39,0.30)` : 'none',
                }}>
                <AnimatePresence mode="wait">
                  {!product.inStock ? (
                    <motion.span key="oos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Out of Stock
                    </motion.span>
                  ) : added ? (
                    <motion.span key="added" className="flex items-center gap-2 whitespace-nowrap"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                      <Check size={16} strokeWidth={2.5} /> Added to Cart
                    </motion.span>
                  ) : (
                    <motion.span key="add" className="flex items-center gap-2 whitespace-nowrap"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                      ₹{currentSize.price * qty} <span className="opacity-60">·</span>
                      <ShoppingCart size={16} strokeWidth={2.2} /> Add to Cart
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* ════════ DESKTOP ════════ */}
        <div className="hidden lg:block max-w-7xl mx-auto px-6 xl:px-10 pb-16">
          <div className="grid grid-cols-[72px_1fr] xl:grid-cols-[84px_1fr] gap-5 items-start">

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

            <div className="grid grid-cols-2 gap-10 xl:gap-14 items-start">

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

                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <button onClick={handleWishlistToggle} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all
                        ${wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/85 text-brown-dark hover:text-saffron'}`}>
                      <WishlistIcon size={19} filled={wishlisted} />
                    </button>
                    <button onClick={handleShare} aria-label="Share this product"
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-white/85 text-brown-dark hover:text-saffron transition-all">
                      <Send size={18} strokeWidth={2} />
                    </button>
                  </div>

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

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm"
                      style={{ color: MAROON }}>
                      Solapur · Since 1873
                    </span>
                  </div>
                </div>
                <p className="text-center text-xs text-brown-mid/40 mt-3 italic">Hover to inspect the craft</p>
              </div>

              <div>
                <ProductInfo
                  product={product} currentSize={currentSize} discount={discount}
                  selectedSizeIdx={selectedSizeIdx} setSelectedSizeIdx={setSelectedSizeIdx}
                  activeTab={activeTab} setActiveTab={setActiveTab}
                />

                <div className="flex items-center gap-3 mt-5">
                  <div className="flex items-center gap-1 bg-white border border-saffron/20 rounded-full px-1 py-1 shadow-sm shrink-0">
                    <button onClick={() => setQty(Math.max(1, qty - 1))}
                      className="rounded-full border border-saffron/30 text-saffron font-bold flex items-center justify-center hover:bg-saffron hover:text-white transition-all text-lg"
                      style={{ width: 40, height: 40 }}>
                      −
                    </button>
                    <span className="font-bold text-brown-dark w-7 text-center">{qty}</span>
                    <button onClick={() => setQty(qty + 1)}
                      className="rounded-full border border-saffron/30 text-saffron font-bold flex items-center justify-center hover:bg-saffron hover:text-white transition-all text-lg"
                      style={{ width: 40, height: 40 }}>
                      +
                    </button>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ y: -1 }}
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className="flex-1 min-w-0 py-3.5 rounded-full font-bold text-white text-sm transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        <div ref={relatedSentinelRef} />

        {related.length > 0 && (
          <div className="lg:hidden px-5 pb-10">
            <div className="mb-5">
              <div className="section-eyebrow">You May Also Like</div>
              <h3 className="font-serif font-bold text-brown-dark text-lg">Related Products</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function MobileHandle() {
  return <div className="w-10 h-1 rounded-full bg-brown-dark/10 mx-auto mb-5" />;
}

function ProductInfo({ product, currentSize, discount, selectedSizeIdx, setSelectedSizeIdx, activeTab, setActiveTab }) {
  return (
    <div className="flex flex-col gap-4">

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

      <p className="text-sm text-brown-dark/65 leading-relaxed">{product.desc}</p>

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

      <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-cream-mid/60 rounded-xl border border-saffron/10">
        {[
          { icon: '🚚', text: 'Free delivery ≥₹499' },
          { icon: '✅', text: '100% Authentic' },
          { icon: '↩️', text: 'Easy Returns' },
        ].map((t) => (
          <div key={t.text} className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-lg">{t.icon}</span>
            <span className="text-xs text-brown-mid/70 font-medium leading-tight">{t.text}</span>
          </div>
        ))}
      </div>

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
