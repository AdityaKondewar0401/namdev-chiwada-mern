import { motion } from 'framer-motion';

// Compact B2B band — retailers / distributors. Kept deliberately short:
// one line of copy, one primary action, contact details as quiet text.
// Dark brown band so it reads as a separate, trade-facing ask.

const WHATSAPP = '919130160491';
const PHONE_DISPLAY = '+91 91301 60491';
const PHONE_TEL = '+919130160491';
const EMAIL = 'care@namdevchiwda.com';
const WA_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Hi, I'm interested in a Namdev Chiwda distributorship / retail partnership."
)}`;

export default function DistributorshipBand() {
  return (
    <section
      id="distributorship"
      className="relative overflow-hidden py-14 md:py-16"
      style={{ background: 'linear-gradient(135deg,#23140a,#3d1c00 65%,#42210b)' }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-xl px-6 text-center"
      >
        <div
          className="text-[0.66rem] font-semibold uppercase"
          style={{ letterSpacing: '0.22em', color: '#c8902a' }}
        >
          For Retailers &amp; Distributors
        </div>

        <h2
          className="mt-4 font-serif font-black text-white"
          style={{ fontSize: 'clamp(1.5rem,4vw,2.05rem)', lineHeight: 1.2 }}
        >
          Bring Namdev Chiwda to your shelves
        </h2>

        <p
          className="mx-auto mt-3 max-w-sm text-sm"
          style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}
        >
          We're onboarding retail &amp; distribution partners across Maharashtra.
        </p>

        <a
          href={WA_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full px-7 font-semibold transition-transform duration-200 hover:-translate-y-0.5"
          style={{
            minHeight: 48,
            color: '#2d1a00',
            background: 'linear-gradient(135deg,#e7c877,#d4af37)',
            fontSize: '0.92rem',
          }}
        >
          Enquire on WhatsApp
          <span aria-hidden="true">→</span>
        </a>

        <div className="mt-5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <a href={`tel:${PHONE_TEL}`} className="transition-colors hover:text-white/70">
            {PHONE_DISPLAY}
          </a>
          <span className="mx-2 text-white/25">·</span>
          <a href={`mailto:${EMAIL}`} className="transition-colors hover:text-white/70">
            {EMAIL}
          </a>
        </div>
      </motion.div>
    </section>
  );
}
