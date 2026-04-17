import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);
const LOCAL_KEY = 'nc_cart';

const loadLocal = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; }
  catch { return []; }
};

const saveLocal = (items) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  // ── Sync with DB when user logs in ──────────────────
  useEffect(() => {
    if (user) {
      // User is logged in — fetch cart from DB (DB is source of truth)
      setLoading(true);
      cartAPI.get()
        .then((res) => {
          const dbItems = res.data.cart?.items || [];

          if (dbItems.length > 0) {
            // DB has items — use DB cart, ignore local
            setItems(dbItems);
            saveLocal(dbItems);
          } else {
            // DB is empty — check if local has items to sync
            const localItems = loadLocal();
            if (localItems.length > 0) {
              // Push local items to DB
              Promise.all(
                localItems.map(item =>
                  cartAPI.add({
                    productId: item.product || item._id,
                    name: item.name,
                    img: item.img,
                    price: item.price,
                    size: item.size,
                    qty: item.qty,
                  }).catch(() => null)
                )
              ).then(() => {
                // Fetch fresh cart from DB after sync
                return cartAPI.get();
              }).then((res) => {
                const synced = res.data.cart?.items || [];
                setItems(synced);
                saveLocal(synced);
              }).catch(() => {
                setItems(localItems);
              });
            } else {
              setItems([]);
              saveLocal([]);
            }
          }
          setSynced(true);
        })
        .catch(() => {
          // DB failed — fall back to local
          const localItems = loadLocal();
          setItems(localItems);
          setSynced(true);
        })
        .finally(() => setLoading(false));
    } else {
      // Not logged in — use localStorage only
      const localItems = loadLocal();
      setItems(localItems);
      setSynced(true);
    }
  }, [user]);

  // ── Save to localStorage whenever items change ──────
  useEffect(() => {
    if (synced) {
      saveLocal(items);
    }
  }, [items, synced]);

  // ── Add to Cart ─────────────────────────────────────
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

    // Update local state immediately (optimistic)
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => (i.product === product._id || i._id === product._id) && i.size === size
      );
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty };
        return updated;
      }
      return [...prev, newItem];
    });

    // Sync to DB if logged in
    if (user) {
      try {
        const res = await cartAPI.add({
          productId: product._id,
          name: product.name,
          img: product.img,
          price,
          size,
          qty,
        });
        // Use DB response as source of truth
        const dbItems = res.data.cart?.items || [];
        setItems(dbItems);
        saveLocal(dbItems);
      } catch {
        // Keep optimistic update if DB fails
      }
    }

    toast.success(`${product.name} added to cart! 🛒`);
  }, [user]);

  // ── Update Quantity ──────────────────────────────────
  const updateQty = useCallback(async (itemId, qty) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => (i._id || i.id) !== itemId);
      return prev.map((i) =>
        (i._id || i.id) === itemId ? { ...i, qty } : i
      );
    });

    if (user) {
      try {
        const res = await cartAPI.update(itemId, qty);
        const dbItems = res.data.cart?.items || [];
        if (dbItems.length > 0 || qty <= 0) {
          setItems(dbItems);
          saveLocal(dbItems);
        }
      } catch {}
    }
  }, [user]);

  // ── Remove Item ──────────────────────────────────────
  const removeFromCart = useCallback(async (itemId) => {
    setItems((prev) => prev.filter((i) => (i._id || i.id) !== itemId));

    if (user) {
      try {
        const res = await cartAPI.remove(itemId);
        const dbItems = res.data.cart?.items || [];
        setItems(dbItems);
        saveLocal(dbItems);
      } catch {}
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

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
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