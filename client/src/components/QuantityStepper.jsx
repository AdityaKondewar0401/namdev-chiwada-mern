import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

export default function QuantityStepper({
  product,
  size,
  price,
  disabled = false,
  compact = false,
  // `fab` — a small "Add" pill / compact mini-stepper sized to sit inline
  // next to the price on ProductCard's mobile layout, instead of the
  // full-width pill/stepper below. Independent of `compact`; the two are
  // never both true at once in practice.
  fab = false,
}) {
  const {
    addToCart,
    updateQuantity,
    removeFromCart,
    getItemQuantity,
  } = useCart();

  const qty = getItemQuantity(
    product._id,
    size
  );

  const handleAdd = (e) => {
    // preventDefault, not just stopPropagation: this button sits inside a
    // motion(Link) card. React Router's Link only skips navigation when
    // event.defaultPrevented is true — stopPropagation alone doesn't stop
    // its own onClick from also firing and navigating to the product page.
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    addToCart(
      product,
      size,
      price,
      1
    );
  };

  const handleIncrease = (
    e
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Matches the server's update-quantity ceiling (express-validator caps
    // qty at 99) — without this, clicking past it would update the UI
    // optimistically and then get silently reverted when the debounced
    // API call comes back 400.
    if (qty >= 99) return;

    updateQuantity(
      product._id,
      size,
      qty + 1
    );
  };

  const handleDecrease = (
    e
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (qty === 1) {
      removeFromCart(
        product._id,
        size
      );
    } else {
      updateQuantity(
        product._id,
        size,
        qty - 1
      );
    }
  };

  if (disabled) {
    if (fab) {
      return (
        <span
          title="Out of Stock"
          aria-label="Out of stock"
          className="grid h-8 w-8 place-items-center rounded-full text-white cursor-not-allowed"
          style={{ background: '#9ca3af', opacity: 0.7 }}
        >
          <span className="text-sm leading-none">✕</span>
        </span>
      );
    }
    return (
      <button
        disabled
        className={`w-full rounded-full font-bold text-white cursor-not-allowed ${
          compact
            ? 'py-2 text-xs'
            : 'py-3 text-sm'
        }`}
        style={{
          background:
            '#9ca3af',
          opacity: 0.7,
        }}
      >
        Out of Stock
      </button>
    );
  }

  if (fab) {
    return (
      <AnimatePresence mode="wait">
        {qty === 0 ? (
          <motion.button
            key="add-fab"
            onClick={handleAdd}
            aria-label="Add to cart"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="grid h-8 place-items-center rounded-full px-3.5 text-[11px] font-bold tracking-wide text-white"
            style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 4px 10px rgba(224,112,0,0.45)' }}
          >
            Add
          </motion.button>
        ) : (
          <motion.div
            key="stepper-fab"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="flex h-8 items-center gap-0.5 rounded-full px-1 text-white"
            style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 4px 10px rgba(224,112,0,0.45)' }}
          >
            <button onClick={handleDecrease} className="grid h-6 w-6 place-items-center text-white font-black text-sm">−</button>
            <span className="w-3 text-center text-[11px] font-black">{qty}</span>
            <button onClick={handleIncrease} className="grid h-6 w-6 place-items-center text-white font-black text-sm">+</button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {qty === 0 ? (
        <motion.button
          key="add"
          onClick={
            handleAdd
          }
          initial={{
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
          }}
          whileTap={{
            scale: 0.96,
          }}
          transition={{
            duration: 0.15,
          }}
          className={`w-full rounded-full font-bold text-white flex items-center justify-center ${
            compact
              ? 'py-2 text-xs'
              : 'py-3 text-sm'
          }`}
          style={{
            background:
              'linear-gradient(135deg,#e07000,#ff9010)',
          }}
        >
          {compact
            ? 'Add'
            : 'Add to Cart'}
        </motion.button>
      ) : (
        <motion.div
          key="stepper"
          initial={{
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
          }}
          transition={{
            duration: 0.15,
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={`w-full flex items-center justify-between rounded-full overflow-hidden ${
            compact
              ? 'h-9'
              : 'h-11'
          }`}
          style={{
            background:
              'linear-gradient(135deg,#e07000,#ff9010)',
          }}
        >
          <button
            onClick={
              handleDecrease
            }
            className={`text-white font-black ${
              compact
                ? 'w-9 h-9 text-base'
                : 'w-11 h-11 text-xl'
            }`}
          >
            −
          </button>

          <span
            className={`text-white font-black flex-1 text-center ${
              compact
                ? 'text-sm'
                : 'text-base'
            }`}
          >
            {qty}
          </span>

          <button
            onClick={
              handleIncrease
            }
            className={`text-white font-black ${
              compact
                ? 'w-9 h-9 text-base'
                : 'w-11 h-11 text-xl'
            }`}
          >
            +
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}