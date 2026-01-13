/**
 * ============================================
 * USER MANAGEMENT TYPES (Frontend)
 * ============================================
 *
 * TypeScript types for user management in frontend.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { UserRole } from './auth.types';

// ============================================
// DEPARTMENT ENUM (matches backend)
// ============================================

export type DepartmentName =
  | 'CAD'
  | 'PRINT'
  | 'CASTING'
  | 'FILLING'
  | 'MEENA'
  | 'POLISH_1'
  | 'SETTING'
  | 'POLISH_2'
  | 'ADDITIONAL';

export const DEPARTMENT_LABELS: Record<DepartmentName, string> = {
  CAD: 'CAD Design Studio',
  PRINT: '3D Printing Lab',
  CASTING: 'Casting Workshop',
  FILLING: 'Filling & Shaping',
  MEENA: 'Meena Artistry',
  POLISH_1: 'Primary Polish',
  SETTING: 'Stone Setting',
  POLISH_2: 'Final Polish',
  ADDITIONAL: 'Finishing Touch',
};

export const DEPARTMENTS: DepartmentName[] = [
  'CAD',
  'PRINT',
  'CASTING',
  'FILLING',
  'MEENA',
  'POLISH_1',
  'SETTING',
  'POLISH_2',
  'ADDITIONAL',
];

// ============================================
// USER TYPES
// ============================================

/**
 * User data from API
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: DepartmentName | null;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create user request
 */
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: DepartmentName | null;
  phone?: string | null;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  department?: DepartmentName | null;
  phone?: string | null;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  newPassword: string;
}

/**
 * Toggle status request
 */
export interface ToggleStatusRequest {
  isActive: boolean;
}

/**
 * User list filters
 */
export interface UserFilters {
  search?: string;
  role?: UserRole;
  department?: DepartmentName;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'role' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * User list response
 */
export interface UserListResponse {
  success: boolean;
  message: string;
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * Single user response
 */
export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
  timestamp: string;
}

/**
 * User statistics
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: Record<UserRole, number>;
  recentLogins: number;
}

/**
 * User stats response
 */
export interface UserStatsResponse {
  success: boolean;
  message: string;
  data: UserStats;
  timestamp: string;
}

// ============================================
// FORM TYPES
// ============================================

/**
 * User form data (for add/edit)
 */
export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: DepartmentName | '';
  phone: string;
}

/**
 * Password form data
 */
export interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

// ============================================
// VALIDATION
// ============================================

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
};

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return errors;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
