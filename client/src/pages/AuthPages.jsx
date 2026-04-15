import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-cream-DEFAULT flex items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 4px 16px rgba(224,112,0,0.35)' }}>
              <span className="text-white font-serif font-black text-2xl">N</span>
            </div>
            <div className="text-left">
              <div className="font-serif font-black text-brown-dark text-xl leading-none">Namdev</div>
              <div className="text-xs text-saffron-DEFAULT tracking-widest uppercase font-semibold">Chiwada</div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-xl2 shadow-saffron border border-saffron-DEFAULT/10 p-8">
          <h2 className="font-serif font-black text-brown-dark text-2xl mb-1">{title}</h2>
          <p className="text-brown-mid/60 text-sm mb-6">{subtitle}</p>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/* ================= GOOGLE LOGIN BUTTON ================= */
function GoogleLoginButton() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
        }
      );
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('nc_token', data.token);
        localStorage.setItem('nc_user', JSON.stringify(data.user));
        toast.success(`Welcome, ${data.user.name}! 🎉`);
        navigate('/');
      }
    } catch (err) {
      toast.error('Google login failed');
    }
  };

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
    if (res.success) navigate(from, { replace: true });
  };

  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to your Namdev Chiwada account">
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">Email</label>
          <input type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com" className="form-input" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">Password</label>
          <input type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••" className="form-input" />
        </div>

        <button type="submit" disabled={loading}
          className={`w-full btn-saffron py-3.5 font-bold text-base mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* ✅ GOOGLE LOGIN ADDED HERE */}
      <GoogleLoginButton />

      <p className="text-center text-sm text-brown-mid/60 mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-saffron-DEFAULT font-semibold hover:text-saffron-light">
          Register
        </Link>
      </p>
    </AuthCard>
  );
}

/* ================= REGISTER PAGE ================= */
export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(form);
    if (res.success) navigate('/', { replace: true });
  };

  return (
    <AuthCard title="Create Account" subtitle="Join Namdev Chiwada — it's free!">
      <form onSubmit={handleSubmit} className="space-y-4">

        {[
          { name: 'name', label: 'Full Name', placeholder: 'Rahul Deshmukh', type: 'text' },
          { name: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
          { name: 'phone', label: 'Phone (optional)', placeholder: '9876543210', type: 'tel' },
          { name: 'password', label: 'Password', placeholder: 'Min. 6 characters', type: 'password' },
        ].map(({ name, label, placeholder, type }) => (
          <div key={name}>
            <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">{label}</label>
            <input
              type={type}
              value={form[name]}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
              placeholder={placeholder}
              className="form-input"
              required={name !== 'phone'}
              minLength={name === 'password' ? 6 : undefined}
            />
          </div>
        ))}

        <button type="submit" disabled={loading}
          className={`w-full btn-saffron py-3.5 font-bold text-base mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-brown-mid/60 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-saffron-DEFAULT font-semibold hover:text-saffron-light">
          Sign In
        </Link>
      </p>
    </AuthCard>
  );
}