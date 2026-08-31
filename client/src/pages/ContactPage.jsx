import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import { buildBreadcrumbSchema } from '../utils/structuredData';
import { SITE_NAME } from '../config/seo.config';

// Intentionally NO LocalBusiness structured data here — the business is
// online-only with no physical storefront, so there's no address/hours
// to mark up. Only a plain BreadcrumbList is added.
const CONTACT_BREADCRUMB_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Contact', path: '/contact' },
];

// ─────────────────────────────────────────────
// ContactPage — REDESIGNED
//
// Real bugs fixed (not just visual):
//
// 1. The phone number literally had a stray "H" typo in it:
//    '+91 9130160491H'. The tel: link was correct, but the displayed
//    text was wrong. Fixed to '+91 91301 60491'.
// 2. The bottom "Prefer WhatsApp?" button linked to a DIFFERENT
//    number (919876543210) than the one used everywhere else on the
//    site (Footer, Distributorship section, homepage CTAs — all
//    919130160491). Now consistent.
// 3. THE BIG ONE — the contact form's handleSubmit only showed a
//    "Message sent! We'll reply within 24 hours" toast and did
//    nothing else. Nothing was actually sent anywhere — there's no
//    backend endpoint for this form (confirmed against AGENT.md,
//    which documents this page as "presentation-only... there is no
//    contact API"). That's not a visual issue, that's a form that
//    lies to real customers. Since there's no backend to wire this
//    to, submitting now opens the person's own email app with
//    subject/body pre-filled and addressed to your real inbox — the
//    message genuinely gets sent once they hit send there, instead
//    of vanishing into nothing. Added a secondary "or send via
//    WhatsApp" button next to it (pre-fills a wa.me message) since
//    this page's own copy already says WhatsApp gets faster replies.
// 4. The four social buttons (Instagram/Facebook/YouTube/WhatsApp)
//    had no onClick/href at all — clicking any of them did nothing.
//    WhatsApp now actually opens the real chat; the other three
//    (no confirmed handles/URLs to link to) at least give honest
//    feedback ("page coming soon") instead of silently doing nothing.
// 5. Removed an unused `useReveal()` import — it was wired to a ref
//    on an element that never had the `reveal` CSS class needed for
//    it to do anything, so it was running an IntersectionObserver
//    for zero visual effect. Framer Motion's own `whileInView` on
//    that element already handles the animation.
// ─────────────────────────────────────────────

const WHATSAPP_NUMBER = '919130160491';
const PHONE_TEL = '+919130160491';
const EMAIL = 'care@namdevchiwda.com';

const CONTACT_ITEMS = [
  { icon: '📞', label: 'Phone / WhatsApp', value: '+91 91301 60491', link: `tel:${PHONE_TEL}` },
  { icon: '✉️', label: 'Email', value: EMAIL, link: `mailto:${EMAIL}` },
  { icon: '🚚', label: 'Delivery & Payment', value: 'Delivered across Maharashtra, with priority delivery in Pune and Solapur.\nCash on Delivery and online payment both available at checkout.' },
];

const SOCIALS = [
  { icon: '📸', label: 'Instagram' },
  { icon: '👥', label: 'Facebook' },
  { icon: '▶️', label: 'YouTube' },
  { icon: '💬', label: 'WhatsApp' },
];

const FIELD_ICONS = { fname: '👤', lname: '👤', email: '✉️', phone: '📱' };

