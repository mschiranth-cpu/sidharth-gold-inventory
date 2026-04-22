/**
 * ============================================
 * CLIENT PORTAL LAYOUT
 * ============================================
 */

import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClientRoute } from '../auth';

export default function ClientPortalLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <ClientRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Client Portal
              </h1>
              <div className="flex items-center gap-4">
                <Link
                  to="/client/dashboard"
                  className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/client/orders"
                  className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                >
                  Orders
                </Link>
                <Link
                  to="/client/profile"
                  className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
        <Outlet />
      </div>
    </ClientRoute>
  );
}
