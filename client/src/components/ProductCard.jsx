import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import QuantityStepper from './QuantityStepper';
import WishlistIcon from './WishlistIcon';

const MAROON = '#6E1E27';
const GOLD_SOFT = 'rgba(184,134,46,0.14)';

// motion(Link) so the whole card is a real crawlable <a href> (search
// engines and screen readers don't follow onClick handlers on a div) while
// keeping the existing Framer Motion entrance/hover animation.
const MotionLink = motion(Link);

// Mirrors Tailwind's `sm` breakpoint. QuantityStepper needs to be a direct
// flex child of the price row for its `w-full` to size correctly against
// that row (wrapping it in a `hidden sm:block` / `sm:hidden` pair to swap
// `compact` per breakpoint broke that — the extra div has no width of its
// own, so the percentage-width button collapsed to its text's width
// instead of filling the row). Picking `compact` in JS keeps it a single,
// unwrapped instance.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 640px)');
    const onChange = (e) => setIsDesktop(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

export default function ProductCard({ product, index = 0 }) {
  const { toggle, isWishlisted } = useWishlist();
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const isDesktop = useIsDesktop();

  const sizes = product.sizes?.length > 0 ? product.sizes : [{ weight: product.weight, price: product.price }];
  const currentSize = sizes[selectedSizeIdx];
  const wishlisted = isWishlisted(product._id);

  return (
    <MotionLink
      to={`/products/${product.slug || product._id}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col cursor-pointer group relative w-full"
      style={{ boxShadow: '0 4px 20px rgba(58,35,23,0.07)', border: '1px solid rgba(184,134,46,0.10)' }}
      whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(110,30,39,0.14)' }}>

      {/* ── Image ────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{
        aspectRatio: '1/1',
        background: `radial-gradient(circle at 50% 35%, ${GOLD_SOFT}, transparent 65%), linear-gradient(180deg,#FBF6EC 0%, #F2E9D8 100%)`,
      }}>

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="px-2 py-0.5 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-sm font-bold text-white bg-gray-700">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badge */}
        {product.badge && product.inStock && (
          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 z-10">
            <span className="px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[11px] font-bold text-white shadow-md tracking-wide"
              style={{ background: product.badgeColor || '#e07000' }}>
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product._id, product); }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-1.5 right-1.5 sm:top-3 sm:right-3 z-10 w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
            wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/85 text-brown-dark'
          }`}>
          <WishlistIcon size={isDesktop ? 14 : 11} filled={wishlisted} />
        </button>

        {/* Product image */}
        <img
          src={product.img}
          alt={`${product.name} – authentic Solapuri snack by Namdev Chiwda`}
          loading="lazy"
          width={400}
          height={400}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Mobile-only floating add/stepper — half-overlapping the image's
            bottom edge. Desktop keeps its own compact stepper down in the
            price row instead (see below); the two are never both rendered
            at once. */}
        {product.inStock && (
          <div
            className="sm:hidden absolute -bottom-3 right-2 z-10"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <QuantityStepper
              product={product}
              size={currentSize.weight}
              price={currentSize.price}
              fab
            />
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="p-2.5 pt-3.5 sm:p-4 flex flex-col flex-1 gap-1.5 sm:gap-2.5">

        {/* Name + rating + a touch of real product info, single tight block */}
        <div>
          {(product.sub || product.tag) && (
            <span className="hidden sm:inline text-[10px] font-bold tracking-widest uppercase text-saffron">
              {product.sub || product.tag}
            </span>
          )}
          <h3 className="font-serif font-black text-brown-dark text-[0.85rem] sm:text-lg leading-snug line-clamp-1 sm:line-clamp-2 sm:mt-0.5">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 sm:gap-1 mt-1">
            <span className="text-amber-400 text-[0.65rem] sm:text-xs tracking-tight">
              {'★'.repeat(Math.round(product.rating || 0))}
              <span className="text-brown-dark/15">{'★'.repeat(5 - Math.round(product.rating || 0))}</span>
            </span>
            <span className="text-[0.6rem] sm:text-[11px] text-brown-mid/45">({product.reviews || 0})</span>
          </div>
          {/* Intro/description — desktop only; the compact mobile card
              leans on the image + name + price alone to stay minimal. */}
          {(product.intro || product.desc) && (
            <p className="hidden sm:block text-xs text-brown-mid/55 mt-1.5 leading-snug line-clamp-1">
              {product.intro || product.desc}
            </p>
          )}
        </div>

        {/* Size selector — quiet, only shown when there's a real choice */}
        {sizes.length > 1 && (
          <div className="flex gap-1.5 flex-wrap" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            {sizes.map((s, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSizeIdx(i); }}
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold border transition-all duration-200 whitespace-nowrap"
                style={{
                  background: selectedSizeIdx === i ? 'linear-gradient(135deg,#e07000,#ff9010)' : 'transparent',
                  borderColor: selectedSizeIdx === i ? '#e07000' : 'rgba(224,112,0,0.30)',
                  color: selectedSizeIdx === i ? '#fff' : '#e07000',
                }}>
                {s.weight}
              </button>
            ))}
          </div>
        )}

        {/* Price + (desktop-only) Stepper */}
        <div className="flex flex-row items-center justify-between gap-2 mt-auto pt-0.5 sm:pt-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <div className="flex-shrink-0 flex items-baseline gap-1 sm:gap-1.5">
            <span className="font-black text-[0.95rem] sm:text-xl" style={{ color: MAROON }}>
              ₹{currentSize.price}
            </span>
            {product.originalPrice && (
              <span className="text-[9px] sm:text-xs text-brown-mid/35 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* Mobile has its own floating stepper on the image instead (see
              above) — rendering this one only for isDesktop, rather than
              hiding it in a wrapper div, is deliberate: QuantityStepper's
              `w-full` needs to size against this flex row directly, and an
              extra `hidden sm:block` wrapper div breaks that (no width of
              its own to be 100% of). */}
          {isDesktop && (
            <QuantityStepper
              product={product}
              size={currentSize.weight}
              price={currentSize.price}
              disabled={!product.inStock}
              compact
            />
          )}
        </div>
      </div>
    </MotionLink>
  );
}
