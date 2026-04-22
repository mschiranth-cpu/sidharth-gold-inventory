/**
 * ============================================
 * CLIENT ROUTE GUARD
 * ============================================
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';

interface ClientRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard for CLIENT role only
 */
export function ClientRoute({ children }: ClientRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== UserRole.CLIENT) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default ClientRoute;
