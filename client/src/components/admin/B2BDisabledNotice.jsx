import { useB2BEnabled } from '../../hooks/useB2BEnabled';

// Shown at the top of every admin B2B tab while B2B_ENABLED is false
// (spec Part B1: "Admins always see a small notice... while disabled").
// Renders nothing once the feature is live.
export default function B2BDisabledNotice() {
  const { enabled, loading } = useB2BEnabled();
  if (loading || enabled) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-4"
      style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
    >
      <span aria-hidden="true">👁️‍🗨️</span>
      Wholesale is hidden from customers (B2B_ENABLED is off). You can still set everything up here.
    </div>
  );
}
