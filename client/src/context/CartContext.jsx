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

// Single helper — always call this to update both state and localStorage together.
// Never call saveLocal separately — that was the source of timing bugs.
const saveLocal = (items) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Sync helper: update state + localStorage atomically ──
  // All operations must go through this instead of calling
  // setItems and saveLocal separately at different times.
  const syncItems = useCallback((newItems) => {
    setItems(newItems);
    saveLocal(newItems);
  }, []);

  // ── Load cart on mount / user change ────────────────────
  useEffect(() => {
    let cancelled = false; // prevent state update if component unmounts mid-fetch

    const initCart = async () => {
      if (!user) {
        // Guest — localStorage only, nothing to fetch
        syncItems(loadLocal());
        return;
      }

      setLoading(true);
      try {
        const res = await cartAPI.get();
        if (cancelled) return;

        const dbItems = res.data.cart?.items || [];

        if (dbItems.length > 0) {
          // DB has items — DB is source of truth. Use it directly.
          // FIX: previously this branch also checked localStorage, which
          // caused ghost items to reappear after a remove-then-refresh cycle.
          syncItems(dbItems);
        } else {
          // DB cart is empty — check if we have unsynced guest items to push
          const localItems = loadLocal();
          if (localItems.length > 0) {
            // Push guest cart to DB
            await Promise.all(
              localItems.map(item =>
                cartAPI.add({
                  productId: item.product || item._id,
                  name: item.name,
                  img: item.img,
                  price: item.price,
                  size: item.size,
                  qty: item.qty,
                }).catch(() => null) // individual item failures are non-fatal
              )
            );
            // Fetch the confirmed DB state after push
            const synced = await cartAPI.get();
            if (cancelled) return;
            const syncedItems = synced.data.cart?.items || [];
            syncItems(syncedItems);
          } else {
            // Both DB and local are empty — clean slate
            syncItems([]);
          }
        }
      } catch {
        if (cancelled) return;
        // DB unreachable — fall back to localStorage so user isn't blocked
        syncItems(loadLocal());
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initCart();
    return () => { cancelled = true; };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  // syncItems is stable (no deps) so it's safe to omit from the dep array here.
  // Adding it would cause an infinite loop because useCallback re-creates it
  // each render when user changes.

  // ── Add to Cart ─────────────────────────────────────────
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

    // Optimistic update so UI feels instant
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
        // Overwrite optimistic state with confirmed DB response
        const dbItems = res.data.cart?.items || [];
        syncItems(dbItems);
      } catch {
        // Optimistic state stays — item is at least in localStorage
        // so it will attempt to sync next time user logs in
        toast.error('Could not sync cart. Item saved locally.');
        saveLocal(items); // persist current optimistic state
      }
    } else {
      // Guest — persist optimistic state to localStorage immediately
      setItems((current) => { saveLocal(current); return current; });
    }

    toast.success(`${product.name} added to cart! 🛒`);
  }, [user, items, syncItems]);

  // ── Update Quantity ──────────────────────────────────────
  const updateQty = useCallback(async (itemId, qty) => {
    // Take a snapshot before optimistic update for rollback
    const snapshot = [...items];

    setItems((prev) => {
      const updated = qty <= 0
        ? prev.filter((i) => (i._id || i.id) !== itemId)
        : prev.map((i) => (i._id || i.id) === itemId ? { ...i, qty } : i);
      saveLocal(updated); // keep localStorage in sync immediately
      return updated;
    });

    if (user) {
      try {
        const res = qty <= 0
          ? await cartAPI.remove(itemId)
          : await cartAPI.update(itemId, qty);

        const dbItems = res.data.cart?.items || [];
        // Always trust the DB response — it may differ from our optimistic update
        syncItems(dbItems);
      } catch {
        // Rollback to pre-update state on any server failure
        syncItems(snapshot);
        toast.error('Failed to update quantity. Please try again.');
      }
    }
  }, [user, items, syncItems]);

  // ── Remove Item ──────────────────────────────────────────
  const removeFromCart = useCallback(async (itemId) => {
    // Snapshot for rollback in case the server call fails
    const snapshot = [...items];

    // Optimistic: remove from UI immediately
    const optimistic = items.filter((i) => (i._id || i.id) !== itemId);
    syncItems(optimistic); // update state + localStorage together

    if (user) {
      try {
        const res = await cartAPI.remove(itemId);
        // FIX: was previously an empty catch — silent failures left DB untouched,
        // causing ghost items to reappear on next page load.
        const dbItems = res.data.cart?.items || [];
        // Confirm with actual DB response so we're never out of sync
        syncItems(dbItems);
        toast.success('Item removed');
      } catch (err) {
        // Server call failed — roll back the optimistic remove
        syncItems(snapshot);
        toast.error('Failed to remove item. Please try again.');
        console.error('[Cart] removeFromCart failed:', err?.response?.status, err?.response?.data);
      }
    } else {
      // Guest — localStorage already updated by syncItems above
      toast.success('Item removed');
    }
  }, [user, items, syncItems]);

  // ── Clear Cart ───────────────────────────────────────────
  const clearCart = useCallback(async () => {
    const snapshot = [...items];
    syncItems([]);

    if (user) {
      try {
        await cartAPI.clear();
      } catch {
        // Rollback if server clear fails
        syncItems(snapshot);
        toast.error('Failed to clear cart. Please try again.');
      }
    }
  }, [user, items, syncItems]);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal   = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping   = subtotal >= 500 ? 0 : (items.length > 0 ? 60 : 0);
  const total      = subtotal + shipping;

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