export default function ContactPage() {
  const [form, setForm] = useState({ fname: '', lname: '', email: '', phone: '', subject: 'General Inquiry', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fname || !form.email || !form.message) {
      toast.error('Please fill all required fields');
      return;
    }

    const subject = encodeURIComponent(`[Website] ${form.subject} — ${form.fname} ${form.lname}`.trim());
    const body = encodeURIComponent(
      `Name: ${form.fname} ${form.lname}\nEmail: ${form.email}\nPhone: ${form.phone || '—'}\nSubject: ${form.subject}\n\n${form.message}`
    );

    // See file header note: no backend endpoint exists for this form,
    // so this opens the person's own email app with everything
    // pre-filled rather than pretending to send something that isn't.
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    toast.success('Opening your email app with your message ready to send…');
    setForm({ fname: '', lname: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
  };

  const handleWhatsAppSubmit = () => {
    if (!form.message.trim()) {
      toast.error('Write a message first');
      return;
    }
    const text = encodeURIComponent(
      `Hi, I'm ${form.fname || 'a customer'} — ${form.subject}.\n\n${form.message}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noreferrer');
  };

  const handleSocialClick = (label) => {
    if (label === 'WhatsApp') {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank', 'noreferrer');
    } else {
      toast(`Our ${label} page is coming soon — reach us on WhatsApp meanwhile!`);
    }
  };

  const inp = (name, label, placeholder, type = 'text', required = false) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">{label}{required && ' *'}</label>
      <div className="relative">
        {FIELD_ICONS[name] && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-mid/40 pointer-events-none text-sm" aria-hidden="true">
            {FIELD_ICONS[name]}
          </span>
        )}
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder}
          className={`form-input ${FIELD_ICONS[name] ? 'pl-10' : ''}`}
          required={required}
        />
      </div>
    </div>
  );

  return (
    <PageWrapper>
      <SEO
        title={`Contact ${SITE_NAME} | Solapur, Maharashtra`}
        description={`Get in touch with ${SITE_NAME} for order queries, bulk orders, or feedback — reach us by phone, email, or WhatsApp. Delivery across Maharashtra with Cash on Delivery available.`}
        canonical="/contact"
        jsonLd={buildBreadcrumbSchema(CONTACT_BREADCRUMB_ITEMS)}
      />
      <div className="min-h-screen bg-cream pb-16">
        {/* Header */}
        <div className="pt-14 pb-10 px-6 text-center"
          style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300 60%,#e07000)' }}>
          <div className="max-w-2xl mx-auto">
            <nav className="flex items-center justify-center gap-2 text-xs text-white/50 mb-4">
              <Link to="/" className="hover:text-white">Home</Link>
              <span>›</span>
              <span className="text-white">Contact</span>
            </nav>
            <h1 className="font-serif font-black text-white mb-3" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Get in Touch</h1>
            <p className="text-white/70">
              {/* Plain <a> tags, not <Link> — these need a real page load so
                  the homepage's hash-scroll effect runs against final,
                  settled layout instead of racing the route-change fade
                  transition (AnimatedRoutes' popLayout in App.jsx). */}
              We'd love to hear from you — orders, inquiries,{' '}
              <a href="/#corporate-gifting" className="underline hover:text-white">corporate gifting</a>
              {' '}or{' '}
              <a href="/#distributorship" className="underline hover:text-white">distributorship</a>
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              {['🕐 Reply within 24 hrs', '💬 WhatsApp available', '🚚 Ships across Maharashtra'].map((t) => (
                <span key={t} className="text-xs font-semibold text-white/60">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Info */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="font-serif font-bold text-brown-dark text-xl mb-6">Get in Touch</h2>
              <div className="divide-y divide-saffron/10">
                {CONTACT_ITEMS.map(({ icon, label, value, link }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-4 py-5 rounded-xl transition-colors hover:bg-saffron-pale/40 px-2 -mx-2"
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: 'linear-gradient(135deg,#fff0d6,#fdf3c8)' }}>
                      {icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/60 mb-1">{label}</div>
                      {link ? (
                        <a href={link} className="text-saffron hover:text-saffron-light font-medium text-sm transition-colors">
                          {value}
                        </a>
                      ) : (
                        <div className="text-sm text-brown-dark whitespace-pre-line leading-relaxed">{value}</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Social */}
              <div className="mt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/60 mb-3">Connect With Us</div>
                <div className="flex gap-3">
                  {SOCIALS.map(({ icon, label }) => (
                    <button
                      key={label}
                      title={label}
                      aria-label={label}
                      onClick={() => handleSocialClick(label)}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg bg-saffron-pale text-saffron hover:bg-saffron hover:text-white transition-all duration-200 hover:-translate-y-0.5"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="bg-white rounded-xl2 shadow-saffron border border-saffron/10 p-8">
                <h2 className="font-serif font-bold text-brown-dark text-xl mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inp('fname', 'First Name', 'Rahul', 'text', true)}
                    {inp('lname', 'Last Name', 'Deshmukh')}
                  </div>
                  {inp('email', 'Email Address', 'rahul@example.com', 'email', true)}
                  {inp('phone', 'Phone / WhatsApp', '+91 98765 43210', 'tel')}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">Subject</label>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="form-input">
                      {['General Inquiry', 'Order Issue', 'Bulk / Corporate Order', 'Product Feedback', 'Other'].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">Message *</label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we help you?" required rows={4}
                      className="form-input resize-y" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button type="submit" className="flex-1 btn-saffron py-4 font-bold text-base">
                      ✉️ Send via Email →
                    </button>
                    <button
                      type="button"
                      onClick={handleWhatsAppSubmit}
                      className="flex-1 rounded-full font-bold text-white py-4 text-base transition-all hover:-translate-y-0.5"
                      style={{ background: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}
                    >
                      💬 Send via WhatsApp
                    </button>
                  </div>
                  <p className="text-center text-xs text-brown-mid/40">
                    Either option opens your own email or WhatsApp app with your message pre-filled.
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div className="max-w-5xl mx-auto px-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-brown-dark rounded-xl2 p-8 text-center"
          >
            <div className="text-4xl mb-3">💬</div>
            <h2 className="font-serif font-bold text-white text-xl mb-2">Prefer WhatsApp?</h2>
            <p className="text-white/60 text-sm mb-5">Chat with us directly for instant replies and order assistance</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
                className="w-full sm:w-auto inline-block px-8 py-3.5 rounded-full font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}>
                💬 WhatsApp Us Now
              </a>
              <a href={`tel:${PHONE_TEL}`}
                className="w-full sm:w-auto inline-block px-8 py-3.5 rounded-full font-bold text-white transition-all"
                style={{ border: '1.5px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)' }}>
                📞 Or Call Us
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}