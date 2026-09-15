import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import { SITE_NAME } from '../config/seo.config';

// ─────────────────────────────────────────────
// AuthPages (Login + Register) — reverted to the centered-card design.
//
// The split-screen redesign (dark brand panel + lucide icons) that
// briefly replaced this has been reverted per request, back to this
// version: a centered card with soft glow orbs, a gradient top hairline,
// the real logo + "Since 1873" eyebrow, emoji-adorned fields, and a
// trust-badge row underneath.
//
// One thing IS kept from the split-screen version, not reverted: the
// GoogleLoginButton's `clientId` guard (see below). That was a real
// functional bug fix — without it, a missing VITE_GOOGLE_CLIENT_ID threw
// Google's own "[GSI_LOGGER]: Missing required parameter" console error
// and rendered a dead button — unrelated to which visual design is
// active, so it stays fixed either way.
//
// No submit logic changed: login/register calls, redirect-after-login
// (`from` location state), and the marketing-consent checkbox default
// (unchecked, genuine opt-in) are all exactly as before.
// ─────────────────────────────────────────────

// Small reusable icon-adorned input, used by both Login and Register.
// Password fields automatically get a show/hide toggle.
function IconField({ icon, type = 'text', value, onChange, placeholder, label, required, minLength, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-mid/40 pointer-events-none" aria-hidden="true">
          {icon}
        </span>
        <input
          type={inputType}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="form-input pl-10 pr-10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-mid/40 hover:text-saffron transition-colors text-sm"
          >
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );
}

const TRUST_BADGES = [
  { icon: '✦', label: '150+ Years' },
  { icon: '🍃', label: 'No Artificial Colors' },
  { icon: '🛡', label: 'FSSAI Licensed' },
];

function AuthCard({ title, subtitle, children }) {
  return (
    <div className="relative min-h-screen bg-cream flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Soft decorative glows — restrained, not a marketing hero */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.16), transparent 70%)', filter: 'blur(10px)' }} />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(224,112,0,0.12), transparent 70%)', filter: 'blur(10px)' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center group">
            <div className="relative mb-2">
              <div
                className="absolute inset-0 rounded-full opacity-50 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.45), transparent 70%)', filter: 'blur(14px)' }}
              />
              <img
                src="/images/logo.png"
                alt="Namdev Chiwda"
                className="relative h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center gap-1.5 text-saffron text-[11px] font-bold tracking-widest uppercase">
              <span>✦</span> Since 1873
            </div>
          </Link>
        </div>

        <div className="relative bg-white rounded-xl2 shadow-saffron border border-saffron/10 p-8 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1"
            style={{ background: 'linear-gradient(90deg,#e07000,#d4af37,#e07000)' }} />
          <h2 className="font-serif font-black text-brown-dark text-2xl mb-1">{title}</h2>
          <p className="text-brown-mid/60 text-sm mb-6">{subtitle}</p>
          {children}
        </div>

        {/* Trust footer — same reassurance line used on the homepage hero */}
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          {TRUST_BADGES.map((t) => (
            <div key={t.label} className="flex items-center gap-1.5 text-brown-mid/50 text-[11px] font-medium">
              <span aria-hidden="true">{t.icon}</span>{t.label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ================= GOOGLE LOGIN BUTTON ================= */
function GoogleLoginButton() {
  const navigate = useNavigate();
  const { saveUser } = useAuth();
  // BUG FIX (kept from the split-screen version — see file header): this
  // used to call google.accounts.id.initialize() with whatever
  // VITE_GOOGLE_CLIENT_ID happened to be (including undefined), which
  // throws Google's own "[GSI_LOGGER]: Missing required parameter:
  // client_id" console error and never renders a working button —
  // visitors saw a broken/blank "OR" divider with nothing usable under
  // it. If this env var isn't configured (a misconfigured deploy, or
  // local dev without it set), degrade gracefully by not showing the
  // Google option at all rather than an erroring dead button;
  // email/password login still works.
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google) return false;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        cancel_on_tap_outside: false,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          width: '100%',
          text: 'continue_with',
          logo_alignment: 'left',
        }
      );

      // One Tap — the small account-chooser card Google surfaces on its
      // own (same UX as Gmail/Groww), on top of the explicit button above.
      window.google.accounts.id.prompt();

      return true;
    };

    if (!renderGoogleButton()) {
      const interval = setInterval(() => {
        if (renderGoogleButton()) clearInterval(interval);
      }, 200);

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (data.success) {
        saveUser(data.user, data.token);
        toast.success(`Welcome, ${data.user.name}! 🎉`);
        navigate('/');
      }
    } catch (err) {
      toast.error('Google login failed');
    }
  };

  if (!clientId) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-saffron/20" />
        <span className="text-xs text-brown-mid/50 font-medium">OR</span>
        <div className="flex-1 h-px bg-saffron/20" />
      </div>

      <div id="google-signin-btn" className="flex justify-center" />
    </div>
  );
}

