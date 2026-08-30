// ─────────────────────────────────────────────
// DistributorshipBand  (NEW COMPONENT)
//
// A compact B2B section inviting retailers/distributors to reach
// out. Placed on the homepage after the heritage story + product
// sections, right before the footer (see HomePage.jsx).
//
// Design choice: a deeper brown/gold "trade" band — visually
// distinct from the saffron/cream consumer sections and from the
// existing green "Corporate Gifting" WhatsApp CTA — so it reads as
// a separate, B2B-facing ask rather than another add-to-cart prompt.
//
// Contact-method choice: direct click-to-contact (WhatsApp primary,
// phone + email secondary), not a form and not routed through
// ContactPage — keeps this a single self-contained homepage section
// per the brief's "your call" note. No dedicated distributorship
// phone line was provided, so this reuses the existing brand contact
// details (from Footer.jsx / ContactPage pattern). Swap the
// constants below if/when a dedicated trade line exists.
// ─────────────────────────────────────────────

const PHONE_DISPLAY = '+91 91301 60491';
const PHONE_TEL = '+919130160491';
const WHATSAPP_NUMBER = '919130160491';
const EMAIL = 'care@namdevchiwda.com';

export default function DistributorshipBand() {
  return (
    <section
      id="distributorship"
      className="py-14 md:py-20 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #23140a 0%, #3d1c00 60%, #4a2200 100%)' }}
    >
      {/* Gold hairline top border, echoes the framing already used around NamkeenSection */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,#d4af37,transparent)' }}
      />

      <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-semibold uppercase mb-5"
          style={{
            borderColor: 'rgba(212,175,55,0.35)',
            background: 'rgba(212,175,55,0.08)',
            color: '#e7bf63',
            fontSize: '0.68rem',
            letterSpacing: '0.14em',
          }}
        >
          ● For Retailers &amp; Distributors
        </div>

        <h2
          className="font-serif font-black text-white leading-tight mb-3"
          style={{ fontSize: 'clamp(1.55rem,4.2vw,2.4rem)' }}
        >
          Bring Namdev Chiwda <span style={{ color: '#d4a843' }}>to Your Shelves</span>
        </h2>

        <p
          className="mx-auto mb-8"
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 'clamp(0.85rem,1.8vw,1rem)',
            maxWidth: 480,
            lineHeight: 1.7,
          }}
        >
          Stock 150 years of Solapur's favourite namkeen in your store — we're onboarding
          retail and distribution partners across Pune, Solapur, and Maharashtra.
        </p>

        {/* Contact CTAs — both meet the ≥48×48px tap-target requirement with ≥8px gap */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              "Hi, I'm interested in a Namdev Chiwda distributorship / retail partnership."
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full font-bold text-white w-full sm:w-auto transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: '#25D366',
              height: 56,
              minWidth: 48,
              padding: '0 28px',
              fontSize: '0.95rem',
              boxShadow: '0 10px 28px rgba(37,211,102,0.3)',
            }}
          >
            💬 WhatsApp for Distributorship
          </a>

          <a
            href={`tel:${PHONE_TEL}`}
            className="inline-flex items-center justify-center gap-2 rounded-full font-bold w-full sm:w-auto transition-all duration-200"
            style={{
              height: 56,
              minWidth: 48,
              padding: '0 24px',
              fontSize: '0.9rem',
              color: '#f0cc5a',
              border: '1.5px solid rgba(212,175,55,0.45)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            📞 {PHONE_DISPLAY}
          </a>
        </div>

        <a
          href={`mailto:${EMAIL}?subject=${encodeURIComponent('Distributorship Inquiry')}`}
          className="inline-flex items-center justify-center mt-2 underline underline-offset-4 decoration-white/20 hover:decoration-white/50 transition-colors"
          style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', minHeight: 48, padding: '8px 12px' }}
        >
          ✉️ {EMAIL}
        </a>
      </div>
    </section>
  );
}