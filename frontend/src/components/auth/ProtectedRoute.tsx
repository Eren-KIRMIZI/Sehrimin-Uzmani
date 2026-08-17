import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
