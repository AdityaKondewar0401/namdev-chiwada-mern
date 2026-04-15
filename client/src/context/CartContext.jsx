import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const LOCAL_KEY = 'nc_cart';

const loadLocal = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; }
};
const saveLocal = (items) => localStorage.setItem(LOCAL_KEY, JSON.stringify(items));

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(loadLocal);
  const [loading, setLoading] = useState(false);

  // Sync with DB when user logs in
  useEffect(() => {
    if (user) {
      setLoading(true);
      cartAPI.get()
        .then((res) => {
          const dbItems = res.data.cart?.items || [];
          // Merge local + db (db wins on conflict)
          setItems(dbItems);
          saveLocal(dbItems);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Persist to localStorage
  useEffect(() => { saveLocal(items); }, [items]);

  const addToCart = useCallback(async (product, size, price, qty = 1) => {
    const newItem = {
      product: product._id,
      name: product.name,
      img: product.img,
      price,
      size,
      qty,
      _id: `local_${Date.now()}`,
    };

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product === product._id && i.size === size);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty };
        return updated;
      }
      return [...prev, newItem];
    });

    if (user) {
      try {
        const res = await cartAPI.add({ productId: product._id, name: product.name, img: product.img, price, size, qty });
        setItems(res.data.cart.items);
      } catch {}
    }

    toast.success(`${product.name} added to cart! 🛒`);
  }, [user]);

  const updateQty = useCallback(async (itemId, qty) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => (i._id || i.id) !== itemId);
      return prev.map((i) => (i._id || i.id) === itemId ? { ...i, qty } : i);
    });
    if (user) {
      try { await cartAPI.update(itemId, qty); } catch {}
    }
  }, [user]);

  const removeFromCart = useCallback(async (itemId) => {
    setItems((prev) => prev.filter((i) => (i._id || i.id) !== itemId));
    if (user) {
      try { await cartAPI.remove(itemId); } catch {}
    }
    toast.success('Item removed');
  }, [user]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user) {
      try { await cartAPI.clear(); } catch {}
    }
  }, [user]);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 500 ? 0 : (items.length > 0 ? 60 : 0);
  const total = subtotal + shipping;

  return (
    <CartContext.Provider value={{ items, loading, addToCart, updateQty, removeFromCart, clearCart, totalItems, subtotal, shipping, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