/* ================= LOGIN PAGE ================= */
export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(form);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <PageWrapper>
      <SEO
        title={`Login | ${SITE_NAME}`}
        description={`Sign in to your ${SITE_NAME} account.`}
        canonical="/login"
        robots="noindex,nofollow"
      />
      <AuthCard title="Welcome Back" subtitle={`Sign in to your ${SITE_NAME} account`}>
        <form onSubmit={handleSubmit} className="space-y-4">

          <IconField
            icon="✉️"
            type="email"
            label="Email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <IconField
            icon="🔒"
            type="password"
            label="Password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <button type="submit" disabled={loading}
            className={`w-full btn-saffron py-3.5 font-bold text-base mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <GoogleLoginButton />

        <p className="text-center text-sm text-brown-mid/60 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-saffron font-semibold hover:text-saffron-light">
            Register
          </Link>
        </p>
      </AuthCard>
    </PageWrapper>
  );
}

/* ================= REGISTER PAGE ================= */
export function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    marketingConsent: false, // unchecked by default — genuine opt-in, not implied consent
  });
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(form);
    if (res.success) navigate('/', { replace: true });
  };

  const FIELD_ICONS = { name: '👤', email: '✉️', phone: '📱', password: '🔒' };
  const FIELD_AUTOCOMPLETE = { name: 'name', email: 'email', phone: 'tel', password: 'new-password' };

  return (
    <PageWrapper>
      <SEO
        title={`Create Account | ${SITE_NAME}`}
        description={`Create your ${SITE_NAME} account.`}
        canonical="/register"
        robots="noindex,nofollow"
      />
      <AuthCard title="Create Account" subtitle={`Join ${SITE_NAME} — it's free!`}>
        <form onSubmit={handleSubmit} className="space-y-4">

          {[
            { name: 'name', label: 'Full Name', placeholder: 'Rahul Deshmukh', type: 'text' },
            { name: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
            { name: 'phone', label: 'Phone (optional)', placeholder: '9876543210', type: 'tel' },
            { name: 'password', label: 'Password', placeholder: 'Min. 6 characters', type: 'password' },
          ].map(({ name, label, placeholder, type }) => (
            <IconField
              key={name}
              icon={FIELD_ICONS[name]}
              type={type}
              label={label}
              value={form[name]}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
              placeholder={placeholder}
              required={name !== 'phone'}
              minLength={name === 'password' ? 6 : undefined}
              autoComplete={FIELD_AUTOCOMPLETE[name]}
            />
          ))}

          {/* Marketing opt-in — explicit, unchecked by default; unchanged */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.marketingConsent}
              onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-saffron flex-shrink-0"
            />
            <span className="text-xs text-brown-mid/70 leading-relaxed">
              Send me order updates and offers via WhatsApp, SMS, and email. You can turn this off anytime from your account.
            </span>
          </label>

          <button type="submit" disabled={loading}
            className={`w-full btn-saffron py-3.5 font-bold text-base mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <GoogleLoginButton />

        <p className="text-center text-sm text-brown-mid/60 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-saffron font-semibold hover:text-saffron-light">
            Sign In
          </Link>
        </p>
      </AuthCard>
    </PageWrapper>
  );
}
