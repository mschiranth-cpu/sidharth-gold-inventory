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
  // Parity-with-metal controllers
  getDiamondStockSummaryController,
  createDiamondTransactionController,
  getAllDiamondTransactionsController,
  updateDiamondTransactionController,
  deleteDiamondTransactionController,
  settleDiamondPaymentController,
  getDiamondPaymentsController,
  exportDiamondTransactionsController,
  getCurrentDiamondRatesController,
  createDiamondRateController,
} from './diamond.controller';

const router = Router();

// ============================================================================
// PARITY-WITH-METAL ROUTES (registered BEFORE legacy `/:diamondId` so Express
// doesn't treat the literal segments below as a diamondId param).
// ============================================================================

// Stock summary (groupBy aggregation — no separate stock table)
router.get(
  '/stock/summary',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getDiamondStockSummaryController
);

// Transactions — list / export / create / edit / delete
router.get(
  '/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllDiamondTransactionsController
);
router.get(
  '/transactions/export',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  exportDiamondTransactionsController
);
router.post(
  '/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createDiamondTransactionController
);
router.patch(
  '/transactions/:id',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  updateDiamondTransactionController
);
router.delete(
  '/transactions/:id',
  authenticate,
  requireRoles(UserRole.ADMIN),
  deleteDiamondTransactionController
);

// Settlement ledger
router.patch(
  '/transactions/:id/payment',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  settleDiamondPaymentController
);
router.get(
  '/transactions/:id/payments',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getDiamondPaymentsController
);

// Rates
router.get('/rates', authenticate, getCurrentDiamondRatesController);
router.post(
  '/rates',
  authenticate,
  requireRoles(UserRole.ADMIN),
  createDiamondRateController
);

// ============================================================================
// LEGACY DIAMOND ROUTES (preserved for back-compat)
// ============================================================================

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
