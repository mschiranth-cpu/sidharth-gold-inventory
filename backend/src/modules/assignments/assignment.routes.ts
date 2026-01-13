/**
 * ============================================
 * ASSIGNMENT ROUTES
 * ============================================
 *
 * API routes for order assignment operations.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as assignmentController from './assignment.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/assignments/send-to-factory
 * Send one or more orders to factory (bulk operation)
 */
router.post(
  '/send-to-factory',
  authorize('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  assignmentController.sendToFactory
);

/**
 * POST /api/assignments/orders/:orderId/send-to-factory
 * Send a single order to factory
 */
router.post(
  '/orders/:orderId/send-to-factory',
  authorize('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  assignmentController.sendSingleOrderToFactory
);

/**
 * POST /api/assignments/orders/:orderId/departments/:departmentName/reassign
 * Manually reassign a department to a different worker
 */
router.post(
  '/orders/:orderId/departments/:departmentName/reassign',
  authorize('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  assignmentController.reassignDepartment
);

/**
 * POST /api/assignments/orders/:orderId/departments/:departmentName/complete
 * Complete a department and cascade to next
 */
router.post(
  '/orders/:orderId/departments/:departmentName/complete',
  authorize('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER'),
  assignmentController.completeDepartment
);

/**
 * GET /api/assignments/queue/:departmentName
 * Get the current queue for a department
 */
router.get(
  '/queue/:departmentName',
  authorize('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  assignmentController.getDepartmentQueue
);

/**
 * POST /api/assignments/orders/:orderId/move-to/:departmentName
 * Manually move an order to a different department
 */
router.post(
  '/orders/:orderId/move-to/:departmentName',
  authorize('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  assignmentController.moveToDepartment
);

export default router;
