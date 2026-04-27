/**
 * ============================================
 * UNAUTHORIZED PAGE — Onyx & Gold Edition
 * ============================================
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultRedirectPath, USER_ROLE_LABELS, UserRole } from '../../types/auth.types';
import AuthShell from '../../components/common/AuthShell';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const requiredRoles = (location.state as { requiredRoles?: UserRole[] })?.requiredRoles || [];

  const handleGoBack = () => {
    if (user) {
      navigate(getDefaultRedirectPath(user.role));
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AuthShell>
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 via-rose-500/15 to-onyx-800 ring-1 ring-rose-400/40 shadow-[0_15px_40px_-10px_rgba(244,63,94,0.4)] mb-6">
          <ExclamationTriangleIcon className="w-10 h-10 text-rose-300" />
        </div>

        <p className="text-[11px] tracking-[0.18em] uppercase text-rose-300 font-semibold">Access Denied</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-semibold leading-tight text-pearl">
          Restricted <span className="bg-gradient-to-r from-champagne-200 via-champagne-300 to-champagne-500 bg-clip-text text-transparent">workspace</span>.
        </h1>
        <p className="mt-3 text-pearl/60 text-sm">
          You don't have permission to view this page with your current role.
        </p>

        {/* Details Card */}
        <div className="mt-8 rounded-2xl border border-champagne-500/15 bg-onyx-800/70 backdrop-blur-md p-6 text-left shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
          {user && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-champagne-300 font-semibold">Logged in as</p>
              <p className="mt-1 font-serif text-xl text-pearl">{user.name}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-champagne-400/15 text-champagne-200 border border-champagne-400/30">
                {USER_ROLE_LABELS[user.role]}
              </span>
            </div>
          )}

          {requiredRoles.length > 0 && (
            <div className="mt-5 pt-5 border-t border-champagne-500/15">
              <p className="text-[11px] uppercase tracking-wide text-champagne-300 font-semibold mb-2">Required access level</p>
              <div className="flex flex-wrap gap-2">
                {requiredRoles.map((role) => (
                  <span
                    key={role}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-onyx-900/60 text-pearl/80 border border-champagne-500/20"
                  >
                    {USER_ROLE_LABELS[role]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoBack}
            className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-champagne-300 via-champagne-400 to-champagne-600 text-onyx-900 font-semibold shadow-[0_10px_30px_-10px_rgba(232,198,132,0.6)] hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_rgba(232,198,132,0.7)] transition-all duration-300 overflow-hidden"
          >
            <HomeIcon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Go to Dashboard</span>
            <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out" />
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-onyx-800/70 backdrop-blur border border-champagne-500/25 text-pearl font-semibold hover:bg-onyx-700/80 hover:border-champagne-400/50 transition"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <p className="text-sm text-pearl/55 mt-6">
          Need access?{' '}
          <Link to="/contact" className="font-medium text-champagne-300 hover:text-champagne-200 transition">
            Contact your administrator
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
