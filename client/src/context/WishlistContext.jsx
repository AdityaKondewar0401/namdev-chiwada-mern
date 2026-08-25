import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load the person's saved wishlist whenever they're logged in — previously
  // this only ever updated in memory via toggle(), so a fresh page load or
  // a new session always showed an empty wishlist even if items were saved
  // earlier.
  useEffect(() => {
    if (!user?._id) { setWishlist([]); setWishlistProducts([]); return; }
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
        setWishlistProducts(items.filter((item) => typeof item !== 'string'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?._id]);

  // `product` (the full populated document) is optional and only needed to
  // keep `wishlistProducts` in sync on an optimistic add — callers that
  // already have the product in hand (ProductCard, ProductDetailPage, ...)
  // pass it so WishlistPage doesn't have to re-fetch/cap the catalog to
  // resolve ids back into displayable products.
  const toggle = useCallback(async (productId, product) => {
    if (!user) { toast.error('Please login to use wishlist'); return; }
    const isIn = wishlist.includes(productId);
    const removedProduct = isIn ? wishlistProducts.find((p) => p._id === productId) : null;
    setWishlist((prev) => isIn ? prev.filter((id) => id !== productId) : [...prev, productId]);
    setWishlistProducts((prev) =>
      isIn ? prev.filter((p) => p._id !== productId) : product ? [...prev, product] : prev
    );
    try {
      const res = await wishlistAPI.toggle(productId);
      setWishlist(res.data.wishlist);
    } catch {
      setWishlist((prev) => isIn ? [...prev, productId] : prev.filter((id) => id !== productId));
      setWishlistProducts((prev) =>
        isIn ? (removedProduct ? [...prev, removedProduct] : prev) : prev.filter((p) => p._id !== productId)
      );
      return;
    }
    toast.success(isIn ? 'Removed from wishlist' : 'Added to wishlist ♡');
  }, [user, wishlist, wishlistProducts]);

  const isWishlisted = useCallback((id) => wishlist.includes(id), [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistProducts, toggle, isWishlisted, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);