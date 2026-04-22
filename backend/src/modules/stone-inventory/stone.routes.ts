/**
 * ============================================
 * STONE INVENTORY ROUTES
 * ============================================
 */

import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  getAllRealStonesController,
  createRealStoneController,
  getAllStonePacketsController,
  createStonePacketController,
  createStonePacketTransactionController,
} from './stone.controller';

const router = Router();

// Real stones routes
router.get(
  '/real',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllRealStonesController
);
router.post(
  '/real',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createRealStoneController
);

// Stone packets routes
router.get(
  '/packets',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllStonePacketsController
);
router.post(
  '/packets',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createStonePacketController
);
router.post(
  '/packets/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createStonePacketTransactionController
);

export default router;
