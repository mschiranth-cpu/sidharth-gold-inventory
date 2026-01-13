/**
 * ============================================
 * UNAUTHORIZED PAGE
 * ============================================
 * 
 * Displayed when a user tries to access a route
 * they don't have permission for.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultRedirectPath, USER_ROLE_LABELS, UserRole } from '../../types/auth.types';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Get required roles from location state
  const requiredRoles = (location.state as { requiredRoles?: UserRole[] })?.requiredRoles || [];

  // Handle go back
  const handleGoBack = () => {
    if (user) {
      navigate(getDefaultRedirectPath(user.role));
    } else {
      navigate('/login');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl shadow-lg mb-6">
          <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          Sorry, you don't have permission to access this page.
        </p>

        {/* Details Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6 text-left">
          {user && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Logged in as</p>
              <p className="font-medium text-gray-900">{user.name}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                {USER_ROLE_LABELS[user.role]}
              </span>
            </div>
          )}

          {requiredRoles.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Required access level</p>
              <div className="flex flex-wrap gap-2">
                {requiredRoles.map((role) => (
                  <span 
                    key={role}
                    className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                  >
                    {USER_ROLE_LABELS[role]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Dashboard
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Help Link */}
        <p className="text-sm text-gray-500 mt-6">
          Need access?{' '}
          <Link to="/contact" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            Contact your administrator
          </Link>
        </p>

        {/* Copyright */}
        <p className="text-center text-xs text-gray-400 mt-8">
          © {new Date().getFullYear()} Gold Factory Inventory System
        </p>
      </div>
    </div>
  );
}
