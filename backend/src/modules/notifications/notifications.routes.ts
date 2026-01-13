import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as notificationController from './notifications.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 * Query params: isRead, type, priority, limit, offset
 */
router.get('/', notificationController.getNotifications as any);

/**
 * GET /api/notifications/unread-count
 * Get unread notifications count
 */
router.get('/unread-count', notificationController.getUnreadCount as any);

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/:id/read', notificationController.markAsRead as any);

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
router.post('/mark-all-read', notificationController.markAllAsRead as any);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', notificationController.deleteNotification as any);

export default router;
