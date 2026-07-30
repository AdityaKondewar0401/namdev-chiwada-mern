import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false, partnerOnly = false }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  if (partnerOnly && user.role !== 'partner') {
    return <Navigate to="/" replace />;
  }
  return children;
}
