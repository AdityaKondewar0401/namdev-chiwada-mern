import { WHATSAPP_BOT_NUMBER, buildWhatsAppOrderLink } from '../config/whatsapp.config';

// Website entry point into the WhatsApp ordering bot (see the plan's
// "customers can order via the website or a boosted Instagram/Meta ad"
// requirement — this covers the website half; the ad half is Meta Ads
// Manager config + server/services/whatsappBotService.js reading the
// inbound `referral` object). Placed as a secondary action next to
// "Add to Cart" on ProductDetailPage.
//
// Renders nothing until VITE_WHATSAPP_BOT_NUMBER is configured (Phase 0)
// — see whatsapp.config.js for why there's no hardcoded fallback number.
export default function OrderOnWhatsAppButton({ product, className = '' }) {
  if (!WHATSAPP_BOT_NUMBER) return null;

  return (
    <a
      href={buildWhatsAppOrderLink(product)}
      target="_blank"
      rel="noopener noreferrer"
      title="Order this on WhatsApp"
      className={`shrink-0 flex items-center justify-center gap-2 rounded-full font-bold text-sm border-2 transition-colors hover:bg-[#25D366]/10 ${className}`}
      style={{ borderColor: '#25D366', color: '#1a9c4c' }}
    >
      <img
        src="https://cdn.simpleicons.org/whatsapp/25D366"
        alt=""
        width={16}
        height={16}
        loading="lazy"
        decoding="async"
        className="pointer-events-none"
      />
      Order on WhatsApp
    </a>
  );
}
