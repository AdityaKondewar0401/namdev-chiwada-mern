const SIZES = { sm: 'w-5 h-5', md: 'w-8 h-8' };

// The loading spinner every B2B page previously hand-drew (identically)
// inline. Renders just the spinning ring — callers keep their own
// centering wrapper (`flex justify-center py-6`, etc.).
export default function Spinner({ size = 'md', className = '' }) {
  return <div className={`${SIZES[size] || SIZES.md} rounded-full border-2 border-saffron border-t-transparent animate-spin ${className}`} />;
}
