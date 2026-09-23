// Shared stat-tile grid — the same "label + big number, in a .card" tile
// was independently hand-built in B2BDashboardPage/B2BStatementPage
// (3-tile), admin B2BLedgerTab (4-tile), and admin B2BAccountsTab's
// detail drawer (a smaller `compact` variant). One component, three
// shapes via props, so a future visual tweak only happens once.
//
// `tiles`: [{ label: string, value: ReactNode }] — value is typically
// a <Money value={...} /> the caller already builds.
export default function StatGrid({ tiles, cols = 3, compact = false }) {
  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="card p-3 text-center">
            <div className="text-[10px] font-semibold uppercase text-brown-mid/50">{t.label}</div>
            <div className="font-bold text-brown-dark text-sm mt-1">{t.value}</div>
          </div>
        ))}
      </div>
    );
  }

  const gridCols = cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3';
  return (
    <div className={`grid ${gridCols} gap-3`}>
      {tiles.map((t, i) => (
        <div key={t.label} className={`card p-4 ${cols === 3 && i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-brown-mid/50">{t.label}</div>
          <div className="font-serif font-black text-brown-dark text-lg mt-1">{t.value}</div>
        </div>
      ))}
    </div>
  );
}
