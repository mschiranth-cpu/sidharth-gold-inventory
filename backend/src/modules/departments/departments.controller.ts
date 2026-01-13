/**
 * ============================================
 * DEPARTMENT TRACKING CONTROLLER
 * ============================================
 *
 * Express controllers for department tracking endpoints.
 * Handles HTTP requests for department progress management.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DepartmentName } from '@prisma/client';
import { logger } from '../../utils/logger';
import {
  getOrderDepartments,
  getDepartmentTracking,
  startDepartment,
  completeDepartment,
  assignWorker,
  unassignWorker,
  uploadDepartmentPhotos,
  putDepartmentOnHold,
  resumeDepartment,
  getPhotoUploadUrl,
} from './departments.service';
import {
  DepartmentError,
  departmentNameSchema,
  startDepartmentSchema,
  completeDepartmentSchema,
  assignWorkerSchema,
  uploadPhotosSchema,
  putOnHoldSchema,
  StartDepartmentRequest,
  CompleteDepartmentRequest,
  AssignWorkerRequest,
  UploadPhotosRequest,
} from './departments.types';
import { AuthenticatedRequest } from '../auth/auth.types';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sends a success response with consistent format
 */
function sendSuccess<T>(res: Response, data: T, message: string, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Sends an error response with consistent format
 */
function sendError(
  res: Response,
  error: DepartmentError | ZodError | Error,
  statusCode = 500
): void {
  if (error instanceof DepartmentError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        statusCode: 400,
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Validates and parses department name from URL params
 */
function parseDepartmentName(deptName: string): DepartmentName {
  // Convert to uppercase and parse
  const normalized = deptName.toUpperCase().replace(/-/g, '_');
  const result = departmentNameSchema.safeParse(normalized);

  if (!result.success) {
    throw new DepartmentError(
      'INVALID_DEPARTMENT' as any,
      `Invalid department name: ${deptName}. Valid departments are: CAD, PRINT, CASTING, FILLING, MEENA, POLISH_1, SETTING, POLISH_2, ADDITIONAL`,
      400
    );
  }

  return result.data;
}

// ============================================
// GET ALL DEPARTMENT STATUSES
// ============================================

/**
 * GET /api/orders/:orderId/departments
 *
 * Gets all department statuses for an order.
 * Returns summary with completion percentage.
 */
export async function handleGetOrderDepartments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await getOrderDepartments(orderId);

    sendSuccess(res, result, 'Department statuses retrieved successfully');
  } catch (error) {
    if (error instanceof DepartmentError) {
      sendError(res, error);
      return;
    }
    logger.error('Get order departments error', { error });
    next(error);
  }
}

/**
 * GET /api/orders/:orderId/departments/:deptName
 *
 * Gets a single department's tracking details.
 */
export async function handleGetDepartmentTracking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId, deptName } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const departmentName = parseDepartmentName(deptName!);
    const result = await getDepartmentTracking(orderId, departmentName);

    sendSuccess(res, result, 'Department tracking retrieved successfully');
  } catch (error) {
    if (error instanceof DepartmentError) {
      sendError(res, error);
      return;
    }
    logger.error('Get department tracking error', { error });
    next(error);
  }
}

// ============================================
// START DEPARTMENT
// ============================================

/**
 * PUT /api/orders/:orderId/departments/:deptName/start
 *
 * Marks a department as started.
 * Auto-captures start timestamp.
 * Validates that previous departments are completed.
 */
export async function handleStartDepartment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId, deptName } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const departmentName = parseDepartmentName(deptName!);
    const validatedData = startDepartmentSchema.parse(req.body) as StartDepartmentRequest;

    const result = await startDepartment(
      orderId,
      departmentName,
      validatedData,
      authReq.user.userId
    );

    sendSuccess(res, result, `${departmentName} started successfully`);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    if (error instanceof DepartmentError) {
      sendError(res, error);
      return;
    }
    logger.error('Start department error', { error });
    next(error);
  }
}

// ============================================
// COMPLETE DEPARTMENT
// ============================================

/**
 * PUT /api/orders/:orderId/departments/:deptName/complete
 *
 * Marks a department as completed.
 * Auto-captures end timestamp and calculates duration.
 * Calculates gold loss if weights provided.
 */
export async function handleCompleteDepartment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId, deptName } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const departmentName = parseDepartmentName(deptName!);
    const validatedData = completeDepartmentSchema.parse(req.body) as CompleteDepartmentRequest;

    const result = await completeDepartment(
      orderId,
      departmentName,
      validatedData,
      authReq.user.userId
    );

    sendSuccess(res, result, `${departmentName} completed successfully`);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    if (error instanceof DepartmentError) {
      sendError(res, error);
      return;
    }
    logger.error('Complete department error', { error });
    next(error);
  }
}

