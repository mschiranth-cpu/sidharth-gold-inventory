/**
 * ============================================
 * ORDERS ROUTES
 * ============================================
 *
 * Route definitions for Order endpoints.
 * All routes require authentication.
 * Some routes require specific roles.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { authenticate, requireRoles } from '../auth/auth.middleware';
import {
  handleCreateOrder,
  handleGetOrders,
  handleGetOrderById,
  handleUpdateOrder,
  handleDeleteOrder,
  handleUploadPhoto,
  handleAddStones,
  handleGetOrderStats,
  handleAssignWorker,
  handleSelfAssign,
  handleGetDepartmentWorkers,
  handleAddReferenceImage,
  handleAddCompletionPhoto,
} from './orders.controller';
import {
  ordersListCacheMiddleware,
  dashboardCacheMiddleware,
  invalidateOrdersCache,
} from '../../middleware/cache';
import { apiRateLimiter, uploadRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// ============================================
// MIDDLEWARE
// ============================================

// All routes require authentication
router.use(authenticate);

// Apply API rate limiter to all order routes
router.use(apiRateLimiter);

// ============================================
// ROUTE DEFINITIONS
// ============================================

/**
 * GET /api/orders/stats
 *
 * Get order statistics.
 * Admin, Office Staff, and Factory Manager only.
 *
 * Note: This route must be defined BEFORE /:id
 * to prevent "stats" being treated as an ID.
 */
