/**
 * ============================================
 * PROTECTED ROUTE COMPONENT
 * ============================================
 *
 * Higher-order component to protect routes based on authentication
 * and user role. Redirects to login if not authenticated or to
 * unauthorized page if the user lacks required permissions.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, hasRole } from '../../types/auth.types';

// ============================================
// TYPES
// ============================================

interface ProtectedRouteProps {
  /** The component/element to render if authorized */
  children: React.ReactNode;
  /** Roles allowed to access this route (if empty, any authenticated user can access) */
  allowedRoles?: UserRole[];
  /** Redirect path when not authenticated (default: /login) */
  redirectTo?: string;
  /** Redirect path when unauthorized (default: /unauthorized) */
  unauthorizedRedirect?: string;
}

// ============================================
// LOADING SPINNER COMPONENT
// ============================================

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-indigo-800 font-medium">Verifying access...</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = '/login',
  unauthorizedRedirect = '/unauthorized',
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !hasRole(user.role, allowedRoles)) {
    return (
      <Navigate
        to={unauthorizedRedirect}
        state={{ from: location, requiredRoles: allowedRoles }}
        replace
      />
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

// ============================================
// CONVENIENCE WRAPPER COMPONENTS
// ============================================

/**
 * Route accessible only by admin users
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>{children}</ProtectedRoute>;
}

/**
 * Route accessible by admin and office staff
 */
export function OfficeRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route accessible by admin, factory manager, and department workers
 */
export function FactoryRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.ADMIN, UserRole.FACTORY_MANAGER, UserRole.DEPARTMENT_WORKER]}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route accessible by department workers and factory managers
 */
export function WorkerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.ADMIN, UserRole.FACTORY_MANAGER, UserRole.DEPARTMENT_WORKER]}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route accessible by all authenticated users
 */
export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
