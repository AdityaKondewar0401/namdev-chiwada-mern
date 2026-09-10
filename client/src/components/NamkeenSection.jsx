import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import QuantityStepper from './QuantityStepper';
import WishlistIcon from './WishlistIcon';
import { SITE_NAME } from '../config/seo.config';

// motion(Link) keeps each featured card a real crawlable <a href> while
// still animating — same pattern as ProductCard.
const MotionLink = motion(Link);

const IMG_BG =
  'radial-gradient(circle at 50% 35%, rgba(212,175,55,0.14), transparent 65%), linear-gradient(180deg,#fbf6ec,#f2e9d8)';

// ── Individual featured card ─────────────────────────────
// Compact vertical card — a 2-up grid on mobile so the four featured
// products read as a "collection" instead of filling three screens.
function NamkeenCard({ product, index }) {
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  const sizes =
    product.sizes?.length > 0
      ? product.sizes
      : [{ weight: product.weight, price: product.price }];
  const currentSize = sizes[selectedSizeIdx];

  // These controls sit inside a <Link>; preventDefault stops the card's
  // own navigation, stopPropagation keeps the click from bubbling.
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <MotionLink
      to={`/products/${product.slug || product._id}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(224,112,0,0.15)' }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white sm:rounded-3xl"
      style={{ boxShadow: '0 4px 18px rgba(45,26,0,0.07)', border: '1px solid rgba(212,175,55,0.14)' }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden" style={{ background: IMG_BG }}>
        {!product.inStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-gray-700 px-2.5 py-1 text-[10px] font-bold text-white">
              Out of Stock
            </span>
          </div>
        )}

        {product.badge && product.inStock && (
          <span
            className="absolute left-2 top-2 z-10 max-w-[calc(100%-2.75rem)] truncate rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]"
            style={{ background: product.badgeColor || '#e07000' }}
          >
            {product.badge}
          </span>
        )}

        <button
          onClick={(e) => {
            stop(e);
            toggle(product._id, product);
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-transform duration-200 hover:scale-110 sm:right-3 sm:top-3 sm:h-9 sm:w-9 ${
            wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/85 text-brown-dark'
          }`}
        >
          <WishlistIcon size={13} filled={wishlisted} />
        </button>

        <img
          src={product.img}
          alt={`${product.name} – authentic Solapuri snack by ${SITE_NAME}`}
          loading="lazy"
          width={400}
          height={400}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {product.namMarathi && (
          <div
            className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 sm:px-3 sm:py-2"
            style={{ background: 'linear-gradient(to top,rgba(45,26,0,0.6),transparent)' }}
          >
            <span
              style={{
                fontFamily: "'Gotu',sans-serif",
                color: 'rgba(255,255,255,0.92)',
                fontSize: '0.72rem',
              }}
            >
              {product.namMarathi}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3.5">
        {product.tag && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-saffron sm:text-[10px]">
            {product.tag}
          </span>
        )}

        <h3 className="font-serif text-[0.9rem] font-black leading-tight text-brown-dark line-clamp-1 sm:text-lg">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 text-[10px] sm:text-[11px]">
          <span className="tracking-tight text-amber-400">
            {'★'.repeat(Math.round(product.rating || 0))}
            <span className="text-brown-dark/15">
              {'★'.repeat(5 - Math.round(product.rating || 0))}
            </span>
          </span>
          <span className="text-brown-mid/45">({product.reviews || 0})</span>
        </div>

        {sizes.length > 1 && (
          <div className="mt-0.5 flex flex-wrap gap-1" onClick={stop}>
            {sizes.map((s, i) => (
              <button
                key={i}
                onClick={(e) => {
                  stop(e);
                  setSelectedSizeIdx(i);
                }}
                className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold transition-all duration-200 sm:px-2 sm:text-[10px]"
                style={{
                  background:
                    selectedSizeIdx === i ? 'linear-gradient(135deg,#e07000,#ff9010)' : 'transparent',
                  borderColor: selectedSizeIdx === i ? '#e07000' : 'rgba(224,112,0,0.3)',
                  color: selectedSizeIdx === i ? '#fff' : '#e07000',
                }}
              >
                {s.weight}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-1.5 pt-1.5" onClick={stop}>
          <span className="text-sm font-black sm:text-base" style={{ color: '#e07000' }}>
            ₹{currentSize.price}
            {sizes.length === 1 && currentSize.weight && (
              <span className="ml-1 text-[10px] font-semibold text-brown-mid/45">
                {currentSize.weight}
              </span>
            )}
          </span>

          <QuantityStepper
            product={product}
            size={currentSize.weight}
            price={currentSize.price}
            disabled={!product.inStock}
            compact
          />
        </div>
      </div>
    </MotionLink>
  );
}

// ── Section ─────────────────────────────────────────────
export default function NamkeenSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI
      .getAll({ featured: 'true', limit: 4, sort: 'popular' })
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gridClass = 'grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:gap-6';

  return (
    <section className="relative overflow-hidden py-14 md:py-20" style={{ background: '#fffdf7' }}>
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,#d4af37,transparent)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,#d4af37,transparent)' }}
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        {/* Header */}
        <div className="mb-9 text-center md:mb-14">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div
              className="h-px w-12 sm:w-24"
              style={{ background: 'linear-gradient(to right,transparent,#d4af37)' }}
            />
            <span className="text-lg">🌾</span>
            <div
              className="h-px w-12 sm:w-24"
              style={{ background: 'linear-gradient(to left,transparent,#d4af37)' }}
            />
          </div>

          <div
            className="mb-2.5 text-xs font-bold uppercase tracking-widest"
            style={{ color: '#e07000' }}
          >
            Our Collection
          </div>

          <h2 className="mb-2.5 font-serif text-3xl font-black text-brown-dark md:text-4xl">
            Our Namkeen Collection
          </h2>

          <p className="text-sm italic text-brown-mid/60">
            Crafted by {SITE_NAME} with tradition, served with love since 1873
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={gridClass}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl sm:rounded-3xl" style={{ border: '1px solid rgba(212,175,55,0.14)' }}>
                <div className="skeleton aspect-square w-full" />
                <div className="skeleton m-2.5 h-14 rounded-lg" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <div className="mb-4 text-5xl">🌾</div>
            <div className="mb-2 font-serif text-xl font-bold text-brown-dark">
              New Products Coming Soon
            </div>
            <div className="mx-auto max-w-md text-sm text-brown-mid/60">
              We're refreshing our collection — check back shortly, or reach out to us directly for
              the latest.
            </div>
          </motion.div>
        ) : (
          <div className={gridClass}>
            {products.map((product, i) => (
              <NamkeenCard key={product._id} product={product} index={i} />
            ))}
          </div>
        )}

        {/* View All Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-9 flex justify-center sm:mt-14"
        >
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold transition-all duration-300 sm:text-base"
            style={{ color: '#e07000', border: '2px solid #e07000', background: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e07000';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.boxShadow = '0 10px 28px rgba(224,112,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#e07000';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            View All Products
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
