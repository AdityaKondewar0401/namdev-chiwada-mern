import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);
const LOCAL_KEY = 'nc_cart';

const loadLocal = () => {
  try {
    return (
      JSON.parse(
        localStorage.getItem(LOCAL_KEY)
      ) || []
    );
  } catch {
    return [];
  }
};

const saveLocal = (items) => {
  localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify(items)
  );
};

const normalizeItems = (items = []) =>
  items.map((item) => ({
    ...item,
    _id:
      item._id?.$oid ||
      item._id?.toString?.() ||
      item._id ||
      item.id ||
      '',
    product:
      item.product?._id?.$oid ||
      item.product?._id?.toString?.() ||
      item.product?._id ||
      item.product?.toString?.() ||
      item.product ||
      '',
  }));

export const CartProvider = ({
  children,
}) => {
  const { user } = useAuth();

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  // debounce timers
  const pendingTimers =
    useRef({});

  // Tracks the user across renders so we can tell "just logged in this
  // session" (prevUserRef.current === null) apart from "page loaded with
  // an existing session" (prevUserRef.current === undefined) — only the
  // former should merge the guest cart, otherwise a page refresh while
  // already logged in would re-add the same lines and double quantities.
  const prevUserRef = useRef(undefined);

  const syncItems = useCallback(
    (rawItems) => {
      const normalized =
        normalizeItems(rawItems);

      setItems(normalized);
      saveLocal(normalized);
    },
    []
  );

  /* ===============================
     Load Cart
  =============================== */
  useEffect(() => {
    let cancelled = false;
    const justLoggedIn = prevUserRef.current === null;
    const guestItemsSnapshot = items;

    const initCart = async () => {
      if (!user) {
        syncItems(loadLocal());
        prevUserRef.current = null;
        return;
      }

      setLoading(true);

      try {
        // Merge the guest cart into the server cart exactly once, on the
        // transition from logged-out to logged-in within this session —
        // previously the server cart just overwrote local state and any
        // guest-added items were silently discarded.
        if (justLoggedIn && guestItemsSnapshot.length > 0) {
          for (const guestItem of guestItemsSnapshot) {
            try {
              await cartAPI.add({
                productId: guestItem.product,
                size: guestItem.size,
                qty: guestItem.qty,
              });
            } catch {
              // Best-effort — one bad guest line shouldn't block the rest.
            }
          }
        }

        const res =
          await cartAPI.get();

        if (cancelled) return;

        syncItems(
          res.data.cart?.items || []
        );
      } catch {
        if (!cancelled) {
          syncItems(loadLocal());
        }
      } finally {
        if (!cancelled)
          setLoading(false);
      }

      prevUserRef.current = user._id || user.id || true;
    };

    initCart();

    return () => {
      cancelled = true;
    };
  }, [user, syncItems]);

  /* ===============================
     Add To Cart
  =============================== */
  const addToCart = useCallback(
    async (
      product,
      size,
      price,
      qty = 1
    ) => {
      const snapshot = [...items];

      const existing =
        items.find(
          (i) =>
            i.product ===
              product._id &&
            i.size === size
        );

      let updated;

      if (existing) {
        updated = items.map((i) =>
          i.product ===
            product._id &&
          i.size === size
            ? {
                ...i,
                qty:
                  i.qty + qty,
              }
            : i
        );
      } else {
        updated = [
          ...items,
          {
            _id: `local_${Date.now()}`,
            product:
              product._id,
            name:
              product.name,
            img: product.img,
            price,
            size,
            qty,
          },
        ];
      }

      setItems(updated);
      saveLocal(updated);

      if (user) {
        try {
          const res =
            await cartAPI.add({
              productId:
                product._id,
              name:
                product.name,
              img: product.img,
              price,
              size,
              qty,
            });

          // Server is the source of truth for _id — the optimistic item
          // above used a fake `local_...` id, so without this a later
          // removeFromCart would send that fake id to the server, match
          // nothing, and the item would silently reappear on next sync.
          syncItems(
            res.data.cart?.items ||
              []
          );
        } catch {
          syncItems(snapshot);
          toast.error(
            'Failed to add item'
          );
          return;
        }
      }

      toast.success(
        `${product.name} added to cart 🛒`
      );
    },
    [items, user, syncItems]
  );

  /* ===============================
     PRODUCTION DEBOUNCED UPDATE
     Instant UI + delayed API sync
  =============================== */
  const updateQuantity =
    useCallback(
      (
        productId,
        size,
        qty
      ) => {
        const key = `${productId}_${size}`;

        const snapshot = [...items];

        const updated =
          qty <= 0
            ? items.filter(
                (i) =>
                  !(
                    i.product ===
                      productId &&
                    i.size ===
                      size
                  )
              )
            : items.map(
                (i) =>
                  i.product ===
                    productId &&
                  i.size ===
                    size
                    ? {
                        ...i,
                        qty,
                      }
                    : i
              );

        // instant update
        setItems(updated);
        saveLocal(updated);

        if (!user) return;

        // clear previous timer
        if (
          pendingTimers.current[
            key
          ]
        ) {
          clearTimeout(
            pendingTimers.current[
              key
            ]
          );
        }

        // debounce request
        pendingTimers.current[
          key
        ] = setTimeout(
          async () => {
            try {
              await cartAPI.update(
                productId,
                size,
                qty
              );
            } catch {
              syncItems(
                snapshot
              );
              toast.error(
                'Failed to update quantity'
              );
            }
          },
          400
        );
      },
      [items, user, syncItems]
    );

  /* ===============================
     Remove
  =============================== */
  const removeFromCart =
    useCallback(
      (
        id,
        size = null
      ) => {
        if (size) {
          updateQuantity(
            id,
            size,
            0
          );
          return;
        }

        const snapshot = [...items];

        const updated =
          items.filter(
            (i) =>
              i._id !== id
          );

        setItems(updated);
        saveLocal(updated);

        if (user) {
          cartAPI
            .remove(id)
            .catch(() => {
              syncItems(
                snapshot
              );
              toast.error(
                'Failed to remove item'
              );
            });
        }
      },
      [
        items,
        user,
        syncItems,
        updateQuantity,
      ]
    );

  /* ===============================
     Clear Cart
  =============================== */
  const clearCart =
    useCallback(
      async () => {
        const snapshot = [...items];

        setItems([]);
        saveLocal([]);

        if (user) {
          try {
            await cartAPI.clear();
          } catch {
            syncItems(
              snapshot
            );
          }
        }
      },
      [items, user, syncItems]
    );

  /* ===============================
     Helpers
  =============================== */
  const getItemQuantity =
    useCallback(
      (
        productId,
        size
      ) => {
        const item =
          items.find(
            (i) =>
              i.product ===
                productId &&
              i.size ===
                size
          );

        return item
          ? item.qty
          : 0;
      },
      [items]
    );

  const totalItems =
    items.reduce(
      (sum, item) =>
        sum + item.qty,
      0
    );

  const subtotal =
    items.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.qty,
      0
    );

  const shipping =
    subtotal >= 499
      ? 0
      : items.length > 0
      ? 49
      : 0;

  const total =
    subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        updateQuantity,
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

export const useCart = () =>
  useContext(CartContext);