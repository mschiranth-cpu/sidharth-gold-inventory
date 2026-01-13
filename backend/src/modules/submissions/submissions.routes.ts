/**
 * ============================================
 * FINAL SUBMISSION ROUTES
 * ============================================
 * 
 * Route definitions for factory-to-office
 * order submissions.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { authenticate, requireRoles } from '../auth/auth.middleware';
import {
  handleCreateSubmission,
  handleGetSubmissions,
  handleGetSubmissionById,
  handleGetSubmissionByOrder,
  handleUpdateApproval,
  handleGetStats,
} from './submissions.controller';

const router = Router();

// ============================================
// MIDDLEWARE
// ============================================

// All routes require authentication
router.use(authenticate);

// ============================================
// SUBMISSIONS LIST & STATS
// ============================================

/**
 * GET /api/submissions/stats
 * 
 * Get submission statistics.
 * Admin and Office Staff only.
 * 
 * Note: Must be defined BEFORE /:id
 */
router.get(
  '/stats',
  requireRoles('ADMIN', 'OFFICE_STAFF'),
  handleGetStats
);

/**
 * GET /api/submissions
 * 
 * List all submissions with pagination and filtering.
 * All authenticated users can access.
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sortBy: submittedAt | orderNumber | finalGoldWeight | qualityGrade
 * - sortOrder: asc | desc
 * - submittedFrom: ISO date string
 * - submittedTo: ISO date string
 * - submittedById: UUID
 * - qualityGrade: A | A+ | B | B+ | C | D
 * - hasHighVariance: boolean
 * - customerApproved: boolean
 * - search: string (searches order number, customer name)
 */
router.get('/', handleGetSubmissions);

/**
 * GET /api/submissions/:id
 * 
 * Get a single submission by ID.
 * All authenticated users can access.
 */
router.get('/:id', handleGetSubmissionById);

/**
 * PUT /api/submissions/:id/approval
 * 
 * Update customer approval status.
 * Admin and Office Staff only.
 * 
 * Request Body:
 * {
 *   approved: boolean (required),
 *   notes?: string (max 1000 chars)
 * }
 */
router.put(
  '/:id/approval',
  requireRoles('ADMIN', 'OFFICE_STAFF'),
  handleUpdateApproval
);

// ============================================
// EXPORT
// ============================================

export default router;

export { router as submissionsRouter };

// ============================================
// ORDER-NESTED ROUTES
// ============================================

/**
 * These routes are mounted under /api/orders/:orderId
 * They need a separate router with mergeParams
 */
const orderSubmissionRouter = Router({ mergeParams: true });

orderSubmissionRouter.use(authenticate);

/**
 * POST /api/orders/:orderId/submit
 * 
 * Factory submits completed order.
 * Factory Manager and Admin only.
 * Validates all departments are complete.
 * 
 * Request Body:
 * {
 *   finalGoldWeight: number (required),
 *   finalStoneWeight: number (required),
 *   finalPurity: number (1-24, required),
 *   numberOfPieces?: number (default: 1),
 *   totalWeight?: number,
 *   qualityGrade?: 'A' | 'A+' | 'B' | 'B+' | 'C' | 'D',
 *   qualityNotes?: string,
 *   completionPhotos: string[] (required, min 1, max 20),
 *   certificateUrl?: string,
 *   acknowledgeVariance?: boolean (required if variance > 5%)
 * }
 */
orderSubmissionRouter.post(
  '/submit',
  requireRoles('ADMIN', 'FACTORY_MANAGER'),
  handleCreateSubmission
);

/**
 * GET /api/orders/:orderId/submission
 * 
 * Get the submission for a specific order.
 * All authenticated users can access.
 */
orderSubmissionRouter.get(
  '/submission',
  handleGetSubmissionByOrder
);

export { orderSubmissionRouter };
