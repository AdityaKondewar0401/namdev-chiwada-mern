import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useReveal from '../hooks/useReveal';

const CONTACT_ITEMS = [
  { icon: '📍', label: 'Address', value: '205/A ,Suhas Building, Killa Road, Near DCC Bank,\nSolapur, Maharashtra – 413007' },
  { icon: '📞', label: 'Phone / WhatsApp', value: '+91 99753 33427', link: 'tel:+919975333427' },
  { icon: '✉️', label: 'Email', value: 'namdevchiwada@gmail.com', link: 'mailto:namdevchiwada@gmail.com' },
  { icon: '🕐', label: 'Business Hours', value: 'Mon–Sat: 9:00 AM – 8:00 PM\nSunday: 10:00 AM – 6:00 PM' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ fname: '', lname: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
  const ref = useReveal();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fname || !form.email || !form.message) { toast.error('Please fill all required fields'); return; }
    toast.success("✅ Message sent! We'll reply within 24 hours.");
    setForm({ fname: '', lname: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
  };

  const inp = (name, label, placeholder, type = 'text', required = false) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">{label}{required && ' *'}</label>
      <input type={type} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder={placeholder} className="form-input" required={required} />
    </div>
  );

  return (
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
          <p className="text-white/70">We'd love to hear from you — orders, inquiries, corporate gifting</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Info */}
          <motion.div ref={ref} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif font-bold text-brown-dark text-xl mb-6">Visit Us or Get in Touch</h2>
            <div className="divide-y divide-saffron/10">
              {CONTACT_ITEMS.map(({ icon, label, value, link }) => (
                <div key={label} className="flex items-start gap-4 py-5">
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
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="mt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/60 mb-3">Connect With Us</div>
              <div className="flex gap-3">
                {[{ icon: '📸', label: 'Instagram' }, { icon: '👥', label: 'Facebook' }, { icon: '▶️', label: 'YouTube' }, { icon: '💬', label: 'WhatsApp' }].map(({ icon, label }) => (
                  <button key={label} title={label}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg bg-saffron-pale text-saffron hover:bg-saffron hover:text-white transition-all duration-200 hover:-translate-y-0.5">
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="mt-6 rounded-xl2 bg-cream-mid border-2 border-saffron/10 h-48 flex flex-col items-center justify-center gap-2 text-brown-mid/60 overflow-hidden">
              <div className="text-3xl">📍</div>
              <div className="font-bold text-brown-mid">Namdev Chiwada, Solapur</div>
              <div className="text-xs">Near DCC Bank</div>
              <a href="https://www.google.com/maps/place/17%C2%B040'34.8%22N+75%C2%B054'08.4%22E/@17.6762213,75.9021686,19.98z/data=!4m4!3m3!8m2!3d17.6763333!4d75.9023333?entry=ttu&g_ep=EgoyMDI2MDQxMi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer"
                className="text-saffron text-xs font-semibold hover:text-saffron-light transition-colors mt-1">
                Open in Google Maps →
              </a>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <div className="bg-white rounded-xl2 shadow-saffron border border-saffron/10 p-8">
              <h3 className="font-serif font-bold text-brown-dark text-xl mb-6">Send Us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                <button type="submit" className="w-full btn-saffron py-4 font-bold text-base">
                  Send Message →
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <div className="max-w-5xl mx-auto px-6 pb-4">
        <div className="bg-brown-dark rounded-xl2 p-8 text-center">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="font-serif font-bold text-white text-xl mb-2">Prefer WhatsApp?</h3>
          <p className="text-white/60 text-sm mb-5">Chat with us directly for instant replies and order assistance</p>
          <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer"
            className="inline-block px-8 py-3.5 rounded-full font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}>
            💬 WhatsApp Us Now
          </a>
        </div>
      </div>
    </div>
  );
}
