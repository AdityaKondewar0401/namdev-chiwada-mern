import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import { SITE_NAME } from '../config/seo.config';

// ─────────────────────────────────────────────
// AuthPages (Login + Register) — REDESIGNED (split-screen)
//
// Replaces the old single centered card (glow orbs, gradient top bar,
// trust-badge row) with a split layout: a dark brand panel — the real
// logo + a one-line heritage statement — beside a plain, minimal form.
// On mobile the panel collapses to a compact header above the form
// instead of disappearing, so the brand context never fully drops away.
//
// No submit logic changed: login/register calls, redirect-after-login
// (`from` location state), and the marketing-consent checkbox default
// (unchecked, genuine opt-in) are all exactly as before. Emoji icons
// (✉️ 🔒 👤 📱 🙈 👁️) are replaced with lucide-react, matching the
// icon system already used across the admin panel and checkout.
// ─────────────────────────────────────────────

// Small reusable icon-adorned input, used by both Login and Register.
// Password fields automatically get a show/hide toggle.
function IconField({ icon: Icon, type = 'text', value, onChange, placeholder, label, required, minLength, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div>
      <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-wider text-brown-mid/50">{label}</label>
      <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-3" style={{ border: '1px solid rgba(45,26,0,0.15)' }}>
        <Icon size={16} className="flex-shrink-0 text-brown-mid/40" />
        <input
          type={inputType}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-sm text-brown-dark outline-none placeholder:text-brown-mid/30"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="flex-shrink-0 text-brown-mid/30 hover:text-saffron transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Split-screen shell ── dark brand panel + minimal form panel.
// The panel is a normal-flow block (not `min-h-screen`) on mobile, so it
// naturally collapses to just "logo + headline" height above the form
// instead of eating the viewport — no separate mobile-only markup needed.
function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div
        className="relative flex flex-shrink-0 flex-col justify-between overflow-hidden px-6 py-7 md:w-[42%] md:px-10 md:py-12"
        style={{ background: 'linear-gradient(165deg,#1c0d02,#3d1c00 55%,#1c0d02)' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 78 V40 A17 17 0 0 1 63 40 V78' stroke='%23d4af37' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 80px',
          }}
        />
        <Link to="/" className="relative z-10 inline-block flex-shrink-0">
          <img src="/images/logo.png" alt="Namdev Chiwda" className="h-11 w-auto object-contain md:h-14" />
        </Link>
        <div className="relative z-10 mt-6 font-serif font-black leading-tight text-white md:mt-0" style={{ fontSize: 'clamp(1.25rem,2.6vw,1.8rem)' }}>
          Six generations.<br />One recipe.
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10 md:px-10" style={{ background: '#fffdf9' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[320px]"
        >
          <h1 className="font-serif font-black text-brown-dark" style={{ fontSize: '1.55rem' }}>{title}</h1>
          <p className="mt-1 text-sm text-brown-mid/50">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

/* ================= GOOGLE LOGIN BUTTON ================= */
function GoogleLoginButton() {
  const navigate = useNavigate();
  const { saveUser } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google) return false;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
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

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1" style={{ background: 'rgba(45,26,0,0.1)' }} />
        <span className="text-[0.65rem] font-semibold text-brown-mid/40">OR</span>
        <div className="h-px flex-1" style={{ background: 'rgba(45,26,0,0.1)' }} />
      </div>

      <div id="google-signin-btn" className="mt-4 flex justify-center" />
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
      <AuthShell title="Welcome back" subtitle="Sign in to your account">
        <form onSubmit={handleSubmit} className="space-y-4">

          <IconField
            icon={Mail}
            type="email"
            label="Email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <IconField
            icon={Lock}
            type="password"
            label="Password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <button type="submit" disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold text-white transition-opacity ${loading ? 'opacity-70' : ''}`}
            style={{ background: '#1c0d02' }}>
            {loading ? 'Signing in...' : <>Sign In <ArrowRight size={15} /></>}
          </button>
        </form>

        <GoogleLoginButton />

        <p className="mt-6 text-center text-sm text-brown-mid/50">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-saffron hover:text-saffron-light">
            Register
          </Link>
        </p>
      </AuthShell>
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

  const FIELD_ICONS = { name: User, email: Mail, phone: Phone, password: Lock };
  const FIELD_AUTOCOMPLETE = { name: 'name', email: 'email', phone: 'tel', password: 'new-password' };

  return (
    <PageWrapper>
      <SEO
        title={`Create Account | ${SITE_NAME}`}
        description={`Create your ${SITE_NAME} account.`}
        canonical="/register"
        robots="noindex,nofollow"
      />
      <AuthShell title="Create account" subtitle={`Join ${SITE_NAME} — it's free`}>
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
          <label className="flex cursor-pointer select-none items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              checked={form.marketingConsent}
              onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-saffron"
            />
            <span className="text-xs leading-relaxed text-brown-mid/60">
              Send me order updates and offers via WhatsApp, SMS, and email. You can turn this off anytime from your account.
            </span>
          </label>

          <button type="submit" disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold text-white transition-opacity ${loading ? 'opacity-70' : ''}`}
            style={{ background: '#1c0d02' }}>
            {loading ? 'Creating Account...' : <>Create Account <ArrowRight size={15} /></>}
          </button>
        </form>

        <GoogleLoginButton />

        <p className="mt-6 text-center text-sm text-brown-mid/50">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-saffron hover:text-saffron-light">
            Sign In
          </Link>
        </p>
      </AuthShell>
    </PageWrapper>
  );
}
