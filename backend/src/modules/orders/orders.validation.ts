/**
 * ============================================
 * ORDERS VALIDATION SCHEMAS
 * ============================================
 *
 * Zod validation schemas for order-related requests.
 * Provides runtime type checking and validation.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { z } from 'zod';
import { OrderStatus, DepartmentName, StoneType } from '@prisma/client';

// ============================================
// COMMON SCHEMAS
// ============================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Date string validation (ISO 8601 format)
 */
export const dateStringSchema = z.string().refine((val: string) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-15)',
});

/**
 * Positive number validation
 */
export const positiveNumberSchema = z.number().positive('Value must be positive');

/**
 * Gold purity validation (in karats)
 */
export const puritySchema = z
  .number()
  .min(1, 'Purity must be at least 1 karat')
  .max(24, 'Purity cannot exceed 24 karats');

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email format').optional().or(z.literal(''));

/**
 * Phone validation (Indian format)
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

/**
 * URL validation for images (base schema without optional)
 * Accepts regular URLs and data URLs (base64)
 */
const imageUrlBaseSchema = z.string().refine((val) => {
  if (!val) return true;
  // Accept data URLs (base64 images)
  if (val.startsWith('data:image/')) return true;
  // Accept regular http/https URLs
  try {
    const url = new URL(val);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Invalid URL or data URL format');

/**
 * URL validation for images (optional)
 * Accepts regular URLs and data URLs (base64)
 */
export const imageUrlSchema = imageUrlBaseSchema.optional();

// ============================================
// STONE SCHEMAS
// ============================================

/**
 * Stone type enum schema
 */
export const stoneTypeSchema = z.nativeEnum(StoneType);

/**
 * Stone input validation
 */
export const stoneInputSchema = z
  .object({
    stoneType: stoneTypeSchema,
    stoneName: z.string().max(100, 'Stone name too long').optional(),
    customType: z.string().max(100, 'Custom stone type too long').optional(),
    weight: z.number().positive('Stone weight must be positive'),
    quantity: z.number().int().positive('Quantity must be a positive integer').default(1),
    color: z.string().max(50).optional(),
    clarity: z.string().max(50).optional(),
    cut: z.string().max(50).optional(),
    shape: z.string().max(50).optional(),
    customShape: z.string().max(100, 'Custom shape too long').optional(),
    setting: z.string().max(50).optional(),
    customSetting: z.string().max(100, 'Custom setting too long').optional(),
    notes: z.string().max(500, 'Notes too long').optional(),
  })
  .refine(
    (data) => {
      // If stone type is "OTHER", customType is required
      if (data.stoneType === StoneType.OTHER) {
        return data.customType !== undefined && data.customType.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Custom stone type is required when stone type is "Other"',
      path: ['customType'],
    }
  );

/**
 * Array of stones validation
 */
export const stonesArraySchema = z.array(stoneInputSchema).optional();

// ============================================
// ORDER DETAILS SCHEMAS
// ============================================

/**
 * Order details input validation
 */
export const orderDetailsInputSchema = z.object({
  goldWeightInitial: z
    .number()
    .positive('Gold weight must be positive')
    .max(10000, 'Gold weight cannot exceed 10kg')
    .optional(),
  purity: puritySchema,
  goldColor: z.string().max(50).optional(),
  metalType: z.enum(['GOLD', 'SILVER', 'PLATINUM']).optional().default('GOLD'),
  metalFinish: z.string().max(100).optional(),
  customFinish: z.string().max(200).optional(),
  size: z.string().max(50).optional(),
  quantity: z.number().int().positive().default(1),
  productType: z.string().max(100).optional(),
  customProductType: z.string().max(200).optional(),
  dueDate: dateStringSchema,
  additionalDescription: z.string().max(2000, 'Description too long').optional(),
  specialInstructions: z.string().max(1000, 'Instructions too long').optional(),
  referenceImages: z.array(imageUrlBaseSchema).max(10, 'Maximum 10 reference images').optional(),
});

/**
 * Partial order details for updates
 */
export const orderDetailsUpdateSchema = orderDetailsInputSchema.partial();

// ============================================
// CREATE ORDER SCHEMA
// ============================================

/**
 * Create order request validation
 */
export const createOrderSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(200, 'Customer name too long'),
  customerPhone: phoneSchema,
  customerEmail: emailSchema,
  productPhotoUrl: imageUrlSchema,
  priority: z.number().int().min(0).max(10).default(0),
  orderDetails: orderDetailsInputSchema,
  stones: stonesArraySchema,
});

// ============================================
// UPDATE ORDER SCHEMA
// ============================================

/**
 * Update order request validation
 */
export const updateOrderSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(200, 'Customer name too long')
    .optional(),
  customerPhone: phoneSchema,
  customerEmail: emailSchema,
  productPhotoUrl: imageUrlSchema,
  status: z.nativeEnum(OrderStatus).optional(),
  priority: z.number().int().min(0).max(10).optional(),
  orderDetails: orderDetailsUpdateSchema.optional(),
});

// ============================================
// STATUS UPDATE SCHEMA
// ============================================

/**
 * Order status update validation
 */
export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

/**
 * Pagination parameters validation
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'orderNumber', 'status', 'priority', 'dueDate'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Order filters validation
 */
export const orderFiltersSchema = z.object({
  // Search
  search: z.string().max(200).optional(),
  orderNumber: z.string().max(50).optional(),

  // Status
  status: z.union([z.nativeEnum(OrderStatus), z.array(z.nativeEnum(OrderStatus))]).optional(),

  // Dates
  createdFrom: dateStringSchema.optional(),
  createdTo: dateStringSchema.optional(),
  dueDateFrom: dateStringSchema.optional(),
  dueDateTo: dateStringSchema.optional(),

  // Department
  currentDepartment: z.nativeEnum(DepartmentName).optional(),
  inDepartment: z.nativeEnum(DepartmentName).optional(),

  // Other
  priority: z.coerce.number().int().min(0).max(10).optional(),
  priorityMin: z.coerce.number().int().min(0).max(10).optional(),
  createdById: uuidSchema.optional(),

  // Include deleted
  includeDeleted: z.coerce.boolean().default(false),
});

/**
 * Combined query parameters
 */
export const orderQuerySchema = paginationSchema.merge(orderFiltersSchema);

// ============================================
// PHOTO UPLOAD SCHEMA
// ============================================

/**
 * Photo upload validation
 */
export const photoUploadSchema = z
  .object({
    type: z.enum(['product', 'reference', 'department', 'completion']),
    departmentName: z.nativeEnum(DepartmentName).optional(),
  })
  .refine((data) => data.type !== 'department' || data.departmentName !== undefined, {
    message: 'departmentName is required when type is "department"',
  });

// ============================================
// ADD STONE SCHEMA
// ============================================

/**
 * Add stone to existing order
 */
export const addStoneSchema = stoneInputSchema;

/**
 * Add multiple stones
 */
export const addStonesSchema = z.object({
  stones: z.array(stoneInputSchema).min(1, 'At least one stone is required'),
});

// ============================================
// ID PARAMETER SCHEMA
// ============================================

/**
 * Validate route parameters
 */
export const orderIdParamSchema = z.object({
  id: uuidSchema,
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type StoneInput = z.infer<typeof stoneInputSchema>;
export type OrderDetailsInput = z.infer<typeof orderDetailsInputSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type PhotoUploadInput = z.infer<typeof photoUploadSchema>;
