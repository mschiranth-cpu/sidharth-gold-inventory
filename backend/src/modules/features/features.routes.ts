/**
 * ============================================
 * FEATURE TOGGLE ROUTES
 * ============================================
 */

import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  getAllFeaturesController,
  getMyFeaturesController,
  createFeatureController,
  updateFeaturePermissionController,
  getFeaturePermissionsController,
  deleteFeaturePermissionController,
} from './features.controller';

const router = Router();

// Get current user's features (all authenticated users)
router.get('/my-features', authenticate, getMyFeaturesController);

// Admin-only routes
router.get('/', authenticate, requireRoles(UserRole.ADMIN), getAllFeaturesController);
router.post('/', authenticate, requireRoles(UserRole.ADMIN), createFeatureController);
router.post(
  '/permissions',
  authenticate,
  requireRoles(UserRole.ADMIN),
  updateFeaturePermissionController
);
router.get(
  '/:featureId/permissions',
  authenticate,
  requireRoles(UserRole.ADMIN),
  getFeaturePermissionsController
);
router.delete(
  '/permissions/:permissionId',
  authenticate,
  requireRoles(UserRole.ADMIN),
  deleteFeaturePermissionController
);

export default router;
