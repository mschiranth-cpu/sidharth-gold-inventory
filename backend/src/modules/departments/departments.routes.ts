/**
 * ============================================
 * DEPARTMENT TRACKING ROUTES
 * ============================================
 *
 * Route definitions for department tracking endpoints.
 * These routes are nested under /api/orders/:orderId/departments
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { authenticate, requireRoles } from '../auth/auth.middleware';
import {
  handleGetOrderDepartments,
  handleGetDepartmentTracking,
  handleStartDepartment,
  handleCompleteDepartment,
  handleAssignWorker,
  handleUnassignWorker,
  handleUploadPhotos,
  handleGetPhotoUploadUrl,
  handlePutOnHold,
  handleResumeDepartment,
} from './departments.controller';

// Use mergeParams to access :orderId from parent router
const router = Router({ mergeParams: true });

// ============================================
// MIDDLEWARE
// ============================================

// All routes require authentication
router.use(authenticate);

// ============================================
// ROUTE DEFINITIONS
// ============================================

/**
 * GET /api/orders/:orderId/departments
 *
 * Get all department statuses for an order.
 * All authenticated users can access.
 *
 * Response:
 * {
 *   orderId: string,
 *   orderNumber: string,
 *   orderStatus: string,
 *   departments: DepartmentTrackingResponse[],
 *   summary: {
 *     totalDepartments: number,
 *     completedDepartments: number,
 *     currentDepartment: string | null,
 *     completionPercentage: number,
 *     totalEstimatedHours: number | null,
 *     totalActualHours: number | null
 *   }
 * }
 */
router.get('/', handleGetOrderDepartments);

/**
 * GET /api/orders/:orderId/departments/:deptName
 *
 * Get a single department's tracking details.
 * All authenticated users can access.
 */
router.get('/:deptName', handleGetDepartmentTracking);

/**
 * PUT /api/orders/:orderId/departments/:deptName/start
 *
 * Mark a department as started.
 * Auto-captures start timestamp.
 * Validates sequential flow (previous departments must be completed).
 *
 * Access: Factory Manager, Admin, Office Staff
 *
 * Request Body (optional):
 * {
 *   goldWeightIn?: number,
 *   estimatedHours?: number,
 *   notes?: string
 * }
 */
router.put(
  '/:deptName/start',
  requireRoles('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER'),
  handleStartDepartment
);

/**
 * PUT /api/orders/:orderId/departments/:deptName/complete
 *
 * Mark a department as completed.
 * Auto-captures end timestamp and calculates duration.
 * Calculates gold loss if weights provided.
 * Sends notifications.
 *
 * Access: Factory Manager, Admin, Office Staff
 *
 * Request Body (optional):
 * {
 *   goldWeightOut?: number,
 *   notes?: string,
 *   issues?: string
 * }
 */
router.put(
  '/:deptName/complete',
  requireRoles('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER'),
  handleCompleteDepartment
);

/**
 * PUT /api/orders/:orderId/departments/:deptName/assign
 *
 * Assign a worker to a department.
 *
 * Access: Factory Manager, Admin, Office Staff only
 *
 * Request Body:
 * {
 *   workerId: string (required, UUID),
 *   estimatedHours?: number,
 *   notes?: string
 * }
 */
router.put(
  '/:deptName/assign',
  requireRoles('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  handleAssignWorker
);

/**
 * DELETE /api/orders/:orderId/departments/:deptName/unassign
 *
 * Unassign the currently assigned worker from a department.
 * Sets status back to PENDING_ASSIGNMENT.
 *
 * Access: Factory Manager, Admin, Office Staff only
 */
router.delete(
  '/:deptName/unassign',
  requireRoles('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  handleUnassignWorker
);

/**
 * POST /api/orders/:orderId/departments/:deptName/photos
 *
 * Upload work-in-progress photos for a department.
 * Photos should be pre-uploaded to S3; this endpoint records the URLs.
 *
 * Access: All authenticated users
 *
 * Request Body:
 * {
 *   photos: string[] (required, array of URLs, max 10),
 *   notes?: string
 * }
 */
router.post('/:deptName/photos', handleUploadPhotos);

/**
 * GET /api/orders/:orderId/departments/:deptName/photos/upload-url
 *
 * Get a pre-signed URL for uploading photos to S3.
 * Client uploads directly to S3, then calls /photos endpoint.
 *
 * Query Parameters:
 * - filename: string (required) - The filename to upload
 *
 * Response:
 * {
 *   uploadUrl: string,
 *   publicUrl: string
 * }
 */
router.get('/:deptName/photos/upload-url', handleGetPhotoUploadUrl);

/**
 * PUT /api/orders/:orderId/departments/:deptName/hold
 *
 * Put a department on hold with a reason.
 *
 * Access: Factory Manager, Admin, Office Staff only
 *
 * Request Body:
 * {
 *   reason: string (required, max 500 chars)
 * }
 */
router.put(
  '/:deptName/hold',
  requireRoles('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  handlePutOnHold
);

/**
 * PUT /api/orders/:orderId/departments/:deptName/resume
 *
 * Resume a department from on-hold status.
 *
 * Access: Factory Manager, Admin, Office Staff only
 */
router.put(
  '/:deptName/resume',
  requireRoles('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  handleResumeDepartment
);

// ============================================
// EXPORT
// ============================================

export default router;

export { router as departmentsRouter };
