// ─────────────────────────────────────────────
// Lightweight analytics primitives — NEW.
//
// Deliberately built with plain SVG/CSS instead of pulling in a
// charting library (recharts, chart.js, etc.). This repo doesn't
// have one installed, and adding a new dependency for two small
// chart types is more than this needs. Both components below are
// dependency-free and reusable across the dashboard.
// ─────────────────────────────────────────────

// A compact bar chart for a short time series, e.g. "orders per day
// for the last 7 days." Renders as a scalable SVG so it stays crisp
// on any screen and shrinks cleanly on mobile.
export function MiniBarChart({ data, color = '#e07000' }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 280;
  const H = 90;
  const PAD_BOTTOM = 18;
  const barW = W / data.length;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barH = (d.value / max) * (H - PAD_BOTTOM) || 0;
          const x = i * barW + barW * 0.2;
          const w = barW * 0.6;
          return (
            <g key={i}>
              <rect
                x={x}
                y={H - PAD_BOTTOM - Math.max(barH, 2)}
                width={w}
                height={Math.max(barH, 2)}
                rx={3}
                fill={color}
                opacity={0.85}
              />
              {d.value > 0 && (
                <text
                  x={x + w / 2}
                  y={H - PAD_BOTTOM - Math.max(barH, 2) - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#7a5a38"
                  fontWeight="700"
                >
                  {d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex mt-1">
        {data.map((d, i) => (
          <div key={i} style={{ width: `${100 / data.length}%` }} className="text-center">
            <div className="text-[9px] font-bold text-brown-mid/45">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// A horizontal proportion bar + legend, used for "order status" and
// "products by category" breakdowns. `segments`: [{ label, count, color }]
export function SegmentedBar({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0) || 1;
  const nonZero = segments.filter((s) => s.count > 0);

  return (
    <div>
      <div className="flex w-full h-3 rounded-full overflow-hidden" style={{ background: '#f3ede2' }}>
        {nonZero.length === 0 ? (
          <div className="w-full h-full" />
        ) : (
          nonZero.map((s, i) => (
            <div
              key={i}
              style={{ width: `${(s.count / total) * 100}%`, background: s.color }}
              title={`${s.label}: ${s.count}`}
            />
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color, display: 'inline-block', flexShrink: 0 }} />
            <span className="text-xs text-brown-mid/70 capitalize">{s.label}</span>
            <span className="text-xs font-bold text-brown-dark">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}