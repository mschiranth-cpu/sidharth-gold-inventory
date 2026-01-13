/**
 * ============================================
 * ZOD VALIDATION SCHEMAS
 * ============================================
 * 
 * Comprehensive input validation schemas for all API endpoints.
 * Provides type-safe validation with detailed error messages.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { z } from 'zod';
import { securityConfig, COMMON_PASSWORDS } from '../config/security.config';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a password schema with all complexity requirements
 */
function createPasswordSchema() {
  const config = securityConfig.authentication.password;
  
  let schema = z.string()
    .min(config.minLength, `Password must be at least ${config.minLength} characters`)
    .max(config.maxLength, `Password must be at most ${config.maxLength} characters`);

  return schema.refine(
    (password) => {
      const errors: string[] = [];

      if (config.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('at least one uppercase letter');
      }
      if (config.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('at least one lowercase letter');
      }
      if (config.requireNumbers && !/[0-9]/.test(password)) {
        errors.push('at least one number');
      }
      if (config.requireSpecialChars && !new RegExp(`[${config.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
        errors.push('at least one special character');
      }
      if (config.preventCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
        errors.push('not be a commonly used password');
      }

      return errors.length === 0;
    },
    {
      message: 'Password must contain: uppercase, lowercase, number, and special character',
    }
  );
}

// ============================================
// COMMON SCHEMAS
// ============================================

// Email schema with proper validation
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .toLowerCase()
  .trim();

// Password schema with complexity requirements
export const passwordSchema = createPasswordSchema();

// UUID/CUID schema
export const idSchema = z.string().min(1, 'ID is required').max(50);

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: 'Start date must be before end date' }
);

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .trim(),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['ADMIN', 'MANAGER', 'WORKER', 'VIEWER']).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  { message: 'New password must be different from current password', path: ['newPassword'] }
);

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);

export const twoFactorSetupSchema = z.object({
  password: z.string().min(1, 'Password is required for 2FA setup'),
});

export const twoFactorVerifySchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits').regex(/^\d+$/, 'Token must be numeric'),
});

// ============================================
// USER SCHEMAS
// ============================================

export const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['ADMIN', 'MANAGER', 'WORKER', 'VIEWER']),
  department: z.string().optional(),
  phoneNumber: z.string().max(20).optional(),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: emailSchema.optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'WORKER', 'VIEWER']).optional(),
  department: z.string().optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const userFilterSchema = paginationSchema.extend({
  role: z.enum(['ADMIN', 'MANAGER', 'WORKER', 'VIEWER']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  department: z.string().optional(),
});

// ============================================
// ORDER SCHEMAS
// ============================================

// Item schema for order items
const orderItemSchema = z.object({
  name: z.string().min(1, 'Item name required').max(200),
  quantity: z.number().int().positive('Quantity must be positive'),
  weight: z.number().positive('Weight must be positive'),
  purity: z.number().min(0).max(100, 'Purity must be 0-100'),
  description: z.string().max(1000).optional(),
  designDetails: z.string().max(2000).optional(),
  stoneDetails: z.string().max(1000).optional(),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name required').max(200).trim(),
  customerPhone: z.string().max(20).optional(),
  customerAddress: z.string().max(500).optional(),
  orderDate: z.coerce.date().optional(),
  dueDate: z.coerce.date(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  notes: z.string().max(5000).optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item required'),
  totalWeight: z.number().positive().optional(),
  advanceAmount: z.number().min(0).optional(),
  estimatedCost: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.orderDate && data.dueDate) {
      return data.orderDate <= data.dueDate;
    }
    return true;
  },
  { message: 'Order date must be before due date', path: ['dueDate'] }
);

export const updateOrderSchema = z.object({
  customerName: z.string().min(1).max(200).trim().optional(),
  customerPhone: z.string().max(20).optional().nullable(),
  customerAddress: z.string().max(500).optional().nullable(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'QUALITY_CHECK', 'COMPLETED', 'DELIVERED', 'CANCELLED']).optional(),
  notes: z.string().max(5000).optional().nullable(),
  items: z.array(orderItemSchema).optional(),
  advanceAmount: z.number().min(0).optional(),
  finalAmount: z.number().min(0).optional(),
});

export const orderFilterSchema = paginationSchema.merge(dateRangeSchema).extend({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'QUALITY_CHECK', 'COMPLETED', 'DELIVERED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  search: z.string().max(100).optional(),
  customerId: z.string().optional(),
});

// ============================================
// DEPARTMENT/FACTORY SCHEMAS
// ============================================

export const updateDepartmentStatusSchema = z.object({
  department: z.enum(['DESIGN', 'CASTING', 'GRINDING', 'FILING', 'SETTING', 'POLISH', 'QUALITY_CHECK', 'DELIVERY']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'SKIPPED']),
  notes: z.string().max(2000).optional(),
  workerId: z.string().optional(),
  actualWeight: z.number().positive().optional(),
  wastage: z.number().min(0).optional(),
});

export const submitToNextDepartmentSchema = z.object({
  currentDepartment: z.string(),
  nextDepartment: z.string(),
  notes: z.string().max(2000).optional(),
  weight: z.number().positive().optional(),
  images: z.array(z.string().url()).optional(),
});

export const departmentFilterSchema = paginationSchema.extend({
  department: z.enum(['DESIGN', 'CASTING', 'GRINDING', 'FILING', 'SETTING', 'POLISH', 'QUALITY_CHECK', 'DELIVERY']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'SKIPPED']).optional(),
  workerId: z.string().optional(),
});

// ============================================
// NOTIFICATION SCHEMAS
// ============================================

export const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).default('INFO'),
  targetUserId: z.string().optional(),
  targetRole: z.enum(['ADMIN', 'MANAGER', 'WORKER', 'VIEWER', 'ALL']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
  expiresAt: z.coerce.date().optional(),
});

export const notificationFilterSchema = paginationSchema.extend({
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).optional(),
  isRead: z.coerce.boolean().optional(),
});

// ============================================
// REPORT SCHEMAS
// ============================================

export const reportFilterSchema = dateRangeSchema.extend({
  reportType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).default('DAILY'),
  departments: z.array(z.string()).optional(),
  workers: z.array(z.string()).optional(),
  includeDetails: z.boolean().default(false),
});

export const dashboardFilterSchema = z.object({
  period: z.enum(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR']).default('WEEK'),
});

// ============================================
// API KEY SCHEMAS
// ============================================

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(['read', 'write', 'admin', 'reports'])).min(1),
  expiresAt: z.coerce.date().optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
});

// ============================================
// VALIDATION MIDDLEWARE FACTORY
// ============================================

import { Request, Response, NextFunction } from 'express';

type ValidationLocation = 'body' | 'query' | 'params';

interface ValidationOptions {
  stripUnknown?: boolean;
}

/**
 * Create validation middleware for a Zod schema
 */
export function validateRequest<T extends z.ZodSchema>(
  schema: T,
  location: ValidationLocation = 'body',
  options: ValidationOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req[location];
      
      const result = await schema.safeParseAsync(data);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            statusCode: 400,
            details: errors,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Replace request data with parsed (and optionally stripped) data
      req[location] = result.data;
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Combined validation for multiple locations
 */
export function validateAll(schemas: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors: { location: string; field: string; message: string }[] = [];

    for (const [location, schema] of Object.entries(schemas)) {
      if (!schema) continue;
      
      const result = await schema.safeParseAsync(req[location as ValidationLocation]);
      
      if (!result.success) {
        result.error.errors.forEach(err => {
          errors.push({
            location,
            field: err.path.join('.'),
            message: err.message,
          });
        });
      } else {
        req[location as ValidationLocation] = result.data;
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          statusCode: 400,
          details: errors,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export default {
  // Auth
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  twoFactorSetupSchema,
  twoFactorVerifySchema,
  
  // User
  createUserSchema,
  updateUserSchema,
  userFilterSchema,
  
  // Order
  createOrderSchema,
  updateOrderSchema,
  orderFilterSchema,
  
  // Department
  updateDepartmentStatusSchema,
  submitToNextDepartmentSchema,
  departmentFilterSchema,
  
  // Notification
  createNotificationSchema,
  notificationFilterSchema,
  
  // Report
  reportFilterSchema,
  dashboardFilterSchema,
  
  // API Key
  createApiKeySchema,
  
  // Common
  paginationSchema,
  dateRangeSchema,
  emailSchema,
  passwordSchema,
  idSchema,
  
  // Middleware
  validateRequest,
  validateAll,
};
