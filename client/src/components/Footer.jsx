import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-brown-dark text-white pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10 items-start">          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <img
                src="/images/logo.png"
                alt="Namdev Chiwada"
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-saffron font-devanagari text-sm mb-3">खमंग · स्वादिष्ट · रुचकर</p>
            <p className="text-white/60 text-sm leading-relaxed mb-5">
              Since 1873, crafting authentic Maharashtrian chiwda with love, tradition, and the finest ingredients.
            </p>
            <div className="flex gap-3">
              {['📸', '👥', '▶️', '💬'].map((icon, i) => (
                <button key={i} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-saffron flex items-center justify-center text-lg transition-all duration-200 hover:-translate-y-0.5">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:mt-0 mt-4">
            <div className="text-xs font-bold tracking-widest uppercase text-saffron mb-5">Quick Links</div>
            <div className="flex flex-col gap-3">
              {[['Home', '/'], ['Products', '/products'], ['Contact', '/contact'], ['Cart', '/cart']].map(([label, to]) => (
                <Link key={to} to={to} className="text-white/70 hover:text-white text-sm transition-colors">{label}</Link>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="md:mt-0 mt-4">
            <div className="text-xs font-bold tracking-widest uppercase text-saffron mb-5">Our Products</div>
            <div className="flex flex-col gap-3">
              {['Special Namkeen', 'Dagdi Chiwada', 'Maka Chiwada', 'Bakarwadi', ].map((p) => (
                <Link key={p} to="/products" className="text-white/70 hover:text-white text-sm transition-colors">{p}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="md:mt-0 mt-4">
            <div className="text-xs font-bold tracking-widest uppercase text-saffron mb-5">Contact</div>
            <div className="flex flex-col gap-4">
              {[
                { icon: '📍', text: '205/A, Suhas Building, Killa Road, Solapur – 413007' },
                { icon: '📞', text: '+91 99753 33427' },
                { icon: '✉️', text: 'namdevchiwada@gmail.com' },
                { icon: '🕐', text: 'Mon–Sat: 9AM–8PM · Sun: 10AM–6PM' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex gap-3 items-start">
                  <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                  <span className="text-white/60 text-sm leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-xs">
          <span>© {year} Namdev Chiwada. All rights reserved.</span>
          <span>Made with ❤️ in Solapur</span>
        </div>
      </div>
    </footer>
  );
}
