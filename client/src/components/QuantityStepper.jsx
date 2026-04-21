import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

/**
 * QuantityStepper
 *
 * Shows "Add to Cart" button when qty = 0
 * Shows [ - ] N [ + ] stepper when qty > 0
 *
 * Props:
 *  product   — full product object { _id, name, img }
 *  size      — selected size string e.g. "250g"
 *  price     — price for selected size
 *  disabled  — true when out of stock
 *  compact   — smaller size for tight spaces (optional)
 */
export default function QuantityStepper({
  product,
  size,
  price,
  disabled = false,
  compact = false,
}) {
  const { addToCart, updateQty, getItemQuantity, getCartItem } = useCart();
  const qty = getItemQuantity(product._id, size);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (disabled) return;
    addToCart(product, size, price, 1);
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    const item = getCartItem(product._id, size);
    if (!item) return;
    updateQty(item._id, qty + 1);
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    const item = getCartItem(product._id, size);
    if (!item) return;
    updateQty(item._id, qty - 1);
    // qty - 1 = 0 means updateQty removes it automatically
  };

  // ── Out of Stock ────────────────────────────────────
  if (disabled) {
    return (
      <button disabled
        className={`
          w-full rounded-full font-bold text-white cursor-not-allowed
          ${compact ? 'py-2 text-xs' : 'py-3 text-sm'}
        `}
        style={{ background: '#9ca3af', opacity: 0.7 }}>
        ❌ Out of Stock
      </button>
    );
  }

  // ── Stepper or Button ────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      {qty === 0 ? (
        // ── Add to Cart Button ────────────────────────
        <motion.button
          key="add-btn"
          onClick={handleAdd}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          whileTap={{ scale: 0.96 }}
          className={`
            w-full rounded-full font-bold text-white transition-all duration-200
            flex items-center justify-center gap-2
            ${compact ? 'py-2 text-xs' : 'py-3 text-sm'}
          `}
          style={{
            background: 'linear-gradient(135deg,#e07000,#ff9010)',
            boxShadow: '0 4px 14px rgba(224,112,0,0.35)',
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {compact ? 'Add' : 'Add to Cart'}
        </motion.button>
      ) : (
        // ── Quantity Stepper ──────────────────────────
        <motion.div
          key="stepper"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className={`
            w-full flex items-center justify-between rounded-full overflow-hidden
            ${compact ? 'h-9' : 'h-11'}
          `}
          style={{
            background: 'linear-gradient(135deg,#e07000,#ff9010)',
            boxShadow: '0 4px 14px rgba(224,112,0,0.35)',
          }}>

          {/* Decrease button */}
          <motion.button
            onClick={handleDecrease}
            whileTap={{ scale: 0.85 }}
            className={`
              flex items-center justify-center text-white font-black
              transition-all duration-150 hover:bg-white/20 flex-shrink-0
              ${compact ? 'w-9 h-9 text-base' : 'w-11 h-11 text-xl'}
            `}>
            −
          </motion.button>

          {/* Quantity display */}
          <AnimatePresence mode="wait">
            <motion.span
              key={qty}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className={`
                text-white font-black select-none flex-1 text-center
                ${compact ? 'text-sm' : 'text-base'}
              `}>
              {qty}
            </motion.span>
          </AnimatePresence>

          {/* Increase button */}
          <motion.button
            onClick={handleIncrease}
            whileTap={{ scale: 0.85 }}
            className={`
              flex items-center justify-center text-white font-black
              transition-all duration-150 hover:bg-white/20 flex-shrink-0
              ${compact ? 'w-9 h-9 text-base' : 'w-11 h-11 text-xl'}
            `}>
            +
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
