import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ─────────────────────────────────────────────
// RelatedProductCard — for "You May Also Like" rails only.
//
// ProductDetailPage used to reuse the full ProductCard (wishlist icon,
// size selector, quantity stepper, Add to Cart) here, at 2-3 cards per
// row. That's a browsing card — it invites a full purchase decision
// crammed into a third of the width it normally gets on the Products
// grid, which is exactly why it read as cluttered/broken: a size
// selector and stepper have no room to lay out cleanly that small, and
// stacking that much interactive UI onto a "here's something else you
// might like" rail fights its own purpose. A recommendation card's job
// is to get someone to look at the next product, not to sell it on the
// spot — so this is just image, name, rating, and price, the whole card
// a single link through to the real product page (where the full
// buying UI already lives).
// ─────────────────────────────────────────────

const MAROON = '#6E1E27';
const GOLD_SOFT = 'rgba(184,134,46,0.14)';

const MotionLink = motion(Link);

export default function RelatedProductCard({ product, index = 0 }) {
  const price = product.sizes?.length > 0 ? product.sizes[0].price : product.price;

  return (
    <MotionLink
      to={`/products/${product.slug || product._id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group block"
    >
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          aspectRatio: '1/1',
          background: `radial-gradient(circle at 50% 35%, ${GOLD_SOFT}, transparent 65%), linear-gradient(180deg,#FBF6EC 0%, #F2E9D8 100%)`,
          border: '1px solid rgba(184,134,46,0.10)',
          boxShadow: '0 4px 16px rgba(58,35,23,0.06)',
        }}
      >
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold text-white bg-gray-700">
              Out of Stock
            </span>
          </div>
        )}

        {product.badge && product.inStock && (
          <div className="absolute top-2 left-2 z-10">
            <span
              className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold text-white shadow-md tracking-wide"
              style={{ background: product.badgeColor || '#e07000' }}
            >
              {product.badge}
            </span>
          </div>
        )}

        <img
          src={product.img}
          alt={`${product.name} – authentic Solapuri snack by Namdev Chiwda`}
          loading="lazy"
          width={300}
          height={300}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover affordance — this card's only job is to lead to the real
            product page, so make that explicit rather than implying a
            buying action is available right here. */}
        <div className="absolute inset-0 hidden sm:flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span
            className="px-3.5 py-1.5 rounded-full text-[11px] font-bold text-white"
            style={{ background: 'rgba(45,26,0,0.85)', backdropFilter: 'blur(2px)' }}
          >
            View Product →
          </span>
        </div>
      </div>

      <div className="mt-2.5 px-0.5">
        <h4 className="font-serif font-bold text-brown-dark text-[0.82rem] sm:text-sm leading-snug line-clamp-1">
          {product.name}
        </h4>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-amber-400 text-[0.6rem] sm:text-[0.65rem] tracking-tight">
            {'★'.repeat(Math.round(product.rating || 0))}
            <span className="text-brown-dark/15">{'★'.repeat(5 - Math.round(product.rating || 0))}</span>
          </span>
          <span className="text-[0.55rem] sm:text-[0.6rem] text-brown-mid/60">({product.reviews || 0})</span>
        </div>
        <div className="mt-1 font-black text-[0.85rem] sm:text-sm" style={{ color: MAROON }}>
          ₹{price}
        </div>
      </div>
    </MotionLink>
  );
}
