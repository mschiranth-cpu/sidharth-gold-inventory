/**
 * ============================================
 * USER FORM MODAL
 * ============================================
 *
 * Modal for creating and editing users.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  KeyIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { usersService } from '../services';
import {
  User,
  UserFormData,
  DEPARTMENTS,
  DEPARTMENT_LABELS,
  DepartmentName,
  validatePassword,
  validateEmail,
} from '../../../types/user.types';
import { UserRole, USER_ROLE_LABELS } from '../../../types/auth.types';
import { cn } from '../../../lib/utils';

// ============================================
// CONSTANTS
// ============================================

const ROLES: UserRole[] = ['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER'];

const INITIAL_FORM_DATA: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'DEPARTMENT_WORKER',
  department: '',
  phone: '',
};

// ============================================
// PROPS
// ============================================

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const isEditing = !!user;

  // Form state
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          password: '',
          role: user.role,
          department: user.department || '',
          phone: user.phone || '',
        });
      } else {
        setFormData(INITIAL_FORM_DATA);
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, user]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setSubmitError(null);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation (required for new users)
    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else {
        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
          newErrors.password = passwordErrors[0];
        }
      }
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Department validation for workers
    if (
      (formData.role === 'DEPARTMENT_WORKER' || formData.role === 'FACTORY_MANAGER') &&
      !formData.department
    ) {
      newErrors.department = 'Department is required for this role';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditing) {
        await usersService.update(user.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: (formData.department as DepartmentName) || null,
          phone: formData.phone || null,
        });
      } else {
        await usersService.create({
          name: formData.name,
          email: formData.email,
          password: formData.password!,
          role: formData.role,
          department: (formData.department as DepartmentName) || null,
          phone: formData.phone || null,
        });
      }

      onSuccess();
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} user`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

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
              <Dialog.Panel className="group relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 transition-all">
                {/* Decorative background orb */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      <Dialog.Title className="text-lg font-bold text-gray-900">
                        {isEditing ? 'Edit User' : 'Add New User'}
                      </Dialog.Title>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          className={cn(
                            'w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                            errors.name ? 'border-red-300' : 'border-gray-200'
                          )}
                          placeholder="John Doe"
                        />
                      </div>
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className={cn(
                            'w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                            errors.email ? 'border-red-300' : 'border-gray-200'
                          )}
                          placeholder="john@example.com"
                        />
                      </div>
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    {/* Password (only for new users) */}
                    {!isEditing && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                              errors.password ? 'border-red-300' : 'border-gray-200'
                            )}
                            placeholder="••••••••"
                          />
                        </div>
                        {errors.password ? (
                          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        ) : (
                          <p className="mt-1 text-xs text-gray-500">
                            Min 8 characters with uppercase, lowercase, and number
                          </p>
                        )}
                      </div>
                    )}

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <ShieldCheckIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          value={formData.role}
                          onChange={(e) => handleChange('role', e.target.value)}
                          className={cn(
                            'w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white',
                            errors.role ? 'border-red-300' : 'border-gray-200'
                          )}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {USER_ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                        {(formData.role === 'DEPARTMENT_WORKER' ||
                          formData.role === 'FACTORY_MANAGER') && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <div className="relative">
                        <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          value={formData.department}
                          onChange={(e) => handleChange('department', e.target.value)}
                          className={cn(
                            'w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white',
                            errors.department ? 'border-red-300' : 'border-gray-200'
                          )}
                        >
                          <option value="">No Department</option>
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {DEPARTMENT_LABELS[dept]}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.department && (
                        <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className={cn(
                            'w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                            errors.phone ? 'border-red-300' : 'border-gray-200'
                          )}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
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
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium hover:scale-[1.02]"
                      >
                        {submitting && (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {isEditing ? 'Update User' : 'Create User'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UserFormModal;