router.get(
  '/stats',
  requireRoles('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  dashboardCacheMiddleware, // Cache stats for 5 minutes
  handleGetOrderStats
);

/**
 * GET /api/orders
 *
 * Get all orders with pagination and filtering.
 * All authenticated users can access.
 * Factory users won't see customer information.
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sortBy: string (createdAt, orderNumber, status, priority, dueDate)
 * - sortOrder: 'asc' | 'desc'
 * - search: string (searches order number and customer name)
 * - status: OrderStatus (DRAFT, IN_FACTORY, COMPLETED)
 * - createdFrom: ISO date string
 * - createdTo: ISO date string
 * - dueDateFrom: ISO date string
 * - dueDateTo: ISO date string
 * - currentDepartment: DepartmentName
 * - priority: number (exact match)
 * - priorityMin: number (minimum priority)
 */
router.get('/', ordersListCacheMiddleware, handleGetOrders);

/**
 * GET /api/orders/:id
 *
 * Get a single order by ID.
 * All authenticated users can access.
 * Factory users won't see customer information.
 */
router.get('/:id', handleGetOrderById);

/**
 * POST /api/orders
 *
 * Create a new order.
 * Admin and Office Staff only.
 *
 * Request Body:
 * {
 *   customerName: string (required)
 *   customerPhone: string (required)
 *   customerEmail?: string
 *   productPhotoUrl?: string
 *   priority?: number (1-10, default: 5)
 *   orderDetails: {
 *     goldWeightInitial: number (required)
 *     purity: number (1-24, required)
 *     goldColor?: string
 *     size?: string
 *     quantity: number (required)
 *     productType: string (required)
 *     dueDate?: ISO date string
 *     additionalDescription?: string
 *     specialInstructions?: string
 *   }
 *   stones?: [{
 *     stoneType: StoneType (required)
 *     weight?: number
 *     quantity?: number
 *     clarity?: string
 *     color?: string
 *     cut?: string
 *     setting?: string
 *   }]
 * }
 */
router.post(
  '/',
  requireRoles('ADMIN', 'OFFICE_STAFF'),
  handleCreateOrder,
  invalidateOrdersCache // Invalidate cache after creating order
);

/**
 * PUT /api/orders/:id
 *
 * Update an existing order.
 * All authenticated users can access.
 * Factory users cannot modify customer information.
 * Cannot modify completed orders.
 *
 * Request Body: (all fields optional)
 * {
 *   customerName?: string
 *   customerPhone?: string
 *   customerEmail?: string
 *   status?: OrderStatus
 *   priority?: number
 *   orderDetails?: {
 *     goldWeightInitial?: number
 *     goldWeightFinal?: number
 *     purity?: number
 *     goldColor?: string
 *     size?: string
 *     quantity?: number
 *     productType?: string
 *     dueDate?: string
 *     additionalDescription?: string
 *     specialInstructions?: string
 *   }
 * }
 */
router.put('/:id', handleUpdateOrder, invalidateOrdersCache);

/**
 * DELETE /api/orders/:id
 *
 * Delete an order (soft delete).
 * Admin only.
 * Cannot delete completed orders with final submissions.
 */
router.delete(
  '/:id',
  requireRoles('ADMIN'),
  handleDeleteOrder,
  invalidateOrdersCache // Invalidate cache after deleting order
);

/**
 * POST /api/orders/:id/photo
 *
 * Upload/update product photo for an order.
 * Admin and Office Staff only.
 *
 * Request Body:
 * {
 *   photoUrl: string (required, valid URL)
 * }
 */
router.post(
  '/:id/photo',
  requireRoles('ADMIN', 'OFFICE_STAFF'),
  uploadRateLimiter, // Stricter rate limit for uploads
  handleUploadPhoto,
  invalidateOrdersCache
);

/**
 * POST /api/orders/:id/reference-images
 *
 * Add a reference image to an order.
 * Admin and Office Staff only.
 *
 * Request Body:
 * {
 *   imageUrl: string (required, base64 or URL)
 * }
 */
router.post(
  '/:id/reference-images',
  requireRoles('ADMIN', 'OFFICE_STAFF'),
  uploadRateLimiter,
  handleAddReferenceImage,
  invalidateOrdersCache
);

/**
 * POST /api/orders/:id/completion-photos
 *
 * Add a completion photo to an order.
 * Admin and Office Staff only.
 *
 * Request Body:
 * {
 *   photoUrl: string (required, base64 or URL)
 * }
 */
router.post(
  '/:id/completion-photos',
  requireRoles('ADMIN', 'OFFICE_STAFF'),
  uploadRateLimiter,
  handleAddCompletionPhoto,
  invalidateOrdersCache
);

/**
 * POST /api/orders/:id/stones
 *
 * Add stones to an existing order.
 * Admin and Office Staff only.
 *
 * Request Body:
 * {
 *   stones: [{
 *     stoneType: StoneType (required)
 *     weight?: number
 *     quantity?: number
 *     clarity?: string
 *     color?: string
 *     cut?: string
 *     setting?: string
 *   }]
 * }
 */
router.post(
  '/:id/stones',
  requireRoles('ADMIN', 'OFFICE_STAFF'),
  handleAddStones,
  invalidateOrdersCache
);

/**
 * PATCH /api/orders/:id/departments/:departmentName/assign
 *
 * Assign a worker to a department for an order.
 * Admin and Office Staff only.
 *
 * Request Body:
 * {
 *   workerId: string (required)
 * }
 */
router.patch(
  '/:id/departments/:departmentName/assign',
  requireRoles('ADMIN', 'OFFICE_STAFF'),
  handleAssignWorker,
  invalidateOrdersCache
);

/**
 * POST /api/orders/:id/departments/:departmentName/self-assign
 *
 * Worker self-assigns to a pending order in their department.
 * Department Workers only.
 *
 * No request body needed.
 */
router.post(
  '/:id/departments/:departmentName/self-assign',
  requireRoles('DEPARTMENT_WORKER'),
  handleSelfAssign,
  invalidateOrdersCache
);

/**
 * GET /api/orders/departments/:departmentName/workers
 *
 * Get list of workers in a specific department with their workload.
 * All authenticated users.
 */
router.get('/departments/:departmentName/workers', handleGetDepartmentWorkers);

// ============================================
// EXPORT
// ============================================

export default router;

export { router as ordersRouter };
