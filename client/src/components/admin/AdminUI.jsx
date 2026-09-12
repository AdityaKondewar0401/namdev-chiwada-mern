// ─────────────────────────────────────────────
// AdminUI — small shared visual primitives for the admin section.
//
// Every admin tab was independently re-declaring the exact same
// `bg-white rounded-2xl` + shadow/border pair (DashboardTab's KpiCard/
// PanelCard, ProductsTab's rows, PromoCodesTab's cards, OrdersTab's
// inline styles). Pulling the three most-copied pieces out here means
// future admin UI stays visually consistent by construction instead of
// by convention. Deliberately small — this is not a full design system.
// ─────────────────────────────────────────────

const PANEL_SHADOW = '0 4px 20px rgba(45,26,0,0.06)';
const PANEL_BORDER = '1px solid rgba(224,112,0,0.08)';

// A titled white card — the base unit of almost every admin surface.
export function Panel({ title, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 ${className}`}
      style={{ boxShadow: PANEL_SHADOW, border: PANEL_BORDER }}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-bold text-brown-dark text-xs sm:text-sm uppercase tracking-wider">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// A single glanceable number — used for KPI rows (Dashboard, Users, Promo
// Codes) so every stat tile in the admin section looks identical.
//
// `icon` is a lucide-react element (e.g. <Wallet size={19} />), not emoji —
// it sits in a rounded tile tinted to a translucent version of `color`
// (an 8-digit #RRGGBBAA computed from the 6-digit hex, so every tile's
// tint stays visually tied to its own number without a second prop).
export function StatTile({ icon, label, value, color = '#e07000', sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5"
      style={{ boxShadow: PANEL_SHADOW, border: PANEL_BORDER }}>
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[11px] flex items-center justify-center mb-3"
        style={{ background: `${color}1A`, color }}>
        {icon}
      </div>
      <div className="font-black text-lg sm:text-2xl mb-0.5" style={{ color }}>{value}</div>
      <div className="text-[10px] sm:text-xs text-brown-mid/60 font-medium">{label}{sub ? ` · ${sub}` : ''}</div>
    </div>
  );
}

// A small colored badge — status/role/payment pills across the admin
// section, driven by the color configs in adminConstants.js.
export function Pill({ children, color, bg, border }) {
  return (
    <span
      className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 whitespace-nowrap"
      style={{ color, background: bg, border: border ? `1px solid ${border}` : undefined }}
    >
      {children}
    </span>
  );
}

// A round initial avatar — reused for the customer avatars already
// hand-rolled in OrdersTab/DashboardTab and now the Users tab.
export function Avatar({ name, size = 36 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
      style={{
        width: size, height: size, fontSize: Math.max(11, size * 0.4),
        background: 'linear-gradient(135deg,#e07000,#ff9010)',
      }}
    >
      {(name || 'G').charAt(0).toUpperCase()}
    </div>
  );
}
