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
  updateMetalTransactionController,
  deleteMetalTransactionController,
  createMeltingBatchController,
  getAllMetalTransactionsController,
  getCurrentMetalRatesController,
  createMetalRateController,
  getMeltingBatchesController,
  settleMetalPaymentController,
  getMetalPaymentsController,
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

// Edit a metal transaction. Reverses the old row's stock effect and applies
// the new one inside a single $transaction. Refuses to edit billable PURCHASE
// rows that already have payments/credit activity (use the Settle flow).
router.patch(
  '/transactions/:id',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  updateMetalTransactionController
);

// Delete a metal transaction. Reverses stock + vendor credit, then deletes.
// Refuses if the row has any settlement-ledger entries.
router.delete(
  '/transactions/:id',
  authenticate,
  requireRoles(UserRole.ADMIN),
  deleteMetalTransactionController
);

// Settle a partial / pending payment against a billable PURCHASE row.
router.patch(
  '/transactions/:id/payment',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  settleMetalPaymentController
);

// List payment ledger entries for a transaction.
router.get(
  '/transactions/:id/payments',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getMetalPaymentsController
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
