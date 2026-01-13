/**
 * ============================================
 * FINAL SUBMISSION CONTROLLER
 * ============================================
 * 
 * Express controllers for factory-to-office
 * order submission endpoints.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../utils/logger';
import {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getSubmissionByOrderId,
  updateCustomerApproval,
  getSubmissionStats,
} from './submissions.service';
import {
  SubmissionError,
  SubmissionErrorCode,
  createSubmissionSchema,
  submissionQuerySchema,
  customerApprovalSchema,
  CreateSubmissionRequest,
  SubmissionQueryParams,
  canSubmitOrder,
} from './submissions.types';
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
  error: SubmissionError | ZodError | Error,
  statusCode = 500
): void {
  if (error instanceof SubmissionError) {
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
        details: error.errors.map((e: { path: (string | number)[]; message: string }) => ({
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

// ============================================
// CREATE SUBMISSION
// ============================================

/**
 * POST /api/orders/:orderId/submit
 * 
 * Factory submits a completed order.
 * Validates all departments are complete.
 * Calculates weight variance.
 * Sends notifications to office staff.
 * 
 * Request Body:
 * {
 *   finalGoldWeight: number (required),
 *   finalStoneWeight: number (required),
 *   finalPurity: number (required),
 *   numberOfPieces?: number,
 *   totalWeight?: number,
 *   qualityGrade?: string,
 *   qualityNotes?: string,
 *   completionPhotos: string[] (required, min 1),
 *   certificateUrl?: string,
 *   acknowledgeVariance?: boolean (required if variance > 5%)
 * }
 */
export async function handleCreateSubmission(
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

    // Check if user can submit orders
    if (!canSubmitOrder(authReq.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: SubmissionErrorCode.UNAUTHORIZED,
          message: 'Only Factory Managers and Admins can submit orders',
          statusCode: 403,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate request body
    const validatedData = createSubmissionSchema.parse(req.body) as CreateSubmissionRequest;

    const submission = await createSubmission(
      orderId,
      validatedData,
      authReq.user.userId
    );

    sendSuccess(res, submission, 'Order submitted successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    if (error instanceof SubmissionError) {
      sendError(res, error);
      return;
    }
    logger.error('Create submission error', { error });
    next(error);
  }
}

// ============================================
// LIST SUBMISSIONS
// ============================================

/**
 * GET /api/submissions
 * 
 * Lists all submissions with pagination and filtering.
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sortBy: submittedAt | orderNumber | finalGoldWeight | qualityGrade
 * - sortOrder: asc | desc
 * - submittedFrom: ISO date
 * - submittedTo: ISO date
 * - submittedById: UUID
 * - qualityGrade: A | A+ | B | B+ | C | D
 * - hasHighVariance: boolean
 * - customerApproved: boolean
 * - search: string (searches order number, customer name)
 */
export async function handleGetSubmissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;

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

    // Validate query parameters
    const validatedQuery = submissionQuerySchema.parse(req.query) as SubmissionQueryParams;

    const result = await getSubmissions(validatedQuery, authReq.user.role);

    res.status(200).json({
      success: true,
      message: 'Submissions retrieved successfully',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    logger.error('Get submissions error', { error });
    next(error);
  }
}

// ============================================
// GET SUBMISSION BY ID
// ============================================

/**
 * GET /api/submissions/:id
 * 
 * Gets a single submission by ID.
 */
export async function handleGetSubmissionById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

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

    const submission = await getSubmissionById(id, authReq.user.role);

    if (!submission) {
      res.status(404).json({
        success: false,
        error: {
          code: SubmissionErrorCode.SUBMISSION_NOT_FOUND,
          message: `Submission with ID ${id} not found`,
          statusCode: 404,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    sendSuccess(res, submission, 'Submission retrieved successfully');
  } catch (error) {
    logger.error('Get submission by ID error', { error });
    next(error);
  }
}

// ============================================
// GET SUBMISSION BY ORDER ID
// ============================================

/**
 * GET /api/orders/:orderId/submission
 * 
 * Gets the submission for a specific order.
 */
export async function handleGetSubmissionByOrder(
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

    const submission = await getSubmissionByOrderId(orderId, authReq.user.role);

    if (!submission) {
      res.status(404).json({
        success: false,
        error: {
          code: SubmissionErrorCode.SUBMISSION_NOT_FOUND,
          message: `No submission found for order ${orderId}`,
          statusCode: 404,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    sendSuccess(res, submission, 'Submission retrieved successfully');
  } catch (error) {
    logger.error('Get submission by order error', { error });
    next(error);
  }
}

// ============================================
// UPDATE CUSTOMER APPROVAL
// ============================================

/**
 * PUT /api/submissions/:id/approval
 * 
 * Updates the customer approval status.
 * Admin and Office Staff only.
 * 
 * Request Body:
 * {
 *   approved: boolean (required),
 *   notes?: string
 * }
 */
export async function handleUpdateApproval(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

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

    // Validate request body
    const validatedData = customerApprovalSchema.parse(req.body);

    const submission = await updateCustomerApproval(
      id,
      validatedData as any,
      authReq.user.userId
    );

    sendSuccess(
      res, 
      submission, 
      `Customer approval ${validatedData.approved ? 'confirmed' : 'revoked'} successfully`
    );
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    if (error instanceof SubmissionError) {
      sendError(res, error);
      return;
    }
    logger.error('Update approval error', { error });
    next(error);
  }
}

// ============================================
// GET STATISTICS
// ============================================

/**
 * GET /api/submissions/stats
 * 
 * Gets submission statistics.
 * Admin and Office Staff only.
 */
export async function handleGetStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;

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

    const stats = await getSubmissionStats();

    sendSuccess(res, stats, 'Submission statistics retrieved successfully');
  } catch (error) {
    logger.error('Get stats error', { error });
    next(error);
  }
}
