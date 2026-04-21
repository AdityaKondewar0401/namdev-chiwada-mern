import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);
const LOCAL_KEY = 'nc_cart';

const loadLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch {
    return [];
  }
};

const saveLocal = (items) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
};

// ── Normalize DB items so _id is always a plain string ──────────────
const normalizeItems = (items = []) =>
  items.map((item) => ({
    ...item,
    _id: item._id?.$oid || item._id?.toString?.() || item._id || item.id || '',
    product:
      item.product?._id?.$oid ||
      item.product?._id?.toString?.() ||
      item.product?._id ||
      item.product?.toString?.() ||
      item.product ||
      '',
  }));

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Sync helper ─────────────────────────────────────────────────────
  const syncItems = useCallback((rawItems) => {
    const normalized = normalizeItems(rawItems);
    setItems(normalized);
    saveLocal(normalized);
  }, []);

  // ── Load cart on mount / user change ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const initCart = async () => {
      if (!user) {
        syncItems(loadLocal());
        return;
      }

      setLoading(true);

      try {
        const res = await cartAPI.get();
        if (cancelled) return;

        const dbItems = res.data.cart?.items || [];

        if (dbItems.length > 0) {
          syncItems(dbItems);
        } else {
          const localItems = loadLocal();

          if (localItems.length > 0) {
            await Promise.all(
              localItems.map((item) =>
                cartAPI
                  .add({
                    productId: item.product || item._id,
                    name: item.name,
                    img: item.img,
                    price: item.price,
                    size: item.size,
                    qty: item.qty,
                  })
                  .catch(() => null)
              )
            );

            const synced = await cartAPI.get();
            if (cancelled) return;

            syncItems(synced.data.cart?.items || []);
          } else {
            syncItems([]);
          }
        }
      } catch {
        if (!cancelled) syncItems(loadLocal());
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initCart();

    return () => {
      cancelled = true;
    };
  }, [user, syncItems]);

  // ── Add to Cart ────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (product, size, price, qty = 1) => {
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
        const idx = prev.findIndex(
          (i) =>
            (i.product === product._id || i._id === product._id) &&
            i.size === size
        );

        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            qty: updated[idx].qty + qty,
          };
          return updated;
        }

        return [...prev, newItem];
      });

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

          syncItems(res.data.cart?.items || []);
        } catch {
          toast.error('Could not sync cart. Item saved locally.');
          setItems((current) => {
            saveLocal(current);
            return current;
          });
        }
      } else {
        setItems((current) => {
          saveLocal(current);
          return current;
        });
      }

      toast.success(`${product.name} added to cart! 🛒`);
    },
    [user, syncItems]
  );

  // ── Update Quantity ────────────────────────────────────────────────
  const updateQty = useCallback(
    async (itemId, qty) => {
      const snapshot = [...items];

      setItems((prev) => {
        const updated =
          qty <= 0
            ? prev.filter((i) => i._id !== itemId)
            : prev.map((i) =>
                i._id === itemId ? { ...i, qty } : i
              );

        saveLocal(updated);
        return updated;
      });

      if (user) {
        try {
          const res =
            qty <= 0
              ? await cartAPI.remove(itemId)
              : await cartAPI.update(itemId, qty);

          syncItems(res.data.cart?.items || []);
        } catch {
          syncItems(snapshot);
          toast.error('Failed to update quantity. Please try again.');
        }
      }
    },
    [user, items, syncItems]
  );

  // ── Remove Item ────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (itemId) => {
      if (!itemId) {
        toast.error('Cannot remove item: missing ID.');
        return;
      }

      const snapshot = [...items];
      const optimistic = items.filter((i) => i._id !== itemId);

      syncItems(optimistic);

      if (user) {
        try {
          const res = await cartAPI.remove(itemId);
          syncItems(res.data.cart?.items || []);
          toast.success('Item removed');
        } catch {
          syncItems(snapshot);
          toast.error('Failed to remove item. Please try again.');
        }
      } else {
        toast.success('Item removed');
      }
    },
    [user, items, syncItems]
  );

  // ── Clear Cart ─────────────────────────────────────────────────────
  const clearCart = useCallback(
    async () => {
      const snapshot = [...items];
      syncItems([]);

      if (user) {
        try {
          await cartAPI.clear();
        } catch {
          syncItems(snapshot);
          toast.error('Failed to clear cart. Please try again.');
        }
      }
    },
    [user, items, syncItems]
  );

  // ── NEW: Get Item Quantity ────────────────────────────────────────
  const getItemQuantity = useCallback(
    (productId, size) => {
      const item = items.find(
        (i) => i.product === productId && i.size === size
      );

      return item ? item.qty : 0;
    },
    [items]
  );

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const shipping = subtotal >= 500 ? 0 : items.length > 0 ? 60 : 0;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        getItemQuantity,
        totalItems,
        subtotal,
        shipping,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);