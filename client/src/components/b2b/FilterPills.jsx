import { motion } from 'framer-motion';

// Shared horizontally-scrolling status-filter row — previously
// duplicated (same inline style object, same hex values) in
// B2BOrdersPage, B2BLayout, admin B2BAccountsTab, admin B2BOrdersTab.
// The active pill now glides between options via a Framer Motion
// shared-layout `layoutId`, the same technique AccountNav.jsx already
// uses for the account sub-nav — every caller gets that animation for
// free just by adopting this component.
export default function FilterPills({ options, value, onChange, layoutId }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="relative isolate px-4 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0"
            style={{
              height: 40,
              border: active ? 'none' : '1px solid rgba(224,112,0,0.15)',
              background: active ? 'transparent' : '#fff',
            }}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full -z-10"
                style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className={`relative z-10 ${active ? 'text-white' : 'text-brown-dark'}`}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
