import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// Open sheets, oldest first, so Escape only closes the one on top.
const openSheets = [];

// Bottom sheet on phones, centered dialog on larger screens — same look as
// the Users tab's detail sheet. Render inside <AnimatePresence>, and never
// nest one inside another (the panel's transform would break position: fixed).
export default function AdminSheet({ title, onClose, children, maxWidth = 'sm:max-w-2xl', footer }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const id = Symbol(title);
    openSheets.push(id);
    const onKey = (e) => {
      if (e.key === 'Escape' && openSheets[openSheets.length - 1] === id) closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      openSheets.splice(openSheets.indexOf(id), 1);
      window.removeEventListener('keydown', onKey);
    };
  }, [title]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(45,26,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        role="dialog" aria-modal="true" aria-label={title}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full ${maxWidth} sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
          <span className="text-xs font-bold uppercase tracking-widest text-brown-mid/60">{title}</span>
          <button type="button" onClick={onClose} aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-brown-dark hover:bg-saffron/10">
            <X size={15} />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t flex-shrink-0 bg-white sm:rounded-b-3xl" style={{ borderColor: 'rgba(224,112,0,0.1)' }}>
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
