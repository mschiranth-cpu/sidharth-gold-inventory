/**
 * ============================================
 * ACTIVITY ROUTES
 * ============================================
 *
 * Routes for activity log endpoints
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getOrderActivities, getActivitySummary } from './activity.controller';

const router = Router();

/**
 * GET /api/activities/orders/:orderId
 * Get all activities for an order
 */
router.get('/orders/:orderId', authenticate, getOrderActivities);

/**
 * GET /api/activities/orders/:orderId/summary
 * Get activity summary (counts) for an order
 */
router.get('/orders/:orderId/summary', authenticate, getActivitySummary);

export default router;
