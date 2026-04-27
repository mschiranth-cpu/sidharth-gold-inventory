/**
 * ============================================
 * LOGIN PAGE — Onyx & Gold Edition
 * ============================================
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRightIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultRedirectPath, UserRole } from '../../types/auth.types';
import AuthShell from '../../components/common/AuthShell';

const ADMIN_ONLY_ROUTES = ['/users', '/users/new', '/activity'];
const NON_REDIRECTABLE_ROUTES = ['/login', '/unauthorized', '/register', '/forgot-password', '/client/login', '/client/register'];

const isRouteAccessibleToRole = (path: string, role: UserRole): boolean => {
  if (NON_REDIRECTABLE_ROUTES.some((route) => path === route || path.startsWith(route + '/'))) return false;
  if (role === 'ADMIN') return true;
  if (ADMIN_ONLY_ROUTES.some((route) => path.startsWith(route))) return false;
  return true;
};

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const canAccessFrom = from && isRouteAccessibleToRole(from, user.role);
      const redirectPath = canAccessFrom ? from : getDefaultRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch {
      /* handled by context */
    }
  };

  if (isLoading && !isSubmitting) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-champagne-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-pearl/70">Loading…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-[11px] tracking-[0.18em] uppercase text-champagne-300 font-semibold">Staff Sign In</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-semibold leading-tight">
            Welcome <span className="bg-gradient-to-r from-champagne-200 via-champagne-300 to-champagne-500 bg-clip-text text-transparent">back</span>.
          </h1>
          <p className="mt-3 text-pearl/60 text-sm">Sign in to your Ativa Jewels workspace.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-champagne-500/15 bg-onyx-800/70 backdrop-blur-md p-7 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl border border-rose-400/30 bg-rose-500/10 flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-rose-300 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-200">Login failed</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
              </div>
              <button onClick={clearError} className="text-rose-300/70 hover:text-rose-200 text-xs">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold tracking-wide text-champagne-300 uppercase mb-1.5">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  placeholder="you@ativa-jewels.com"
                  className={`block w-full pl-9 pr-3 py-2.5 rounded-xl bg-onyx-900/70 text-pearl placeholder-pearl/30 border outline-none transition focus:bg-onyx-900 focus:ring-2 focus:ring-champagne-400/40 ${
                    errors.email ? 'border-rose-400/50' : 'border-champagne-500/20 hover:border-champagne-400/40 focus:border-champagne-400/50'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-rose-300">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold tracking-wide text-champagne-300 uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="••••••••"
                  className={`block w-full pl-9 pr-10 py-2.5 rounded-xl bg-onyx-900/70 text-pearl placeholder-pearl/30 border outline-none transition focus:bg-onyx-900 focus:ring-2 focus:ring-champagne-400/40 ${
                    errors.password ? 'border-rose-400/50' : 'border-champagne-500/20 hover:border-champagne-400/40 focus:border-champagne-400/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pearl/40 hover:text-champagne-300 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-rose-300">{errors.password.message}</p>}
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-3.5 h-3.5 rounded bg-onyx-900 border-champagne-500/40 text-champagne-400 focus:ring-champagne-400/50 cursor-pointer"
                />
                <span className="text-xs text-pearl/65 group-hover:text-pearl transition">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-xs font-medium text-champagne-300 hover:text-champagne-200 transition">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-champagne-300 via-champagne-400 to-champagne-600 text-onyx-900 font-semibold shadow-[0_10px_30px_-10px_rgba(232,198,132,0.6)] hover:shadow-[0_15px_40px_-10px_rgba(232,198,132,0.7)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting ? (
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
        </div>

        <p className="text-center text-sm text-pearl/55 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-champagne-300 hover:text-champagne-200 transition">
            Contact Admin
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
