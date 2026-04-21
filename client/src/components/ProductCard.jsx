import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import QuantityStepper from './QuantityStepper';

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const { toggle, isWishlisted } = useWishlist();
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);

  const sizes = product.sizes || [{ weight: product.weight, price: product.price }];
  const currentSize = sizes[selectedSizeIdx];
  const wishlisted = isWishlisted(product._id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      onClick={() => navigate(`/products/${product._id}`)}
      className="bg-white rounded-3xl overflow-hidden flex flex-col cursor-pointer group relative"
      style={{ boxShadow: '0 4px 24px rgba(45,26,0,0.08)', border: '1px solid rgba(224,112,0,0.06)' }}
      whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(224,112,0,0.15)' }}>

      {/* ── Image ────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-t-3xl">
            <span className="px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gray-700">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badge */}
        {product.badge && product.inStock && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-md"
              style={{ background: product.badgeColor || '#e07000' }}>
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(product._id); }}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 ${
            wishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-brown-mid'
          }`}>
          {wishlisted ? '♥' : '♡'}
        </button>

        {/* Product image */}
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1">

        {/* Name */}
        <h3 className="font-serif font-black text-brown-dark text-lg leading-tight mb-0.5 truncate">
          {product.name}
        </h3>

        {/* Sub */}
        {product.sub && (
          <p className="text-xs text-brown-mid/60 mb-2 truncate">
            {product.sub} · {currentSize.weight}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-xs"
                style={{ color: i < Math.floor(product.rating || 0) ? '#f59e0b' : '#d1d5db' }}>
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-brown-mid/50">({product.reviews || 0})</span>
        </div>

        {/* Size selector */}
        {sizes.length > 1 && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">
              Net Weight
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {sizes.map((s, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedSizeIdx(i); }}
                  className="px-3 py-1 rounded-full text-xs font-bold border-2 transition-all duration-200"
                  style={{
                    background: selectedSizeIdx === i ? '#e07000' : 'transparent',
                    borderColor: selectedSizeIdx === i ? '#e07000' : 'rgba(224,112,0,0.3)',
                    color: selectedSizeIdx === i ? '#fff' : '#e07000',
                  }}>
                  {s.weight}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price + Stepper */}
        <div className="flex items-center gap-3 mt-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex-shrink-0">
            <div className="font-black text-xl" style={{ color: '#e07000' }}>
              ₹{currentSize.price}
            </div>
            {product.originalPrice && (
              <div className="text-xs text-brown-mid/40 line-through">
                ₹{product.originalPrice}
              </div>
            )}
          </div>

          <div className="flex-1">
            <QuantityStepper
              product={product}
              size={currentSize.weight}
              price={currentSize.price}
              disabled={!product.inStock}
              compact
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
