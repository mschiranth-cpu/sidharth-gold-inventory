/**
 * ============================================
 * WORKERS ROUTES
 * ============================================
 *
 * Routes for department worker-specific operations
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import express from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as workersController from './workers.controller';
import { upload } from '../../middleware/fileUpload';

const router = express.Router();

// All routes require authentication
// Workers, Admins, and Factory Managers can access worker operations
router.use(authenticate);
router.use(authorize('DEPARTMENT_WORKER', 'ADMIN', 'FACTORY_MANAGER'));

/**
 * GET /api/workers/pending-assignments-count
 * Get count of pending assignments for the logged-in worker
 */
router.get('/pending-assignments-count', workersController.getPendingAssignmentsCount);

/**
 * GET /api/workers/work/:orderId
 * Get work data for a specific order
 */
router.get('/work/:orderId', workersController.getWorkData);

/**
 * POST /api/workers/work/:orderId/start
 * Start work on an order (update status to IN_PROGRESS)
 */
router.post('/work/:orderId/start', workersController.startWork);

/**
 * POST /api/workers/work/:orderId/save
 * Save work progress (draft)
 */
router.post('/work/:orderId/save', workersController.saveWorkProgress);

/**
 * POST /api/workers/work/:orderId/complete
 * Complete and submit work
 */
router.post('/work/:orderId/complete', workersController.completeWork);

/**
 * POST /api/workers/work/:orderId/upload-file
 * Upload a work file (CAD files, etc.)
 */
router.post('/work/:orderId/upload-file', upload.single('file'), workersController.uploadFile);

/**
 * POST /api/workers/work/:orderId/upload-photos
 * Upload work photos
 */
router.post(
  '/work/:orderId/upload-photos',
  upload.array('photos', 10),
  workersController.uploadPhotos
);

/**
 * DELETE /api/workers/work/:orderId/files/:fileId
 * Delete an uploaded file
 */
router.delete('/work/:orderId/files/:fileId', workersController.deleteFile);

/**
 * DELETE /api/workers/work/:orderId/photos/:photoId
 * Delete an uploaded photo
 */
router.delete('/work/:orderId/photos/:photoId', workersController.deletePhoto);

export default router;
