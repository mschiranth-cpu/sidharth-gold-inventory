/**
 * ============================================
 * PARTY METAL INVENTORY ROUTES
 * ============================================
 */

import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  getAllPartiesController,
  getPartyByIdController,
  createPartyController,
  updatePartyController,
  createPartyMetalTransactionController,
  getPartyMetalTransactionsController,
  getPartyMetalAccountsController,
} from './party.controller';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getAllPartiesController
);
router.get(
  '/:partyId',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getPartyByIdController
);
router.post(
  '/',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createPartyController
);
router.put(
  '/:partyId',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  updatePartyController
);
router.post(
  '/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  createPartyMetalTransactionController
);
router.get(
  '/:partyId/transactions',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getPartyMetalTransactionsController
);
router.get(
  '/:partyId/accounts',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  getPartyMetalAccountsController
);

export default router;
