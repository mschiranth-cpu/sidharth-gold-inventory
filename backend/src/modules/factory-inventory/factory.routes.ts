/**
 * ============================================
 * FACTORY INVENTORY ROUTES
 * ============================================
 */

import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  getAllCategoriesController,
  createCategoryController,
  getAllFactoryItemsController,
  getFactoryItemByIdController,
  createFactoryItemController,
  updateFactoryItemController,
  createFactoryItemTransactionController,
  createEquipmentMaintenanceController,
  getEquipmentMaintenanceController,
} from './factory.controller';

const router = Router();

router.get(
  '/categories',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllCategoriesController
);
router.post(
  '/categories',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  createCategoryController
);
router.get(
  '/items',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllFactoryItemsController
);
router.get(
  '/items/:itemId',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getFactoryItemByIdController
);
router.post(
  '/items',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  createFactoryItemController
);
router.put(
  '/items/:itemId',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  updateFactoryItemController
);
router.post(
  '/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  createFactoryItemTransactionController
);
router.get(
  '/maintenance',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  getEquipmentMaintenanceController
);
router.post(
  '/maintenance',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  createEquipmentMaintenanceController
);

export default router;
