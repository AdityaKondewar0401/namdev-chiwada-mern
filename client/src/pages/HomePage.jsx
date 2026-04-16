import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';
import useReveal from '../hooks/useReveal';
import NamkeenSection from '../components/NamkeenSection';

const MARQUEE_ITEMS = ['Dagdi-Poha Chiwada', 'Maka Chiwada', 'Bakarwadi', 'Lasun Sev', 'Shengdana Chutney', 'Special Farsan', 'Authentic Taste'];
const TRUST = ['150+ Years Legacy', 'No Artificial Colors', 'FSSAI Licensed', 'Pan-India Delivery'];
const FEATURES = [
  { icon: '🔥', title: 'Perfectly Roasted Blend', desc: 'Each batch is carefully roasted and blended for that signature Namdev crunch.' },
  { icon: '🏺', title: '150 Years of Craft', desc: 'A recipe passed down through six generations of the Namdev family.' },
  { icon: '🚚', title: 'Pan-India Delivery', desc: 'Fresh-packed and shipped within 24 hours of your order.' },
  { icon: '🌿', title: '100% Vegetarian', desc: 'No artificial colors, preservatives or additives. Ever.' },
];
const TESTIMONIALS = [
  { name: 'Vedant Lavate', city: 'Kolhapur', text: 'The Special Namkeen takes me back to my childhood in Solapur. Absolutely authentic!', rating: 5 },
  { name: 'Aditya Pawar', city: 'SambajiNagar', text: 'Ordered the Bakarwadi for Diwali gifting — everyone loved it. Will order again!', rating: 5 },
  { name: 'Umesh Chakure', city: 'Latur', text: 'The Dagdi Chiwada is perfectly crispy with just the right amount of spice. Love it!', rating: 5 },
];

