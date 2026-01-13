/**
 * ============================================
 * FACTORY ROUTES
 * ============================================
 *
 * API routes for factory statistics and gold tracking.
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

import { Router } from 'express';
import { factoryController } from './factory.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Factory stats endpoint
router.get('/stats', factoryController.getStats);

// Gold inventory routes (orders in factory)
router.get('/inventory', factoryController.getGoldInventory);
router.get('/inventory/:id', factoryController.getGoldItemById);

// Gold movements (department tracking history)
router.get('/movements', factoryController.getGoldMovements);

// Departments list
router.get('/departments', factoryController.getDepartments);

export default router;
