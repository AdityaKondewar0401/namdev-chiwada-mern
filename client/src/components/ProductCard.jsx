import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const BADGE_CLASS = {
  '': 'badge-default',
  'badge-green': 'badge-green',
  'badge-red': 'badge-red',
  'badge-gold': 'badge-gold',
  'badge-blue': 'badge-blue',
};

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    const defaultSize = product.sizes?.[1] || product.sizes?.[0];
    addToCart(product, defaultSize?.weight || product.weight, defaultSize?.price || product.price);
  };

  const stars = Math.round(product.rating || 0);
  const wishlisted = isWishlisted(product._id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onClick={() => navigate(`/products/${product._id}`)}
      className="bg-white rounded-xl2 overflow-hidden shadow-saffron border border-saffron/5 cursor-pointer group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-saffron-lg"
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <span className={`badge ${BADGE_CLASS[product.badgeClass || '']}`}>
            {product.badge}
          </span>
        )}
        {/* Wishlist btn */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(product._id); }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-base transition-all duration-200 shadow-md ${
            wishlisted ? 'bg-red-500 text-white' : 'bg-white/90 hover:bg-white text-brown-mid'
          }`}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="font-serif font-bold text-brown-dark text-base leading-snug mb-1">
          {product.name}
        </div>
        <div className="text-xs text-brown-mid/70 mb-2">
          {product.sub} · {product.weight}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-amber-400 text-sm tracking-tight">
            {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          </span>
          <span className="text-xs text-brown-mid/60">({product.reviews})</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-saffron font-bold text-lg">₹{product.price}</span>
            <span className="text-xs text-brown-mid/50 ml-1">/{product.weight}</span>
            {product.originalPrice && (
              <span className="block text-xs text-brown-mid/40 line-through">₹{product.originalPrice}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="px-3.5 py-2 rounded-full text-xs font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}
          >
            + Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}
