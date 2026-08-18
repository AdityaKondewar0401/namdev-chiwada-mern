import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { wishlistAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// WishlistTab
//
// Data now comes from AccountPage as props (`items`/`setItems`)
// instead of fetching independently — same reasoning as OrdersTab.
// The remove-from-wishlist mutation stays here since it's specific
// to this tab.
//
// New: shows the original (strikethrough) price alongside the
// current price when a product has one, and a star rating when
// present — both fields already exist on the Product model, just
// weren't being shown here before.
// ─────────────────────────────────────────────
export default function WishlistTab({ items, setItems, loading }) {
  const navigate = useNavigate();

  const handleRemove = async (productId) => {
    await wishlistAPI.toggle(productId);
    setItems((prev) => prev.filter((p) => p._id !== productId));
    toast.success('Removed from wishlist');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-2xl skeleton" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">❤️</div>
        <h3 className="font-serif font-bold text-brown-dark text-xl mb-2">Wishlist is empty</h3>
        <p className="text-brown-mid/60 text-sm mb-6">Save products you love for later</p>
        <Link to="/products" className="inline-block px-6 py-3 rounded-full font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
          Browse Products →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif font-black text-brown-dark text-2xl mb-6">
        Wishlist <span className="text-lg text-brown-mid/50 font-normal">({items.length})</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((product) => (
          <motion.div key={product._id} layout
            className="bg-white rounded-2xl overflow-hidden group cursor-pointer"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}
            whileHover={{ y: -4 }}>
            <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}
              onClick={() => navigate(`/products/${product._id}`)}>
              <img src={product.img} alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <button onClick={(e) => { e.stopPropagation(); handleRemove(product._id); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-400 hover:text-red-600 transition-colors shadow-md">
                ♥
              </button>
            </div>
            <div className="p-4">
              <div className="font-serif font-bold text-brown-dark text-sm mb-1 truncate">{product.name}</div>
              {product.rating > 0 && (
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(product.rating))}</span>
                  {product.reviews > 0 && <span className="text-[11px] text-brown-mid/50">({product.reviews})</span>}
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <div className="font-black text-saffron">₹{product.price}</div>
                {product.originalPrice > product.price && (
                  <div className="text-xs text-brown-mid/40 line-through">₹{product.originalPrice}</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}