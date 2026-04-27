/**
 * ============================================
 * CLIENT LOGIN PAGE — Onyx & Gold Edition
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRightIcon, EnvelopeIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultRedirectPath } from '../../types/auth.types';
import AuthShell from '../../components/common/AuthShell';

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });

  // If already authenticated, send to the right home for their role
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDefaultRedirectPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      // The useEffect above will redirect to the role's default path once
      // AuthContext updates `user`.
    } catch {
      /* handled by context */
    }
  };

  return (
    <AuthShell>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-[11px] tracking-[0.18em] uppercase text-champagne-300 font-semibold">Client Portal</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-semibold leading-tight">
            Track your <span className="bg-gradient-to-r from-champagne-200 via-champagne-300 to-champagne-500 bg-clip-text text-transparent">orders</span>.
          </h1>
          <p className="mt-3 text-pearl/60 text-sm">Sign in to view designs, status, and updates from the floor.</p>
        </div>

        <div className="rounded-2xl border border-champagne-500/15 bg-onyx-800/70 backdrop-blur-md p-7 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl border border-rose-400/30 bg-rose-500/10 flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-rose-300 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-200">Sign-in failed</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold tracking-wide text-champagne-300 uppercase mb-1.5">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="block w-full pl-9 pr-3 py-2.5 rounded-xl bg-onyx-900/70 text-pearl placeholder-pearl/30 border border-champagne-500/20 hover:border-champagne-400/40 focus:border-champagne-400/50 focus:bg-onyx-900 focus:ring-2 focus:ring-champagne-400/40 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold tracking-wide text-champagne-300 uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 rounded-xl bg-onyx-900/70 text-pearl placeholder-pearl/30 border border-champagne-500/20 hover:border-champagne-400/40 focus:border-champagne-400/50 focus:bg-onyx-900 focus:ring-2 focus:ring-champagne-400/40 outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-3.5 h-3.5 rounded bg-onyx-900 border-champagne-500/40 text-champagne-400 focus:ring-champagne-400/50 cursor-pointer"
                />
                <span className="text-xs text-pearl/65 group-hover:text-pearl transition">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-xs font-medium text-champagne-300 hover:text-champagne-200 transition">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-champagne-300 via-champagne-400 to-champagne-600 text-onyx-900 font-semibold shadow-[0_10px_30px_-10px_rgba(232,198,132,0.6)] hover:shadow-[0_15px_40px_-10px_rgba(232,198,132,0.7)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-onyx-900 border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </>
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-pearl/55">
              Don't have an account?{' '}
              <Link to="/client/register" className="font-medium text-champagne-300 hover:text-champagne-200 transition">
                Register here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-pearl/50 hover:text-pearl transition">
            ← Back to main site
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
