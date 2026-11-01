import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import { FeatureRequestError, getAllFeatureModules, createFeatureModule, updateFeaturePermission, bulkUpdateFeaturePermissions, getUserFeatures, getFeaturePermissions, deleteFeaturePermission, getFeatureSubjects, getFeatureAudit, parseFeatureScope } from './features.service';
import { logger } from '../../utils/logger';

async function respond(res: Response, operation: () => Promise<unknown>, status = 200) {
  try { res.status(status).json({ success: true, data: await operation() }); }
  catch (error) {
    if (error instanceof FeatureRequestError) {
      res.status(error.status).json({ success: false, error: { code: 'INVALID_FEATURE_REQUEST', message: error.message } });
    } else if (error && typeof error === 'object' && 'code' in error && ['P2002', 'P2034'].includes(String(error.code))) {
      res.status(409).json({ success: false, error: { code: 'FEATURE_CONFLICT', message: 'Feature settings changed concurrently. Reload and try again.' } });
    } else {
      logger.error('Feature operation failed', { error });
      res.status(500).json({ success: false, error: { code: 'FEATURE_OPERATION_FAILED', message: 'Unable to complete the feature operation. Please try again.' } });
    }
  }
}

export async function getAllFeaturesController(req: Request, res: Response) {
  return respond(res, () => getAllFeatureModules(parseFeatureScope(req.query.scope, req.query.target)));
}
export async function getMyFeaturesController(req: Request, res: Response) {
  return respond(res, () => getUserFeatures((req as AuthenticatedRequest).user.userId));
}
export async function createFeatureController(req: Request, res: Response) {
  return respond(res, () => createFeatureModule(req.body, (req as AuthenticatedRequest).user.userId), 201);
}
export async function updateFeaturePermissionController(req: Request, res: Response) {
  return respond(res, () => updateFeaturePermission(req.body, (req as AuthenticatedRequest).user.userId));
}
export async function bulkUpdateFeaturePermissionsController(req: Request, res: Response) {
  return respond(res, () => bulkUpdateFeaturePermissions(req.body, (req as AuthenticatedRequest).user.userId));
}
export async function getFeaturePermissionsController(req: Request, res: Response) {
  return respond(res, () => getFeaturePermissions(req.params.featureId));
}
export async function deleteFeaturePermissionController(req: Request, res: Response) {
  return respond(res, () => deleteFeaturePermission(req.params.permissionId, (req as AuthenticatedRequest).user.userId));
}
export async function getFeatureSubjectsController(_req: Request, res: Response) {
  return respond(res, getFeatureSubjects);
}
export async function getFeatureAuditController(req: Request, res: Response) {
  return respond(res, () => getFeatureAudit({ limit: req.query.limit, cursor: req.query.cursor }));
}
