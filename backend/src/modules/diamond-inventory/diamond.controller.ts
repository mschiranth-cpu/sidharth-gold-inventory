/**
 * ============================================
 * DIAMOND INVENTORY CONTROLLER
 * ============================================
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  getAllDiamonds,
  getDiamondById,
  createDiamond,
  issueDiamond,
  getAllDiamondLots,
  createDiamondLot,
  // Parity-with-metal additions
  getDiamondStockSummary,
  createDiamondPurchase,
  issueDiamondV2,
  transferDiamond,
  adjustDiamond,
  returnDiamondFromDepartment,
  getAllDiamondTransactions,
  updateDiamondTransaction,
  deleteDiamondTransaction,
  settleDiamondPayment,
  getDiamondPayments,
  exportDiamondTransactions,
  getCurrentDiamondRates,
  createDiamondRate,
} from './diamond.service';
import { logger } from '../../utils/logger';
import { ApiError } from '../../middleware/errorHandler';

export async function getAllDiamondsController(req: Request, res: Response) {
  try {
    const { shape, color, clarity, status, category } = req.query;
    const diamonds = await getAllDiamonds({
      shape: shape as string,
      color: color as string,
      clarity: clarity as string,
      status: status as string,
      category: category as string,
    });
    res.json({ success: true, data: diamonds });
  } catch (error) {
    logger.error('Get diamonds error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch diamonds' } });
  }
}

export async function getDiamondByIdController(req: Request, res: Response) {
  try {
    const { diamondId } = req.params;
    const diamond = await getDiamondById(diamondId);
    if (!diamond) {
      return res.status(404).json({ success: false, error: { message: 'Diamond not found' } });
    }
    res.json({ success: true, data: diamond });
  } catch (error) {
    logger.error('Get diamond error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch diamond' } });
  }
}

export async function createDiamondController(req: Request, res: Response) {
  try {
    const diamond = await createDiamond(req.body);
    res.status(201).json({ success: true, data: diamond });
  } catch (error: any) {
    logger.error('Create diamond error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create diamond' } });
  }
}

export async function issueDiamondController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const diamond = await issueDiamond(req.body, authReq.user.userId);
    res.json({ success: true, data: diamond });
  } catch (error: any) {
    logger.error('Issue diamond error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to issue diamond' } });
  }
}

export async function getAllDiamondLotsController(req: Request, res: Response) {
  try {
    const lots = await getAllDiamondLots();
    res.json({ success: true, data: lots });
  } catch (error) {
    logger.error('Get diamond lots error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch lots' } });
  }
}

export async function createDiamondLotController(req: Request, res: Response) {
  try {
    const lot = await createDiamondLot(req.body);
    res.status(201).json({ success: true, data: lot });
  } catch (error: any) {
    logger.error('Create diamond lot error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create lot' } });
  }
}

// ============================================================================
// PARITY-WITH-METAL CONTROLLERS
// ============================================================================

/** Helper: turn ApiError -> proper status, otherwise 500. */
function handleErr(error: any, res: Response, defaultMsg: string, ctx: Record<string, unknown>) {
  if (error instanceof ApiError) {
    logger.warn(defaultMsg, { ...ctx, statusCode: error.statusCode, message: error.message });
    return res
      .status(error.statusCode)
      .json({ success: false, error: { message: error.message } });
  }
  logger.error(defaultMsg, { ...ctx, error });
  res.status(500).json({
    success: false,
    error: { message: error?.message || defaultMsg },
  });
}

export async function getDiamondStockSummaryController(_req: Request, res: Response) {
  try {
    const summary = await getDiamondStockSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch diamond stock summary', {});
  }
}

/**
 * Unified `POST /diamonds/transactions` — discriminated by `transactionType`.
 * Mirror of metal's single create endpoint.
 */
export async function createDiamondTransactionController(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.userId;
  const type = req.body?.transactionType;
  try {
    let result;
    switch (type) {
      case 'PURCHASE':
        result = await createDiamondPurchase(req.body, userId);
        break;
      case 'ISSUE_TO_DEPARTMENT':
        result = await issueDiamondV2(req.body, userId);
        break;
      case 'TRANSFER':
        result = await transferDiamond(req.body, userId);
        break;
      case 'ADJUSTMENT':
        result = await adjustDiamond(req.body, userId);
        break;
      case 'RETURN_FROM_DEPARTMENT':
        result = await returnDiamondFromDepartment(req.body, userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { message: `Unknown transactionType: ${type}` },
        });
    }
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    handleErr(error, res, 'Failed to create diamond transaction', { type });
  }
}

export async function getAllDiamondTransactionsController(req: Request, res: Response) {
  try {
    const { transactionType, vendorId, isBillable, startDate, endDate } = req.query;
    const transactions = await getAllDiamondTransactions({
      transactionType: transactionType as string | undefined,
      vendorId: vendorId as string | undefined,
      isBillable:
        isBillable === 'true' ? true : isBillable === 'false' ? false : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ success: true, data: transactions });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch diamond transactions', {});
  }
}

export async function updateDiamondTransactionController(req: Request, res: Response) {
  try {
    const transaction = await updateDiamondTransaction(req.params.id, req.body);
    res.json({ success: true, data: transaction });
  } catch (error) {
    handleErr(error, res, 'Failed to update diamond transaction', { transactionId: req.params.id });
  }
}

export async function deleteDiamondTransactionController(req: Request, res: Response) {
  try {
    const result = await deleteDiamondTransaction(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    handleErr(error, res, 'Failed to delete diamond transaction', { transactionId: req.params.id });
  }
}

export async function settleDiamondPaymentController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const transaction = await settleDiamondPayment(
      req.params.id,
      req.body,
      authReq.user.userId
    );
    res.json({ success: true, data: transaction });
  } catch (error) {
    handleErr(error, res, 'Failed to settle diamond payment', { transactionId: req.params.id });
  }
}

export async function getDiamondPaymentsController(req: Request, res: Response) {
  try {
    const payments = await getDiamondPayments(req.params.id);
    res.json({ success: true, data: payments });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch diamond payments', { transactionId: req.params.id });
  }
}

export async function exportDiamondTransactionsController(req: Request, res: Response) {
  try {
    const { transactionType, vendorId, startDate, endDate, taxClass } = req.query;
    const buffer = await exportDiamondTransactions({
      transactionType: transactionType as string | undefined,
      vendorId: vendorId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      taxClass:
        taxClass === 'BILLABLE' || taxClass === 'NON_BILLABLE'
          ? (taxClass as 'BILLABLE' | 'NON_BILLABLE')
          : undefined,
    });
    const filename = `diamond-transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    handleErr(error, res, 'Failed to export diamond transactions', {});
  }
}

export async function getCurrentDiamondRatesController(_req: Request, res: Response) {
  try {
    const rates = await getCurrentDiamondRates();
    res.json({ success: true, data: rates });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch diamond rates', {});
  }
}

export async function createDiamondRateController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const rate = await createDiamondRate(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    handleErr(error, res, 'Failed to create diamond rate', {});
  }
}
