/**
 * ============================================
 * CLIENT REGISTER PAGE — Onyx & Gold Edition
 * ============================================
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { selfRegister } from '../../services/clients.service';
import AuthShell from '../../components/common/AuthShell';

export default function ClientRegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await selfRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName,
        phone: formData.phone,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'block w-full pl-9 pr-3 py-2.5 rounded-xl bg-onyx-900/70 text-pearl placeholder-pearl/30 border border-champagne-500/20 hover:border-champagne-400/40 focus:border-champagne-400/50 focus:bg-onyx-900 focus:ring-2 focus:ring-champagne-400/40 outline-none transition';

  if (success) {
    return (
      <AuthShell>
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/15 to-onyx-800 ring-1 ring-emerald-400/40 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.4)] mb-6">
            <CheckCircleIcon className="w-10 h-10 text-emerald-300" />
          </div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-emerald-300 font-semibold">Account Created</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-semibold leading-tight text-pearl">
            Almost <span className="bg-gradient-to-r from-champagne-200 via-champagne-300 to-champagne-500 bg-clip-text text-transparent">there</span>.
          </h1>
          <p className="mt-3 text-pearl/60 text-sm">
            Your account is awaiting administrator approval. We'll notify you by email once it's active.
          </p>

          <button
            onClick={() => navigate('/client/login')}
            className="group relative mt-8 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-champagne-300 via-champagne-400 to-champagne-600 text-onyx-900 font-semibold shadow-[0_10px_30px_-10px_rgba(232,198,132,0.6)] hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_rgba(232,198,132,0.7)] transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Go to Sign In
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </span>
            <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out" />
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-[11px] tracking-[0.18em] uppercase text-champagne-300 font-semibold">Client Portal</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-semibold leading-tight">
            Create your <span className="bg-gradient-to-r from-champagne-200 via-champagne-300 to-champagne-500 bg-clip-text text-transparent">account</span>.
          </h1>
          <p className="mt-3 text-pearl/60 text-sm">Register to track your orders and stay connected with the floor.</p>
        </div>

        <div className="rounded-2xl border border-champagne-500/15 bg-onyx-800/70 backdrop-blur-md p-7 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl border border-rose-400/30 bg-rose-500/10 flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-rose-300 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-200">Registration failed</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wide text-champagne-300 uppercase mb-1.5">
                Full Name <span className="text-rose-300/80">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-champagne-300 uppercase mb-1.5">
                Email Address <span className="text-rose-300/80">*</span>
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wide text-champagne-300 uppercase mb-1.5">
                  Business Name
                </label>
                <div className="relative">
                  <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Your Business"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wide text-champagne-300 uppercase mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-champagne-300 uppercase mb-1.5">
                Password <span className="text-rose-300/80">*</span>
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters"
                  minLength={8}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-champagne-300 uppercase mb-1.5">
                Confirm Password <span className="text-rose-300/80">*</span>
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-champagne-300 via-champagne-400 to-champagne-600 text-onyx-900 font-semibold shadow-[0_10px_30px_-10px_rgba(232,198,132,0.6)] hover:shadow-[0_15px_40px_-10px_rgba(232,198,132,0.7)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden mt-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-onyx-900 border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </>
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-pearl/55">
              Already have an account?{' '}
              <Link to="/client/login" className="font-medium text-champagne-300 hover:text-champagne-200 transition">
                Sign in
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
