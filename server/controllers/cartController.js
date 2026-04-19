import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);
const LOCAL_KEY = 'nc_cart';

const saveLocal = (items) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch {}
};

const loadLocal = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; }
};

// Get unique item identifier — works for both local and DB items
const getItemKey = (item) => `${item.product || item._id}_${item.size}`;

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── On login/logout — sync cart ──────────────────────
  useEffect(() => {
    if (user) {
      // Logged in — DB is source of truth
      setLoading(true);
      cartAPI.get()
        .then((res) => {
          const dbItems = res.data.cart?.items || [];
          setItems(dbItems);
          saveLocal(dbItems);
        })
        .catch(() => {
          // DB failed — use local
          setItems(loadLocal());
        })
        .finally(() => setLoading(false));
    } else {
      // Not logged in — use localStorage
      setItems(loadLocal());
    }
  }, [user?._id]); // Only re-run when user ID changes, not on every render

  // ── Add to Cart ──────────────────────────────────────
  exports.addToCart = async (req, res, next) => {
  try {
    const { productId, name, img, price, size, qty = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (!product.inStock) {
      return res.status(400).json({ success: false, message: `"${product.name}" is out of stock` });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if same product + same size already exists
    const existIdx = cart.items.findIndex(
      (i) => i.product.toString() === productId && i.size === size
    );

    if (existIdx > -1) {
      // Update quantity — do NOT add duplicate
      cart.items[existIdx].qty += qty;
    } else {
      // Add new item
      cart.items.push({ product: productId, name, img, price, size, qty });
    }

    await cart.save();

    // Populate product details before returning
    await cart.populate('items.product', 'name img inStock');

    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};
  // ── Update Quantity ──────────────────────────────────
  const updateQty = useCallback(async (itemId, qty) => {
    if (user) {
      try {
        if (qty <= 0) {
          const res = await cartAPI.remove(itemId);
          const dbItems = res.data.cart?.items || [];
          setItems(dbItems);
          saveLocal(dbItems);
        } else {
          const res = await cartAPI.update(itemId, qty);
          const dbItems = res.data.cart?.items || [];
          setItems(dbItems);
          saveLocal(dbItems);
        }
      } catch {
        // Optimistic fallback
        setItems((prev) => {
          const updated = qty <= 0
            ? prev.filter((i) => i._id !== itemId)
            : prev.map((i) => i._id === itemId ? { ...i, qty } : i);
          saveLocal(updated);
          return updated;
        });
      }
    } else {
      setItems((prev) => {
        const updated = qty <= 0
          ? prev.filter((i) => i._id !== itemId)
          : prev.map((i) => i._id === itemId ? { ...i, qty } : i);
        saveLocal(updated);
        return updated;
      });
    }
  }, [user]);

  // ── Remove Item ──────────────────────────────────────
  const removeFromCart = useCallback(async (itemId) => {
    if (user) {
      try {
        const res = await cartAPI.remove(itemId);
        const dbItems = res.data.cart?.items || [];
        setItems(dbItems);
        saveLocal(dbItems);
      } catch {
        setItems((prev) => {
          const updated = prev.filter((i) => i._id !== itemId);
          saveLocal(updated);
          return updated;
        });
      }
    } else {
      setItems((prev) => {
        const updated = prev.filter((i) => i._id !== itemId);
        saveLocal(updated);
        return updated;
      });
    }
    toast.success('Item removed');
  }, [user]);

  // ── Clear Cart ───────────────────────────────────────
  const clearCart = useCallback(async () => {
    setItems([]);
    saveLocal([]);
    if (user) {
      try { await cartAPI.clear(); } catch {}
    }
  }, [user]);

  const totalItems = items.reduce((s, i) => s + (i.qty || 0), 0);
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
  const shipping = subtotal >= 500 ? 0 : (items.length > 0 ? 60 : 0);
  const total = subtotal + shipping;

  return (
    <CartContext.Provider value={{
      items,
      loading,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      totalItems,
      subtotal,
      shipping,
      total,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);