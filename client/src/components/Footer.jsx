import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

// Real links per the business's actual profiles/number. WhatsApp is back in
// this row with the actual number — the floating WhatsAppFloat button is a
// separate, always-on shortcut, not a reason to leave this one a dead link.
// YouTube has no confirmed channel URL yet, so it stays a "#" placeholder
// until one is provided.
const SOCIALS = [
  {
    slug: "instagram",
    label: "Instagram",
    color: "E4405F",
    href: "https://www.instagram.com/namdevchiwda?igsh=aGJoeDE3eDhpOXRx",
  },
  {
    slug: "facebook",
    label: "Facebook",
    color: "1877F2",
    href: "https://www.facebook.com/share/19AojeQWs4/",
  },
  {
    slug: "whatsapp",
    label: "WhatsApp",
    color: "25D366",
    href: "https://wa.me/919130160491",
  },
];

const QUICK_LINKS = [
  ["Home", "/"],
  ["Products", "/products"],
  ["Contact", "/contact"],
  ["Cart", "/cart"],
];

const PRODUCTS = [
  "Special Namkeen",
  "Dagdi Chiwda",
  "Maka Chiwda",
  "Bakarwadi",
];

const CONTACT = [
  {
    Icon: MapPin,
    text: "205/A, Suhas Building, Killa Road, Solapur – 413007",
  },
  { Icon: Phone, text: "+91 9130160491" },
  { Icon: Mail, text: "namdevchiwada@gmail.com" },
  { Icon: Clock, text: "Mon–Sat: 9AM–8PM · Sun: 10AM–6PM" },
];

function ColumnLabel({ children }) {
  return (
    <div className="text-[11px] md:text-xs font-semibold tracking-[0.2em] uppercase text-gold mb-4 md:mb-5 relative inline-block">
      {children}
      <span className="absolute -bottom-2 left-0 w-6 h-px bg-gold/60" />
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="site-footer"
      className="bg-brown-dark text-white pt-10 md:pt-16 pb-10 md:pb-8"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-9 md:gap-x-8 md:gap-y-10 pb-8 md:pb-10 border-b border-white/10 items-start">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 text-center md:text-left">
            <div className="mb-4 flex justify-center md:justify-start">
              <img
                src="/images/logo.png"
                alt="Namdev Chiwda"
                className="h-14 md:h-16 w-auto object-contain"
              />
            </div>

            <p className="text-saffron font-devanagari text-sm mb-3 tracking-wide">
              खमंग · स्वादिष्ट · रुचकर
            </p>

            <p className="text-white/60 text-sm leading-relaxed mb-5 md:mb-6 max-w-xs mx-auto md:mx-0">
              Since 1873, crafting authentic Maharashtrian chiwda with love,
              tradition, and the finest ingredients.
            </p>

            <div className="flex gap-3 justify-center md:justify-start">
              {SOCIALS.map(({ slug, label, color, href }) => (
                <a
                  key={slug}
                  href={href}
                  target={href !== "#" ? "_blank" : undefined}
                  rel={href !== "#" ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  style={{ "--brand": `#${color}` }}
                  className="w-11 h-11 rounded-full border border-white/10 bg-white/[0.06] flex items-center justify-center transition-all duration-300 hover:bg-white active:scale-95 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
                >
                  <img
                    src={`https://cdn.simpleicons.org/${slug}/${color}`}
                    alt={label}
                    width={18}
                    height={18}
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <nav aria-label="Quick links" className="col-span-1 text-left">
            <ColumnLabel>Quick Links</ColumnLabel>

            <div className="flex flex-col gap-3 mt-3">
              {QUICK_LINKS.map(([label, to]) => (
                <Link
                  key={to}
                  to={to}
                  className="group relative w-fit text-white/70 hover:text-white text-[13px] md:text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 rounded-sm"
                >
                  {label}
                  <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-saffron transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          </nav>

          {/* Products */}
          <nav aria-label="Our products" className="col-span-1 text-left">
            <ColumnLabel>Our Products</ColumnLabel>

            <div className="flex flex-col gap-3 mt-3">
              {PRODUCTS.map((product) => (
                <Link
                  key={product}
                  to="/products"
                  className="group relative w-fit text-white/70 hover:text-white text-[13px] md:text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 rounded-sm"
                >
                  {product}
                  <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-saffron transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          </nav>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1 text-left">
            <ColumnLabel>Contact</ColumnLabel>

            <div className="flex flex-col gap-3.5 md:gap-4 mt-3">
              {CONTACT.map(({ Icon, text }) => (
                <div
                  key={text}
                  className="flex gap-3 items-start max-w-xs md:max-w-[220px]"
                >
                  <Icon
                    size={16}
                    strokeWidth={1.75}
                    className="text-saffron shrink-0 mt-0.5"
                  />
                  <span className="text-white/60 text-[13px] md:text-sm leading-relaxed">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 md:pt-7 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-3 text-white/40 text-[11px] md:text-xs text-center">
          <span>© {year} Namdev Chiwda. All rights reserved.</span>
          <span>Made with ❤️ in Solapur</span>
        </div>
      </div>
    </footer>
  );
}
