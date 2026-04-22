/**
 * ============================================
 * ATTENDANCE CONTROLLER
 * ============================================
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  checkIn,
  checkOut,
  getAttendance,
  getAllAttendance,
  applyLeave,
  approveLeave,
  getLeaves,
  createShift,
  getAllShifts,
} from './attendance.service';
import { logger } from '../../utils/logger';

export async function checkInController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const attendance = await checkIn(authReq.user.userId, req.body);
    res.status(201).json({ success: true, data: attendance });
  } catch (error: any) {
    logger.error('Check-in error', { error });
    res
      .status(400)
      .json({ success: false, error: { message: error.message || 'Check-in failed' } });
  }
}

export async function checkOutController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const attendance = await checkOut(authReq.user.userId, req.body);
    res.json({ success: true, data: attendance });
  } catch (error: any) {
    logger.error('Check-out error', { error });
    res
      .status(400)
      .json({ success: false, error: { message: error.message || 'Check-out failed' } });
  }
}

export async function getMyAttendanceController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { startDate, endDate } = req.query;
    const attendance = await getAttendance(
      authReq.user.userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data: attendance });
  } catch (error) {
    logger.error('Get attendance error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch attendance' } });
  }
}

export async function getAllAttendanceController(req: Request, res: Response) {
  try {
    const { date } = req.query;
    const attendance = await getAllAttendance(new Date(date as string));
    res.json({ success: true, data: attendance });
  } catch (error) {
    logger.error('Get all attendance error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch attendance' } });
  }
}

export async function applyLeaveController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const leave = await applyLeave(authReq.user.userId, req.body);
    res.status(201).json({ success: true, data: leave });
  } catch (error: any) {
    logger.error('Apply leave error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to apply leave' } });
  }
}

export async function approveLeaveController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { leaveId } = req.params;
    const { approved, rejectionReason } = req.body;
    const leave = await approveLeave(leaveId, approved, authReq.user.userId, rejectionReason);
    res.json({ success: true, data: leave });
  } catch (error: any) {
    logger.error('Approve leave error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to approve leave' } });
  }
}

export async function getLeavesController(req: Request, res: Response) {
  try {
    const { userId, status } = req.query;
    const leaves = await getLeaves(userId as string, status as string);
    res.json({ success: true, data: leaves });
  } catch (error) {
    logger.error('Get leaves error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch leaves' } });
  }
}

export async function createShiftController(req: Request, res: Response) {
  try {
    const shift = await createShift(req.body);
    res.status(201).json({ success: true, data: shift });
  } catch (error: any) {
    logger.error('Create shift error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create shift' } });
  }
}

export async function getAllShiftsController(req: Request, res: Response) {
  try {
    const shifts = await getAllShifts();
    res.json({ success: true, data: shifts });
  } catch (error) {
    logger.error('Get shifts error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch shifts' } });
  }
}
