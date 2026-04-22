/**
 * ============================================
 * PAYROLL CONTROLLER
 * ============================================
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  createSalaryStructure,
  getSalaryStructure,
  createPayrollPeriod,
  processPayroll,
  getPayrollPeriods,
  getPayslip,
  getMyPayslips,
  createEmployeeAdvance,
  createEmployeeLoan,
} from './payroll.service';
import { logger } from '../../utils/logger';

export async function createSalaryStructureController(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const structure = await createSalaryStructure(userId, req.body);
    res.status(201).json({ success: true, data: structure });
  } catch (error: any) {
    logger.error('Create salary structure error', { error });
    res
      .status(500)
      .json({
        success: false,
        error: { message: error.message || 'Failed to create salary structure' },
      });
  }
}

export async function getSalaryStructureController(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const structure = await getSalaryStructure(userId);
    res.json({ success: true, data: structure });
  } catch (error) {
    logger.error('Get salary structure error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: 'Failed to fetch salary structure' } });
  }
}

export async function createPayrollPeriodController(req: Request, res: Response) {
  try {
    const period = await createPayrollPeriod(req.body);
    res.status(201).json({ success: true, data: period });
  } catch (error: any) {
    logger.error('Create payroll period error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create period' } });
  }
}

export async function processPayrollController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { periodId } = req.params;
    await processPayroll(periodId, authReq.user.userId);
    res.json({ success: true, message: 'Payroll processed successfully' });
  } catch (error: any) {
    logger.error('Process payroll error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to process payroll' } });
  }
}

export async function getPayrollPeriodsController(req: Request, res: Response) {
  try {
    const periods = await getPayrollPeriods();
    res.json({ success: true, data: periods });
  } catch (error) {
    logger.error('Get payroll periods error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch periods' } });
  }
}

export async function getPayslipController(req: Request, res: Response) {
  try {
    const { payslipId } = req.params;
    const payslip = await getPayslip(payslipId);
    if (!payslip) {
      return res.status(404).json({ success: false, error: { message: 'Payslip not found' } });
    }
    res.json({ success: true, data: payslip });
  } catch (error) {
    logger.error('Get payslip error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch payslip' } });
  }
}

export async function getMyPayslipsController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const payslips = await getMyPayslips(authReq.user.userId);
    res.json({ success: true, data: payslips });
  } catch (error) {
    logger.error('Get my payslips error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch payslips' } });
  }
}

export async function createEmployeeAdvanceController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { userId } = req.params;
    const advance = await createEmployeeAdvance(userId, {
      ...req.body,
      approvedById: authReq.user.userId,
    });
    res.status(201).json({ success: true, data: advance });
  } catch (error: any) {
    logger.error('Create advance error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create advance' } });
  }
}

export async function createEmployeeLoanController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { userId } = req.params;
    const loan = await createEmployeeLoan(userId, {
      ...req.body,
      approvedById: authReq.user.userId,
    });
    res.status(201).json({ success: true, data: loan });
  } catch (error: any) {
    logger.error('Create loan error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create loan' } });
  }
}
