import { requireFeature } from '../features/features.middleware';
/**
 * ============================================
 * CLIENT PORTAL ROUTES
 * ============================================
 */

import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  createClientController,
  selfRegisterController,
  getAllClientsController,
  getMyProfileController,
  getClientByIdController,
  updateClientController,
  approveClientController,
  createClientOrderController,
  getClientOrdersController,
  getOrdersPendingApprovalController,
  approveClientOrderController,
  addOrderCommentController,
  getOrderCommentsController,
  markCommentAsReadController,
} from './clients.controller';

const router = Router();

// Public routes
router.post('/register', requireFeature('CLIENT_PORTAL', { publicRole: UserRole.CLIENT }), selfRegisterController);

const clientPortalPolicy = requireFeature('CLIENT_PORTAL');
// Profile and account recovery stay available when portal operations are disabled.
router.use(authenticate, (req, res, next) => {
  const profileRead = req.method === 'GET' && /^\/profile\/?$/i.test(req.path);
  const profileUpdate = req.method === 'PUT' && /^\/profile\/[^/]+\/?$/i.test(req.path);
  if (profileRead || profileUpdate) return next();
  return clientPortalPolicy(req, res, next);
});

// Client routes (authenticated clients)
router.get('/profile', authenticate, requireRoles(UserRole.CLIENT), getMyProfileController);
router.put(
  '/profile/:clientId',
  authenticate,
  requireRoles(UserRole.CLIENT),
  updateClientController
);
router.post('/orders', authenticate, requireRoles(UserRole.CLIENT), createClientOrderController);
router.get('/orders', authenticate, requireRoles(UserRole.CLIENT), getClientOrdersController);

// Comment routes (clients and staff)
router.post('/comments', authenticate, addOrderCommentController);
router.get('/orders/:orderId/comments', authenticate, getOrderCommentsController);
router.put('/comments/:commentId/read', authenticate, markCommentAsReadController);

// Admin/Office Staff routes
router.post(
  '/',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createClientController
);
router.get(
  '/',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  getAllClientsController
);
router.get(
  '/:clientId',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  getClientByIdController
);
router.post(
  '/approve',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  approveClientController
);

// Order approval routes (Office Staff/Admin)
router.get(
  '/orders/pending-approval',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  getOrdersPendingApprovalController
);
router.post(
  '/orders/:orderId/approve',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  approveClientOrderController
);

export default router;
