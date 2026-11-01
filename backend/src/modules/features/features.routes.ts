import { Router } from 'express';
import { authenticate, requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import { getAllFeaturesController, getMyFeaturesController, createFeatureController, updateFeaturePermissionController, bulkUpdateFeaturePermissionsController, getFeaturePermissionsController, deleteFeaturePermissionController, getFeatureSubjectsController, getFeatureAuditController } from './features.controller';

const router = Router();
router.get('/my-features', authenticate, getMyFeaturesController);
// Management remains reachable to administrators regardless of module policy.
router.use(authenticate, requireRoles(UserRole.ADMIN));
router.get('/', getAllFeaturesController);
router.get('/subjects', getFeatureSubjectsController);
router.get('/audit', getFeatureAuditController);
router.post('/', createFeatureController);
router.post('/permissions/bulk', bulkUpdateFeaturePermissionsController);
router.post('/permissions', updateFeaturePermissionController);
router.get('/:featureId/permissions', getFeaturePermissionsController);
router.delete('/permissions/:permissionId', deleteFeaturePermissionController);
export default router;
