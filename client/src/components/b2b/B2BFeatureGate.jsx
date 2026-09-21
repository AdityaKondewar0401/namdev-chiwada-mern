import { useAuth } from '../../context/AuthContext';
import { useB2BEnabled } from '../../hooks/useB2BEnabled';
import NotFoundPage from '../../pages/NotFoundPage';
import { Layout } from '../Layout';

// Wraps /business, /business/apply, and /b2b (outside ProtectedRoute, so
// a disabled feature reads as "doesn't exist" regardless of login state)
// — spec Part B1: non-admins see the normal 404 page while B2B_ENABLED
// is false; admins always pass through so the business can be configured
// pre-launch.
export default function B2BFeatureGate({ children }) {
  const { user } = useAuth();
  const { enabled, loading } = useB2BEnabled();

  if (loading) return null;
  if (!enabled && user?.role !== 'admin') return <Layout><NotFoundPage /></Layout>;
  return children;
}
