import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

export default function QuantityStepper({
  product,
  size,
  price,
  disabled = false,
  compact = false,
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
    e.stopPropagation();

    updateQuantity(
      product._id,
      size,
      qty + 1
    );
  };

  const handleDecrease = (
    e
  ) => {
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
          onClick={(e) =>
            e.stopPropagation()
          }
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