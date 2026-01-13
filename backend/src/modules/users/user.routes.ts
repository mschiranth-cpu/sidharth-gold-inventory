/**
 * ============================================
 * USER MANAGEMENT ROUTES
 * ============================================
 *
 * Express routes for user CRUD operations.
 * Admin-only access for most operations.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole, DepartmentName } from '@prisma/client';
import { authenticate, requireRoles } from '../auth/auth.middleware';
import { userService } from './user.service';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  toggleStatusSchema,
  UserFilters,
} from './user.types';
import { logger } from '../../utils/logger';

const router = Router();

// ============================================
// MIDDLEWARE
// ============================================

// All routes require authentication
router.use(authenticate);

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/users
 * Get all users with filtering and pagination
 * Admin only
 */
router.get('/', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: UserFilters = {
      search: req.query.search as string,
      role: req.query.role as UserRole,
      department: req.query.department as DepartmentName,
      isActive:
        req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as any) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await userService.findAll(filters);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.users,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/stats
 * Get user statistics
 * Admin only
 */
router.get(
  '/stats',
  requireRoles('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await userService.getStats();

      res.json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users/workers
 * Get all active workers
 * Admin and managers
 */
router.get(
  '/workers',
  requireRoles('ADMIN', 'FACTORY_MANAGER', 'OFFICE_STAFF'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const department = req.query.department as DepartmentName;

      let workers;
      if (department) {
        workers = await userService.getWorkersByDepartment(department);
      } else {
        workers = await userService.getAllWorkers();
      }

      res.json({
        success: true,
        message: 'Workers retrieved successfully',
        data: workers,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users/:id
 * Get user by ID
 * Admin only
 */
router.get(
  '/:id',
  requireRoles('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/users
 * Create new user
 * Admin only
 */
router.post('/', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validationResult = createUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
        timestamp: new Date().toISOString(),
      });
    }

    const user = await userService.create(validationResult.data);

    logger.info(`User created: ${user.email} by admin`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.message === 'Email already in use') {
      return res.status(400).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
    next(error);
  }
});

/**
 * PUT /api/users/:id
 * Update user
 * Admin only
 */
router.put(
  '/:id',
  requireRoles('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Validate input
      const validationResult = updateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
      }

      const user = await userService.update(id, validationResult.data);

      logger.info(`User updated: ${user.email} by admin`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
      if (error.message === 'Email already in use') {
        return res.status(400).json({
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
      next(error);
    }
  }
);

/**
 * PATCH /api/users/:id/status
 * Toggle user active status
 * Admin only
 */
router.patch(
  '/:id/status',
  requireRoles('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Validate input
      const validationResult = toggleStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
      }

      const user = await userService.toggleStatus(id, validationResult.data.isActive);

      logger.info(`User ${user.isActive ? 'activated' : 'deactivated'}: ${user.email} by admin`);

      res.json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
      next(error);
    }
  }
);

/**
 * POST /api/users/:id/reset-password
 * Reset user password (admin only)
 * Admin only
 */
router.post(
  '/:id/reset-password',
  requireRoles('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Validate input
      const validationResult = resetPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
      }

      await userService.resetPassword(id, validationResult.data.newPassword);

      logger.info(`Password reset for user ID: ${id} by admin`);

      res.json({
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
      next(error);
    }
  }
);

/**
 * DELETE /api/users/:id
 * Hard delete user (permanently remove)
 * Admin only
 */
router.delete(
  '/:id',
  requireRoles('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await userService.delete(id);

      logger.info(`User permanently deleted: ${id} by admin`);

      res.json({
        success: true,
        message: 'User deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
      next(error);
    }
  }
);

export { router as userRoutes };
