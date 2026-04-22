/**
 * ============================================
 * PAYROLL ROUTES
 * ============================================
 */

import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  createSalaryStructureController,
  getSalaryStructureController,
  createPayrollPeriodController,
  processPayrollController,
  getPayrollPeriodsController,
  getPayslipController,
  getMyPayslipsController,
  createEmployeeAdvanceController,
  createEmployeeLoanController,
} from './payroll.controller';

const router = Router();

router.post(
  '/salary-structure/:userId',
  authenticate,
  requireRoles(UserRole.ADMIN),
  createSalaryStructureController
);
router.get(
  '/salary-structure/:userId',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  getSalaryStructureController
);
router.post('/periods', authenticate, requireRoles(UserRole.ADMIN), createPayrollPeriodController);
router.post(
  '/periods/:periodId/process',
  authenticate,
  requireRoles(UserRole.ADMIN),
  processPayrollController
);
router.get(
  '/periods',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  getPayrollPeriodsController
);
router.get('/payslips/:payslipId', authenticate, getPayslipController);
router.get('/my-payslips', authenticate, getMyPayslipsController);
router.post(
  '/advances/:userId',
  authenticate,
  requireRoles(UserRole.ADMIN),
  createEmployeeAdvanceController
);
router.post(
  '/loans/:userId',
  authenticate,
  requireRoles(UserRole.ADMIN),
  createEmployeeLoanController
);

export default router;
