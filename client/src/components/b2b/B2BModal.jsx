import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { fadeIn, slideInBottom } from '../../utils/animations';

// Shared modal shell for every B2B admin/dashboard modal this phase —
// a centered dialog on desktop, a full-height bottom sheet on mobile
// (rounded top only, anchored to the bottom, backdrop tap to close),
// with a visible close button and body scroll locked while open.
//
// Animated via the site's own shared variants (utils/animations.js) —
// slideInBottom on the panel reads as a native app's bottom sheet on
// mobile and degrades to a gentle pop on desktop; fadeIn on the
// backdrop. Every caller passes children that already lift their own
// form state to the parent (never relies on the modal remounting to
// reset itself), so AnimatePresence instead of a hard unmount changes
// nothing behaviorally.
export default function B2BModal({ open, onClose, title, children, widthClass = 'sm:max-w-md' }) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            variants={fadeIn} initial="hidden" animate="visible" exit="exit"
            className="absolute inset-0" style={{ background: 'rgba(45,26,0,0.5)' }} onClick={onClose}
          />
          <motion.div
            variants={slideInBottom} initial="hidden" animate="visible" exit="exit"
            className={`relative w-full ${widthClass} bg-white flex flex-col max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl`}
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(224,112,0,0.1)' }}>
              <h2 className="font-serif font-bold text-brown-dark text-base pr-3">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#fef3e0', color: '#7a3300', minWidth: 44, minHeight: 44 }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
