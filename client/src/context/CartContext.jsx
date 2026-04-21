import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

  const [items, setItems] = useState([]);
  const [loading, setLoading] =
    useState(false);

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

    const initCart = async () => {
      if (!user) {
        syncItems(loadLocal());
        return;
      }

      setLoading(true);

      try {
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

          syncItems(
            res.data.cart
              ?.items || []
          );
        } catch {
          syncItems(snapshot);
          toast.error(
            'Failed to add item.'
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
     FIXED: Update Quantity
     productId + size + qty
  =============================== */
  const updateQuantity =
    useCallback(
      async (
        productId,
        size,
        qty
      ) => {
        const snapshot = [
          ...items,
        ];

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

        setItems(updated);
        saveLocal(updated);

        if (user) {
          try {
            const res =
              await cartAPI.update(
                productId,
                size,
                qty
              );

            syncItems(
              res.data.cart
                ?.items || []
            );
          } catch {
            syncItems(
              snapshot
            );
            toast.error(
              'Failed to update quantity'
            );
          }
        }
      },
      [items, user, syncItems]
    );

  /* ===============================
     FIXED Remove
     accepts itemId OR productId+size
  =============================== */
  const removeFromCart =
    useCallback(
      async (
        id,
        size = null
      ) => {
        const snapshot = [
          ...items,
        ];

        const updated =
          size
            ? items.filter(
                (i) =>
                  !(
                    i.product ===
                      id &&
                    i.size ===
                      size
                  )
              )
            : items.filter(
                (i) =>
                  i._id !==
                  id
              );

        setItems(updated);
        saveLocal(updated);

        if (user) {
          try {
            if (size) {
              await cartAPI.update(
                id,
                size,
                0
              );
            } else {
              await cartAPI.remove(
                id
              );
            }
          } catch {
            syncItems(
              snapshot
            );
            toast.error(
              'Failed to remove item'
            );
          }
        }
      },
      [items, user, syncItems]
    );

  /* ===============================
     Clear Cart
  =============================== */
  const clearCart =
    useCallback(
      async () => {
        const snapshot = [
          ...items,
        ];

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
     Helper
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
      (s, i) =>
        s + i.qty,
      0
    );

  const subtotal =
    items.reduce(
      (s, i) =>
        s +
        i.price *
          i.qty,
      0
    );

  const shipping =
    subtotal >= 500
      ? 0
      : items.length > 0
      ? 60
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