function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="hero-gradient relative overflow-hidden flex items-center"
      style={{ minHeight: 'clamp(580px, 100svh, 100vh)', paddingTop: '72px' }}>

      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-cream to-transparent pointer-events-none z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 w-full relative z-10">
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-8 md:items-start">

          {/* LEFT — text, always below image on mobile */}
          <div className="text-center md:text-left order-2 md:order-1 mt-2 md:mt-0">

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/25 bg-white/10 text-gold-light font-semibold tracking-widest uppercase mb-4 md:mb-6"
              style={{ fontSize: 'clamp(0.58rem, 1.8vw, 0.75rem)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-gold-light flex-shrink-0" />
              Since 1873 · Solapur, Maharashtra
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif font-black text-white leading-[1.08] mb-3"
              style={{ fontSize: 'clamp(1.9rem, 5vw, 4rem)', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              Authentic Taste,<br />
              <span className="shimmer-text">Timeless Tradition</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="mb-5 md:mb-6"
              style={{
                fontFamily: "'Gotu', sans-serif",
                fontSize: 'clamp(0.82rem, 2vw, 1.3rem)',
                color: 'rgba(255,255,255,0.90)',
                background: 'linear-gradient(90deg, #ffd89b, #f0cc5a, #ffd89b)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.02em',
              }}>
              खमंग चिवडा — पिढ्यानपिढ्याची चव
            </motion.p>

            {/* Buttons — stacked on mobile, side by side on sm+ */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-10 items-stretch sm:items-center justify-center md:justify-start">
              <button
                onClick={() => navigate('/products')}
                className="btn-primary font-poppins text-sm md:text-base px-7 py-3 md:px-8 md:py-3.5 text-center">
                Shop Now →
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-outline font-poppins text-sm md:text-base px-7 py-3 md:px-8 md:py-3.5 text-center">
                Our Story
              </button>
            </motion.div>

            {/* Trust badges — 2×2 grid on mobile, row on desktop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:gap-5 justify-center md:justify-start">
              {TRUST.map((t) => (
                <div key={t}
                  className="flex items-center gap-1.5 text-white/75 justify-center md:justify-start"
                  style={{ fontSize: 'clamp(0.68rem, 1.5vw, 0.8rem)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-light flex-shrink-0" />
                  <span className="whitespace-nowrap">{t}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — image, shows above text on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center justify-center relative order-1 md:order-2 md:-translate-y-12">

            {/* Spinning ring — desktop only */}
            <div className="hidden md:block absolute w-[110%] h-[110%] rounded-full border-2 border-dashed border-white/15 animate-spinSlow" />

            <img
              src="https://res.cloudinary.com/dz7ykg6qr/image/upload/v1776256647/special1_sy4zxa.png"
              alt="Namdev Chiwada — Premium Namkeen"
              className="relative z-10 animate-float w-full"
              style={{
                maxWidth: 'clamp(180px, 65vw, 880px)',
                filter: 'drop-shadow(0 16px 28px rgba(0,0,0,0.35))',
              }}
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function MarqueeSection() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-3 md:py-4" style={{ background: 'linear-gradient(135deg,#e07000,#c05a00)' }}>
      <div className="marquee-track flex gap-0 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 md:gap-3 text-white font-semibold text-xs md:text-sm px-4 md:px-6">
            {item}
            <span className="text-white/40 text-xs">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function FeaturesSection() {
  const ref = useReveal();
  return (
    <section id="features" className="py-12 md:py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center mb-8 md:mb-14">
          <div className="section-eyebrow justify-center">Why Choose Us</div>
          <h2 className="section-title">Crafted Through Generations</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
              className="bg-white rounded-xl md:rounded-xl2 p-4 md:p-6 shadow-saffron border border-saffron/5 text-center hover:-translate-y-1 transition-transform duration-300">
              <div className="text-2xl md:text-4xl mb-2 md:mb-4">{f.icon}</div>
              <div className="font-serif font-bold text-brown-dark mb-1 md:mb-2 leading-tight"
                style={{ fontSize: 'clamp(0.78rem, 1.8vw, 1rem)' }}>
                {f.title}
              </div>
              <div className="text-brown-mid/70 leading-relaxed hidden sm:block"
                style={{ fontSize: 'clamp(0.72rem, 1.5vw, 0.875rem)' }}>
                {f.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const ref = useReveal();
  return (
    <section className="py-12 md:py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center mb-8 md:mb-14">
          <div className="section-eyebrow justify-center">Testimonials</div>
          <h2 className="section-title">What Our Customers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5 }} viewport={{ once: true }}
              className="bg-white rounded-xl md:rounded-xl2 p-5 md:p-7 shadow-saffron border border-saffron/5">
              <div className="text-amber-400 text-base md:text-lg mb-2 md:mb-3">
                {'★'.repeat(t.rating)}
              </div>
              <p className="text-brown-dark/80 leading-relaxed mb-3 md:mb-5 italic"
                style={{ fontSize: 'clamp(0.82rem, 1.8vw, 1rem)' }}>
                "{t.text}"
              </p>
              <div>
                <div className="font-bold text-brown-dark text-sm">{t.name}</div>
                <div className="text-xs text-brown-mid/60">{t.city}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const ref = useReveal();
  const STATS = [
    { value: '150+', label: 'Years of Legacy' },
    { value: '10K+', label: 'Happy Customers' },
    { value: '100%', label: 'Vegetarian' },
  ];
  return (
    <section className="py-10 md:py-16" style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300)' }}>
      <div ref={ref} className="reveal max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-serif font-black text-white mb-1"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                {s.value}
              </div>
              <div className="text-saffron-light font-semibold tracking-wide"
                style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.875rem)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-14 md:py-20 bg-cream-mid text-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-4xl md:text-5xl mb-3 md:mb-4">🎁</div>
        <h2 className="section-title mb-2 md:mb-3">Corporate Gifting</h2>
        <p className="text-brown-mid/70 mb-6 md:mb-8 leading-relaxed"
          style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1rem)' }}>
          Looking for premium Maharashtrian snacks for Diwali, weddings, or corporate events?
          We offer custom gift hampers in bulk.
        </p>
        <a href="https://wa.me/919975333427" target="_blank" rel="noreferrer"
          className="inline-block px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-white transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          style={{
            background: '#25D366',
            boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
            fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
          }}>
          💬 WhatsApp Us for Bulk Orders
        </a>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <MarqueeSection />
      <FeaturesSection />
      <NamkeenSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
