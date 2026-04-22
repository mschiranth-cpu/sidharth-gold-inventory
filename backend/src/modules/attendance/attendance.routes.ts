/**
 * ============================================
 * ATTENDANCE ROUTES
 * ============================================
 */

import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  checkInController,
  checkOutController,
  getMyAttendanceController,
  getAllAttendanceController,
  applyLeaveController,
  approveLeaveController,
  getLeavesController,
  createShiftController,
  getAllShiftsController,
} from './attendance.controller';

const router = Router();

router.post('/check-in', authenticate, checkInController);
router.post('/check-out', authenticate, checkOutController);
router.get('/my-attendance', authenticate, getMyAttendanceController);
router.get(
  '/all',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  getAllAttendanceController
);
router.post('/leaves', authenticate, applyLeaveController);
router.put(
  '/leaves/:leaveId/approve',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.FACTORY_MANAGER),
  approveLeaveController
);
router.get('/leaves', authenticate, getLeavesController);
router.post('/shifts', authenticate, requireRoles(UserRole.ADMIN), createShiftController);
router.get('/shifts', authenticate, getAllShiftsController);

export default router;
