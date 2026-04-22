/**
 * ============================================
 * FEATURE TOGGLE CONTROLLER
 * ============================================
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  getAllFeatureModules,
  getFeatureModuleByName,
  createFeatureModule,
  updateFeaturePermission,
  getUserFeatures,
  getFeaturePermissions,
  deleteFeaturePermission,
} from './features.service';
import { logger } from '../../utils/logger';

/**
 * Get all feature modules (Admin only)
 */
export async function getAllFeaturesController(req: Request, res: Response) {
  try {
    const features = await getAllFeatureModules();
    res.json({ success: true, data: features });
  } catch (error) {
    logger.error('Get all features error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch features' },
    });
  }
}

/**
 * Get features accessible by current user
 */
export async function getMyFeaturesController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const features = await getUserFeatures(authReq.user.userId);
    res.json({ success: true, data: features });
  } catch (error) {
    logger.error('Get user features error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user features' },
    });
  }
}

/**
 * Create a new feature module (Admin only)
 */
export async function createFeatureController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const feature = await createFeatureModule(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: feature });
  } catch (error) {
    logger.error('Create feature error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create feature' },
    });
  }
}

/**
 * Update feature permission (Admin only)
 */
export async function updateFeaturePermissionController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const permission = await updateFeaturePermission(req.body, authReq.user.userId);
    res.json({ success: true, data: permission });
  } catch (error) {
    logger.error('Update feature permission error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update feature permission' },
    });
  }
}

/**
 * Get permissions for a feature (Admin only)
 */
export async function getFeaturePermissionsController(req: Request, res: Response) {
  try {
    const { featureId } = req.params;
    const permissions = await getFeaturePermissions(featureId);
    res.json({ success: true, data: permissions });
  } catch (error) {
    logger.error('Get feature permissions error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch feature permissions' },
    });
  }
}

/**
 * Delete a feature permission (Admin only)
 */
export async function deleteFeaturePermissionController(req: Request, res: Response) {
  try {
    const { permissionId } = req.params;
    await deleteFeaturePermission(permissionId);
    res.json({ success: true, message: 'Permission deleted successfully' });
  } catch (error) {
    logger.error('Delete feature permission error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete feature permission' },
    });
  }
}
