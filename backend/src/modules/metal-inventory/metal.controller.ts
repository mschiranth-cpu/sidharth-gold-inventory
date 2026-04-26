/**
 * ============================================
 * METAL INVENTORY CONTROLLER
 * ============================================
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  getAllMetalStock,
  getMetalStockSummary,
  createMetalStock,
  createMetalTransaction,
  updateMetalTransaction,
  deleteMetalTransaction,
  createMeltingBatch,
  getAllMetalTransactions,
  getCurrentMetalRates,
  createMetalRate,
  getMeltingBatches,
  settleMetalPayment,
  getMetalPayments,
} from './metal.service';
import { logger } from '../../utils/logger';
import { ApiError } from '../../middleware/errorHandler';

export async function getAllMetalStockController(req: Request, res: Response) {
  try {
    const { metalType, purity } = req.query;
    const stocks = await getAllMetalStock({
      metalType: metalType as any,
      purity: purity ? parseFloat(purity as string) : undefined,
    });
    res.json({ success: true, data: stocks });
  } catch (error) {
    logger.error('Get metal stock error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch metal stock' } });
  }
}

export async function getMetalStockSummaryController(req: Request, res: Response) {
  try {
    const summary = await getMetalStockSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Get stock summary error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch summary' } });
  }
}

export async function createMetalStockController(req: Request, res: Response) {
  try {
    const stock = await createMetalStock(req.body);
    res.status(201).json({ success: true, data: stock });
  } catch (error: any) {
    logger.error('Create metal stock error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create stock' } });
  }
}

export async function createMetalTransactionController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const transaction = await createMetalTransaction(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    logger.error('Create transaction error', { error });
    res
      .status(500)
      .json({
        success: false,
        error: { message: error.message || 'Failed to create transaction' },
      });
  }
}

export async function updateMetalTransactionController(req: Request, res: Response) {
  try {
    const transaction = await updateMetalTransaction(req.params.id, req.body);
    res.json({ success: true, data: transaction });
  } catch (error: any) {
    if (error instanceof ApiError) {
      logger.warn('Update transaction rejected', {
        transactionId: req.params.id,
        statusCode: error.statusCode,
        message: error.message,
      });
      return res
        .status(error.statusCode)
        .json({ success: false, error: { message: error.message } });
    }
    logger.error('Update transaction error', { error });
    res
      .status(500)
      .json({
        success: false,
        error: { message: error.message || 'Failed to update transaction' },
      });
  }
}

export async function deleteMetalTransactionController(req: Request, res: Response) {
  try {
    const result = await deleteMetalTransaction(req.params.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof ApiError) {
      logger.warn('Delete transaction rejected', {
        transactionId: req.params.id,
        statusCode: error.statusCode,
        message: error.message,
      });
      return res
        .status(error.statusCode)
        .json({ success: false, error: { message: error.message } });
    }
    logger.error('Delete transaction error', { error });
    res
      .status(500)
      .json({
        success: false,
        error: { message: error.message || 'Failed to delete transaction' },
      });
  }
}

export async function createMeltingBatchController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const batch = await createMeltingBatch(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: batch });
  } catch (error: any) {
    logger.error('Create melting batch error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create batch' } });
  }
}

export async function getAllMetalTransactionsController(req: Request, res: Response) {
  try {
    const { metalType, transactionType, startDate, endDate } = req.query;
    const transactions = await getAllMetalTransactions({
      metalType: metalType as any,
      transactionType: transactionType as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ success: true, data: transactions });
  } catch (error) {
    logger.error('Get transactions error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch transactions' } });
  }
}

export async function getCurrentMetalRatesController(req: Request, res: Response) {
  try {
    const rates = await getCurrentMetalRates();
    res.json({ success: true, data: rates });
  } catch (error) {
    logger.error('Get rates error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch rates' } });
  }
}

export async function createMetalRateController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const rate = await createMetalRate(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: rate });
  } catch (error: any) {
    logger.error('Create rate error', { error });
    res
      .status(500)
      .json({ success: false, error: { message: error.message || 'Failed to create rate' } });
  }
}

export async function getMeltingBatchesController(req: Request, res: Response) {
  try {
    const batches = await getMeltingBatches();
    res.json({ success: true, data: batches });
  } catch (error) {
    logger.error('Get batches error', { error });
    res.status(500).json({ success: false, error: { message: 'Failed to fetch batches' } });
  }
}

export async function settleMetalPaymentController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const transaction = await settleMetalPayment(
      req.params.id,
      req.body,
      authReq.user.userId
    );
    res.json({ success: true, data: transaction });
  } catch (error: any) {
    if (error instanceof ApiError) {
      logger.warn('Settle payment rejected', {
        transactionId: req.params.id,
        statusCode: error.statusCode,
        message: error.message,
      });
      return res
        .status(error.statusCode)
        .json({ success: false, error: { message: error.message } });
    }
    logger.error('Settle payment error', { error });
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to settle payment' },
    });
  }
}

export async function getMetalPaymentsController(req: Request, res: Response) {
  try {
    const payments = await getMetalPayments(req.params.id);
    res.json({ success: true, data: payments });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: { message: error.message } });
    }
    logger.error('Get metal payments error', { error });
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch payments' },
    });
  }
}
