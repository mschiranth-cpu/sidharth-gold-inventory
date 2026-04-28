/**
 * ============================================
 * STONE INVENTORY ROUTES — Real Stone + Stone Packet
 * ============================================
 * Mirrors backend/src/modules/diamond-inventory/diamond.routes.ts.
 */

import { Router } from 'express';
import { authenticate, requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  // Real Stone
  getAllRealStonesController,
  getRealStoneByIdController,
  createRealStoneController,
  getRealStoneStockSummaryController,
  createRealStoneTransactionController,
  getAllRealStoneTransactionsController,
  updateRealStoneTransactionController,
  deleteRealStoneTransactionController,
  settleRealStonePaymentController,
  getRealStonePaymentsController,
  exportRealStoneTransactionsController,
  getCurrentRealStoneRatesController,
  createRealStoneRateController,
  // Stone Packet
  getAllStonePacketsController,
  getStonePacketByIdController,
  getLowStockStonePacketsController,
  createStonePacketController,
  getStonePacketStockSummaryController,
  createStonePacketTransactionController,
  getAllStonePacketTransactionsController,
  updateStonePacketTransactionController,
  deleteStonePacketTransactionController,
  settleStonePacketPaymentController,
  getStonePacketPaymentsController,
  exportStonePacketTransactionsController,
} from './stone.controller';

const router = Router();

// ============================================================================
// REAL STONE ROUTES
// (specific paths registered BEFORE legacy `/:stoneId`)
// ============================================================================

// Stock summary
router.get(
  '/real/stock/summary',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getRealStoneStockSummaryController
);

// Transactions — list / export / create / edit / delete
router.get(
  '/real/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllRealStoneTransactionsController
);
router.get(
  '/real/transactions/export',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  exportRealStoneTransactionsController
);
router.post(
  '/real/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createRealStoneTransactionController
);
router.patch(
  '/real/transactions/:id',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  updateRealStoneTransactionController
);
router.delete(
  '/real/transactions/:id',
  authenticate,
  requireRoles(UserRole.ADMIN),
  deleteRealStoneTransactionController
);

// Settlement ledger
router.patch(
  '/real/transactions/:id/payment',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  settleRealStonePaymentController
);
router.get(
  '/real/transactions/:id/payments',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getRealStonePaymentsController
);

// Rates
router.get('/real/rates', authenticate, getCurrentRealStoneRatesController);
router.post(
  '/real/rates',
  authenticate,
  requireRoles(UserRole.ADMIN),
  createRealStoneRateController
);

// Legacy real stone routes
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
router.get(
  '/real/:stoneId',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getRealStoneByIdController
);

// ============================================================================
// STONE PACKET ROUTES
// ============================================================================

router.get(
  '/packets/stock/summary',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getStonePacketStockSummaryController
);

router.get(
  '/packets/low-stock',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getLowStockStonePacketsController
);

router.get(
  '/packets/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllStonePacketTransactionsController
);
router.get(
  '/packets/transactions/export',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  exportStonePacketTransactionsController
);
router.post(
  '/packets/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createStonePacketTransactionController
);
router.patch(
  '/packets/transactions/:id',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  updateStonePacketTransactionController
);
router.delete(
  '/packets/transactions/:id',
  authenticate,
  requireRoles(UserRole.ADMIN),
  deleteStonePacketTransactionController
);

router.patch(
  '/packets/transactions/:id/payment',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  settleStonePacketPaymentController
);
router.get(
  '/packets/transactions/:id/payments',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getStonePacketPaymentsController
);

// Legacy stone packet routes
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
router.get(
  '/packets/:packetId',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getStonePacketByIdController
);

export default router;
