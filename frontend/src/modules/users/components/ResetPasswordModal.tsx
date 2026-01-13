/**
 * ============================================
 * RESET PASSWORD MODAL
 * ============================================
 *
 * Modal for resetting a user's password (admin only).
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { usersService } from '../services';
import { User, PasswordFormData, validatePassword } from '../../../types/user.types';
import { cn } from '../../../lib/utils';

// ============================================
// PROPS
// ============================================

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  // Form state
  const [formData, setFormData] = useState<PasswordFormData>({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ newPassword: '', confirmPassword: '' });
      setErrors({});
      setSubmitError(null);
      setSuccess(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (field: keyof PasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setSubmitError(null);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PasswordFormData, string>> = {};

    // Password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else {
      const passwordErrors = validatePassword(formData.newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors[0];
      }
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm the password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !user) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await usersService.resetPassword(user.id, {
        newPassword: formData.newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (
    password: string
  ): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { strength: 50, label: 'Fair', color: 'bg-purple-500' };
    if (score <= 4) return { strength: 75, label: 'Good', color: 'bg-blue-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  // ============================================
  // RENDER
  // ============================================

  if (!user) return null;

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="group relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 transition-all">
                {/* Decorative background orb */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/30">
                        <KeyIcon className="h-5 w-5 text-white" />
                      </div>
                      <Dialog.Title className="text-lg font-bold text-gray-900">
                        Reset Password
                      </Dialog.Title>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100/80 rounded-xl mb-6 border border-gray-100">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-indigo-500/30">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>

                  {success ? (
                    // Success State
                    <div className="text-center py-6">
                      <div className="mx-auto w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                        <CheckCircleIcon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Password Reset!</h3>
                      <p className="text-gray-500">
                        The password for {user.name} has been successfully reset.
                      </p>
                    </div>
                  ) : (
                    // Form
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.newPassword}
                            onChange={(e) => handleChange('newPassword', e.target.value)}
                            className={cn(
                              'w-full pl-10 pr-12 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                              errors.newPassword ? 'border-red-300' : 'border-gray-200'
                            )}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {errors.newPassword ? (
                          <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                        ) : (
                          formData.newPassword && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">Password strength</span>
                                <span
                                  className={cn(
                                    'font-medium',
                                    passwordStrength.strength <= 25 && 'text-red-600',
                                    passwordStrength.strength === 50 && 'text-purple-600',
                                    passwordStrength.strength === 75 && 'text-blue-600',
                                    passwordStrength.strength === 100 && 'text-green-600'
                                  )}
                                >
                                  {passwordStrength.label}
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full transition-all duration-300',
                                    passwordStrength.color
                                  )}
                                  style={{ width: `${passwordStrength.strength}%` }}
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            className={cn(
                              'w-full pl-10 pr-12 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                              errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                            )}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                        )}
                      </div>

                      {/* Password Requirements */}
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Password requirements:
                        </p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li
                            className={cn(
                              'flex items-center gap-1',
                              formData.newPassword.length >= 8 && 'text-green-600'
                            )}
                          >
                            <span className="w-3">
                              {formData.newPassword.length >= 8 ? '✓' : '•'}
                            </span>
                            At least 8 characters
                          </li>
                          <li
                            className={cn(
                              'flex items-center gap-1',
                              /[A-Z]/.test(formData.newPassword) && 'text-green-600'
                            )}
                          >
                            <span className="w-3">
                              {/[A-Z]/.test(formData.newPassword) ? '✓' : '•'}
                            </span>
                            One uppercase letter
                          </li>
                          <li
                            className={cn(
                              'flex items-center gap-1',
                              /[a-z]/.test(formData.newPassword) && 'text-green-600'
                            )}
                          >
                            <span className="w-3">
                              {/[a-z]/.test(formData.newPassword) ? '✓' : '•'}
                            </span>
                            One lowercase letter
                          </li>
                          <li
                            className={cn(
                              'flex items-center gap-1',
                              /[0-9]/.test(formData.newPassword) && 'text-green-600'
                            )}
                          >
                            <span className="w-3">
                              {/[0-9]/.test(formData.newPassword) ? '✓' : '•'}
                            </span>
                            One number
                          </li>
                        </ul>
                      </div>

                      {/* Submit Error */}
                      {submitError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100">
                          <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
                          <span className="text-sm">{submitError}</span>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 hover:shadow-md transition-all duration-200 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium hover:scale-[1.02]"
                        >
                          {submitting && (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          )}
                          Reset Password
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ResetPasswordModal;
