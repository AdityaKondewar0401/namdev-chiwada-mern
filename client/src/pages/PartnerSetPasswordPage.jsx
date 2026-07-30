import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { partnerPortalAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

// ─────────────────────────────────────────────
// PartnerSetPasswordPage — the invite link from sendPartnerInviteEmail
// lands here with ?token=... . On success, logs the partner straight in
// (via saveUser, same as Google login) and sends them to their dashboard.
// ─────────────────────────────────────────────
export default function PartnerSetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { saveUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invite link is missing its token');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await partnerPortalAPI.setPassword(token, password);
      saveUser(res.data.user, res.data.token);
      toast.success('Welcome! Your account is ready.');
      navigate('/partner/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not set password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-cream flex items-center justify-center px-6 text-center">
          <div>
            <h2 className="font-serif font-black text-brown-dark text-2xl mb-2">Invalid link</h2>
            <p className="text-brown-mid/60 mb-6">This invite link is missing its token.</p>
            <Link to="/" className="btn-saffron px-8 py-3.5 inline-block">Go Home</Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-16">
        <div
          className="w-full max-w-sm bg-white rounded-3xl p-8"
          style={{ boxShadow: '0 8px 32px rgba(45,26,0,0.08)', border: '1px solid rgba(224,112,0,0.1)' }}
        >
          <div className="text-center mb-6">
            <img src="/images/logo.png" alt="Namdev Chiwda" className="h-14 w-auto object-contain mx-auto mb-3" />
            <h2 className="font-serif font-black text-brown-dark text-xl">Set your password</h2>
            <p className="text-brown-mid/60 text-sm mt-1">Finish setting up your partner account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="form-input"
                autoComplete="new-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-saffron w-full py-3.5 disabled:opacity-60">
              {loading ? 'Setting up...' : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
