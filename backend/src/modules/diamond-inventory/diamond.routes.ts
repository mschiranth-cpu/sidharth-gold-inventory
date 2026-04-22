/**
 * ============================================
 * DIAMOND INVENTORY ROUTES
 * ============================================
 */

import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  getAllDiamondsController,
  getDiamondByIdController,
  createDiamondController,
  issueDiamondController,
  getAllDiamondLotsController,
  createDiamondLotController,
} from './diamond.controller';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllDiamondsController
);
router.get(
  '/:diamondId',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getDiamondByIdController
);
router.post(
  '/',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createDiamondController
);
router.post(
  '/issue',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  issueDiamondController
);
router.get(
  '/lots/all',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllDiamondLotsController
);
router.post(
  '/lots',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createDiamondLotController
);

export default router;
