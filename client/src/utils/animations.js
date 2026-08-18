// ─────────────────────────────────────────────
// Shared Framer Motion variants
// Import these in any component instead of
// writing inline transition props every time.
// ─────────────────────────────────────────────

const ease = [0.32, 0.72, 0, 1]; // iOS-style easing

// ── Fade up (most common — cards, sections, headings)
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease }
  },
  exit: {
    opacity: 0, y: -12,
    transition: { duration: 0.2, ease }
  }
};

// ── Simple fade (overlays, modals, backdrops)
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

// ── Slide in from right (drawer, mobile menu, side panels)
export const slideInRight = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0, opacity: 1,
    transition: { duration: 0.28, ease }
  },
  exit: {
    x: '100%', opacity: 0,
    transition: { duration: 0.22, ease }
  }
};

// ── Slide in from bottom (mobile sheets, toasts, drawers)
export const slideInBottom = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0, opacity: 1,
    transition: { duration: 0.28, ease }
  },
  exit: {
    y: '100%', opacity: 0,
    transition: { duration: 0.22, ease }
  }
};

// ── Scale in (dropdowns, popups, tooltips)
export const scaleIn = {
  hidden: { scale: 0.92, opacity: 0 },
  visible: {
    scale: 1, opacity: 1,
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } // spring
  },
  exit: {
    scale: 0.95, opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

// ── Stagger wrapper (product grids, feature lists, any list of children)
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    }
  },
  exit: {}
};

// ── Page transition (used in PageWrapper.jsx)
export const pageTransition = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease }
  },
  exit: {
    opacity: 0, y: -8,
    transition: { duration: 0.2, ease }
  }
};

// ── Zoom in (hero images, product gallery thumbnails)
export const zoomIn = {
  hidden: { scale: 0.96, opacity: 0 },
  visible: {
    scale: 1, opacity: 1,
    transition: { duration: 0.45, ease }
  },
  exit: {
    scale: 0.98, opacity: 0,
    transition: { duration: 0.2, ease }
  }
};

// ── Stagger child item (use inside staggerContainer)
export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease }
  }
};