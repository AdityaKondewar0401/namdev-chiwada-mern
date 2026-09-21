import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false, businessOnly = false }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  // UX only — real access control happens server-side. Sends to /b2b
  // rather than /business/apply because /b2b reads LIVE status from
  // GET /api/b2b/me and shows the right state itself (no application →
  // link to apply; pending; rejected; suspended; approved), instead of
  // trusting the cached user.business, which can be briefly stale.
  if (businessOnly && !user.business) {
    return <Navigate to="/b2b" replace />;
  }
  return children;
}
