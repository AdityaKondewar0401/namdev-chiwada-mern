import { useState } from 'react';
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

export default function ProductCard({ product, index = 0 }) {
  const { toggle, isWishlisted } = useWishlist();
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);

  const sizes = product.sizes || [{ weight: product.weight, price: product.price }];
  const currentSize = sizes[selectedSizeIdx];
  const wishlisted = isWishlisted(product._id);

  return (
    <MotionLink
      to={`/products/${product.slug || product._id}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden flex flex-col sm:flex-row cursor-pointer group relative w-full"
      style={{ boxShadow: '0 4px 20px rgba(58,35,23,0.07)', border: '1px solid rgba(184,134,46,0.10)' }}
      whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(110,30,39,0.14)' }}>

      {/* ── Image ────────────────────────────────────── */}
      <div className="relative overflow-hidden sm:w-[42%] sm:flex-shrink-0" style={{
        aspectRatio: '1/1',
        background: `radial-gradient(circle at 50% 35%, ${GOLD_SOFT}, transparent 65%), linear-gradient(180deg,#FBF6EC 0%, #F2E9D8 100%)`,
      }}>

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-sm font-bold text-white bg-gray-700">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badge */}
        {product.badge && product.inStock && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
            <span className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold text-white shadow-md tracking-wide"
              style={{ background: product.badgeColor || '#e07000' }}>
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(product._id, product); }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
            wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/85 text-brown-dark'
          }`}>
          <WishlistIcon size={16} filled={wishlisted} />
        </button>

        {/* Product image */}
        <img
          src={product.img}
          alt={`${product.name} – authentic Solapuri snack by Namdev Chiwda`}
          loading="lazy"
          width={600}
          height={600}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="p-4 sm:p-8 flex flex-col flex-1 gap-2.5 sm:gap-4 sm:justify-center">

        {/* Name + rating + a touch of real product info, single tight block */}
        <div>
          {(product.sub || product.tag) && (
            <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-saffron">
              {product.sub || product.tag}
            </span>
          )}
          <h3 className="font-serif font-black text-brown-dark text-xl sm:text-2xl leading-snug mt-0.5">
            {product.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
            <span className="text-amber-400 text-sm tracking-tight">
              {'★'.repeat(Math.round(product.rating || 0))}
              <span className="text-brown-dark/15">{'★'.repeat(5 - Math.round(product.rating || 0))}</span>
            </span>
            <span className="text-xs text-brown-mid/45">({product.reviews || 0})</span>
          </div>
          {(product.intro || product.desc) && (
            <p className="text-xs sm:text-sm text-brown-mid/60 mt-2 leading-relaxed line-clamp-2">
              {product.intro || product.desc}
            </p>
          )}
        </div>

        {/* Size selector — quiet, only shown when there's a real choice */}
        {sizes.length > 1 && (
          <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {sizes.map((s, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setSelectedSizeIdx(i); }}
                className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap"
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

        {/* Price + Stepper */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 mt-auto pt-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex-shrink-0 flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-black text-xl sm:text-2xl" style={{ color: MAROON }}>
              ₹{currentSize.price}
            </span>
            {product.originalPrice && (
              <span className="text-xs sm:text-sm text-brown-mid/35 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          <QuantityStepper
            product={product}
            size={currentSize.weight}
            price={currentSize.price}
            disabled={!product.inStock}
          />
        </div>
      </div>
    </MotionLink>
  );
}
