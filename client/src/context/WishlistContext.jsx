import { createContext, useContext, useState, useCallback } from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

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
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