// ============================================
// ASSIGN WORKER
// ============================================

/**
 * PUT /api/orders/:orderId/departments/:deptName/assign
 *
 * Assigns a worker to a department.
 * Can be done before or after department starts.
 */
export async function handleAssignWorker(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId, deptName } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const departmentName = parseDepartmentName(deptName!);
    const validatedData = assignWorkerSchema.parse(req.body) as AssignWorkerRequest;

    const result = await assignWorker(orderId, departmentName, validatedData, authReq.user.userId);

    sendSuccess(res, result, 'Worker assigned successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    if (error instanceof DepartmentError) {
      sendError(res, error);
      return;
    }
    logger.error('Assign worker error', { error });
    next(error);
  }
}

// ============================================
// UNASSIGN WORKER
// ============================================

/**
 * DELETE /api/orders/:orderId/departments/:deptName/unassign
 *
 * Unassigns the currently assigned worker from a department.
 * Sets status back to PENDING_ASSIGNMENT.
 */
export async function handleUnassignWorker(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId, deptName } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const departmentName = parseDepartmentName(deptName!);

    const result = await unassignWorker(orderId, departmentName, authReq.user.userId);

    sendSuccess(res, result, 'Worker unassigned successfully');
  } catch (error) {
    if (error instanceof DepartmentError) {
      sendError(res, error);
      return;
    }
    logger.error('Unassign worker error', { error });
    next(error);
  }
}

// ============================================
// UPLOAD PHOTOS
// ============================================

/**
 * POST /api/orders/:orderId/departments/:deptName/photos
 *
 * Uploads work-in-progress photos for a department.
 * Accepts an array of photo URLs (pre-uploaded to S3).
 */
export async function handleUploadPhotos(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId, deptName } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const departmentName = parseDepartmentName(deptName!);
    const validatedData = uploadPhotosSchema.parse(req.body) as UploadPhotosRequest;

    const result = await uploadDepartmentPhotos(
      orderId,
      departmentName,
      validatedData,
      authReq.user.userId
    );

    sendSuccess(res, result, `${validatedData.photos.length} photo(s) uploaded successfully`);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    if (error instanceof DepartmentError) {
      sendError(res, error);
      return;
    }
    logger.error('Upload photos error', { error });
    next(error);
  }
}

/**
 * GET /api/orders/:orderId/departments/:deptName/photos/upload-url
 *
 * Gets a pre-signed URL for uploading photos to S3.
 * Client uploads directly to S3, then calls /photos endpoint.
 */
export async function handleGetPhotoUploadUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId, deptName } = req.params;
    const { filename } = req.query;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!filename || typeof filename !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'filename query parameter is required',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const departmentName = parseDepartmentName(deptName!);
    const result = await getPhotoUploadUrl(orderId, departmentName, filename);

    sendSuccess(res, result, 'Upload URL generated successfully');
  } catch (error) {
    if (error instanceof DepartmentError) {
      sendError(res, error);
      return;
    }
    logger.error('Get photo upload URL error', { error });
    next(error);
  }
}

// ============================================
// PUT ON HOLD / RESUME
// ============================================

/**
 * PUT /api/orders/:orderId/departments/:deptName/hold
 *
 * Puts a department on hold with a reason.
 */
export async function handlePutOnHold(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId, deptName } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const departmentName = parseDepartmentName(deptName!);
    const validatedData = putOnHoldSchema.parse(req.body);

    const result = await putDepartmentOnHold(
      orderId,
      departmentName,
      validatedData.reason,
      authReq.user.userId
    );

    sendSuccess(res, result, `${departmentName} put on hold`);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    if (error instanceof DepartmentError) {
      sendError(res, error);
      return;
    }
    logger.error('Put on hold error', { error });
    next(error);
  }
}

/**
 * PUT /api/orders/:orderId/departments/:deptName/resume
 *
 * Resumes a department from on-hold status.
 */
export async function handleResumeDepartment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId, deptName } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const departmentName = parseDepartmentName(deptName!);

    const result = await resumeDepartment(orderId, departmentName, authReq.user.userId);

    sendSuccess(res, result, `${departmentName} resumed`);
  } catch (error) {
    if (error instanceof DepartmentError) {
      sendError(res, error);
      return;
    }
    logger.error('Resume department error', { error });
    next(error);
  }
}
