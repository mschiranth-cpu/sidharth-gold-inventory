/**
 * ============================================
 * METAL INVENTORY ROUTES
 * ============================================
 */

import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  getAllMetalStockController,
  getMetalStockSummaryController,
  createMetalStockController,
  createMetalTransactionController,
  createMeltingBatchController,
  getAllMetalTransactionsController,
  getCurrentMetalRatesController,
  createMetalRateController,
  getMeltingBatchesController,
} from './metal.controller';

const router = Router();

// Stock routes
router.get(
  '/stock',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllMetalStockController
);
router.get(
  '/stock/summary',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getMetalStockSummaryController
);
router.post(
  '/stock',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createMetalStockController
);

// Transaction routes
router.get(
  '/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllMetalTransactionsController
);
router.post(
  '/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createMetalTransactionController
);

// Melting batch routes
router.get(
  '/melting-batches',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  getMeltingBatchesController
);
router.post(
  '/melting-batches',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  createMeltingBatchController
);

// Rate routes
router.get('/rates', authenticate, getCurrentMetalRatesController);
router.post('/rates', authenticate, requireRoles(UserRole.ADMIN), createMetalRateController);

export default router;
