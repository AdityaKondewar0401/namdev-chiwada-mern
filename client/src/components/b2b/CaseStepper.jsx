// Case-count +/- control for the Quick Order page. Deliberately separate
// from client/src/components/QuantityStepper.jsx (spec §8.4 — that one
// is bound to the retail cart's product+size identity and quantity
// semantics; this one is just a plain controlled integer >= 0, unaware
// of carts, MOQ enforcement (shown as an inline error by the caller
// instead), or any retail state).
export default function CaseStepper({ value, onChange, min = 0, disabled = false }) {
  const dec = () => !disabled && onChange(Math.max(min, value - 1));
  const inc = () => !disabled && onChange(value + 1);

  return (
    <div
      className="inline-flex items-center rounded-full overflow-hidden"
      style={{ border: '1px solid rgba(224,112,0,0.25)', opacity: disabled ? 0.5 : 1 }}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease cases"
        className="flex items-center justify-center font-bold text-brown-dark disabled:opacity-40"
        style={{ width: 44, height: 44, background: '#fef3e0' }}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Number of cases"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
          onChange(Number.isNaN(n) ? min : Math.max(min, n));
        }}
        className="text-center font-bold text-brown-dark bg-white"
        style={{ width: 44, height: 44 }}
      />
      <button
        type="button"
        onClick={inc}
        disabled={disabled}
        aria-label="Increase cases"
        className="flex items-center justify-center font-bold text-white disabled:opacity-40"
        style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#e07000,#ff9010)' }}
      >
        +
      </button>
    </div>
  );
}
