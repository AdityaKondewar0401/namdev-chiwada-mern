import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load the person's saved wishlist whenever they're logged in — previously
  // this only ever updated in memory via toggle(), so a fresh page load or
  // a new session always showed an empty wishlist even if items were saved
  // earlier.
  useEffect(() => {
    if (!user?._id) { setWishlist([]); return; }
    setLoading(true);
    wishlistAPI.get()
      .then((res) => {
        const items = res.data.wishlist || [];
        // GET returns populated Product documents, but toggle()'s response
        // and every .includes(id) check below (isWishlisted, and toggle's
        // own optimistic check) expect an array of id strings. Without this
        // normalization, a fresh page load hydrates `wishlist` with full
        // objects, so isWishlisted(id) silently returns false for
        // everything — hearts show unfilled even for saved items — until
        // the user toggles something once and overwrites state with the
        // id-shaped response from POST /api/wishlist/:productId.
        const ids = items.map((item) => (typeof item === 'string' ? item : item._id));
        setWishlist(ids);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?._id]);

  const toggle = useCallback(async (productId) => {
    if (!user) { toast.error('Please login to use wishlist'); return; }
    const isIn = wishlist.includes(productId);
    setWishlist((prev) => isIn ? prev.filter((id) => id !== productId) : [...prev, productId]);
    try {
      const res = await wishlistAPI.toggle(productId);
      setWishlist(res.data.wishlist);
      toast.success(isIn ? 'Removed from wishlist' : 'Added to wishlist ♡');
    } catch { setWishlist((prev) => isIn ? [...prev, productId] : prev.filter((id) => id !== productId)); }
  }, [user, wishlist]);

  const isWishlisted = useCallback((id) => wishlist.includes(id), [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);