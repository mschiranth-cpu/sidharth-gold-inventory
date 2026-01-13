/**
 * ============================================
 * USER MANAGEMENT TYPES
 * ============================================
 * 
 * TypeScript types for user management operations.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { z } from 'zod';
import { UserRole, DepartmentName } from '@prisma/client';

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Create user validation schema
 */
export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.nativeEnum(UserRole),
  department: z.nativeEnum(DepartmentName).optional().nullable(),
  phone: z.string().optional().nullable(),
});

/**
 * Update user validation schema
 */
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.nativeEnum(UserRole).optional(),
  department: z.nativeEnum(DepartmentName).optional().nullable(),
  phone: z.string().optional().nullable(),
});

/**
 * Reset password validation schema (admin)
 */
export const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

/**
 * Toggle user status schema
 */
export const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ToggleStatusInput = z.infer<typeof toggleStatusSchema>;

/**
 * User response (without password)
 */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: DepartmentName | null;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User list filters
 */
export interface UserFilters {
  search?: string;           // Search by name or email
  role?: UserRole;           // Filter by role
  department?: DepartmentName; // Filter by department
  isActive?: boolean;        // Filter by active status
  page?: number;             // Pagination
  limit?: number;            // Items per page
  sortBy?: 'name' | 'email' | 'role' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated user response
 */
export interface PaginatedUsersResponse {
  users: UserResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * User statistics
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: Record<UserRole, number>;
  recentLogins: number; // Users who logged in within last 7 days
}
