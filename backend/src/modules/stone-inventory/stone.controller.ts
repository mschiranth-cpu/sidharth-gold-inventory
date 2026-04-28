/**
 * ============================================
 * STONE INVENTORY CONTROLLER — Real Stone + Stone Packet
 * ============================================
 * Mirrors backend/src/modules/diamond-inventory/diamond.controller.ts.
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import {
  // Real Stone
  getAllRealStones,
  getRealStoneById,
  createRealStonePurchase,
  issueRealStoneV2,
  transferRealStone,
  adjustRealStone,
  returnRealStoneFromDepartment,
  getAllRealStoneTransactions,
  updateRealStoneTransaction,
  deleteRealStoneTransaction,
  settleRealStonePayment,
  getRealStonePayments,
  exportRealStoneTransactions,
  getCurrentRealStoneRates,
  createRealStoneRate,
  getRealStoneStockSummary,
  // Stone Packet
  getAllStonePackets,
  getStonePacketById,
  getLowStockStonePackets,
  createStonePacketPurchase,
  issueStonePacket,
  transferStonePacket,
  adjustStonePacket,
  returnStonePacketFromDepartment,
  getAllStonePacketTransactions,
  updateStonePacketTransaction,
  deleteStonePacketTransaction,
  settleStonePacketPayment,
  getStonePacketPayments,
  exportStonePacketTransactions,
  getStonePacketStockSummary,
} from './stone.service';
import { logger } from '../../utils/logger';
import { ApiError } from '../../middleware/errorHandler';

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

// ============================================================================
// REAL STONE CONTROLLERS
// ============================================================================

export async function getAllRealStonesController(req: Request, res: Response) {
  try {
    const { stoneType, status } = req.query;
    const stones = await getAllRealStones({
      stoneType: stoneType as any,
      status: status as string | undefined,
    });
    res.json({ success: true, data: stones });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch real stones', {});
  }
}

export async function getRealStoneByIdController(req: Request, res: Response) {
  try {
    const { stoneId } = req.params;
    const stone = await getRealStoneById(stoneId);
    if (!stone) {
      return res.status(404).json({ success: false, error: { message: 'Real stone not found' } });
    }
    res.json({ success: true, data: stone });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch real stone', { stoneId: req.params.stoneId });
  }
}

/**
 * Legacy POST /real — wraps a single stone in createRealStonePurchase.
 * Preserves the old client contract while feeding through the new pipeline.
 */
export async function createRealStoneController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const result = await createRealStonePurchase(
      {
        transactionType: 'PURCHASE',
        items: [req.body],
      },
      userId
    );
    res.status(201).json({ success: true, data: result[0]?.stone ?? null });
  } catch (error) {
    handleErr(error, res, 'Failed to create real stone', {});
  }
}

export async function getRealStoneStockSummaryController(_req: Request, res: Response) {
  try {
    const summary = await getRealStoneStockSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch real stone stock summary', {});
  }
}

/** Discriminated POST /real/transactions — switches on transactionType. */
export async function createRealStoneTransactionController(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.userId;
  const type = req.body?.transactionType;
  try {
    let result;
    switch (type) {
      case 'PURCHASE':
        result = await createRealStonePurchase(req.body, userId);
        break;
      case 'ISSUE_TO_DEPARTMENT':
        result = await issueRealStoneV2(req.body, userId);
        break;
      case 'TRANSFER':
        result = await transferRealStone(req.body, userId);
        break;
      case 'ADJUSTMENT':
        result = await adjustRealStone(req.body, userId);
        break;
      case 'RETURN_FROM_DEPARTMENT':
        result = await returnRealStoneFromDepartment(req.body, userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { message: `Unknown transactionType: ${type}` },
        });
    }
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    handleErr(error, res, 'Failed to create real stone transaction', { type });
  }
}

export async function getAllRealStoneTransactionsController(req: Request, res: Response) {
  try {
    const { transactionType, vendorId, isBillable, startDate, endDate } = req.query;
    const txns = await getAllRealStoneTransactions({
      transactionType: transactionType as string | undefined,
      vendorId: vendorId as string | undefined,
      isBillable:
        isBillable === 'true' ? true : isBillable === 'false' ? false : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ success: true, data: txns });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch real stone transactions', {});
  }
}

export async function updateRealStoneTransactionController(req: Request, res: Response) {
  try {
    const t = await updateRealStoneTransaction(req.params.id, req.body);
    res.json({ success: true, data: t });
  } catch (error) {
    handleErr(error, res, 'Failed to update real stone transaction', {
      transactionId: req.params.id,
    });
  }
}

export async function deleteRealStoneTransactionController(req: Request, res: Response) {
  try {
    const r = await deleteRealStoneTransaction(req.params.id);
    res.json({ success: true, data: r });
  } catch (error) {
    handleErr(error, res, 'Failed to delete real stone transaction', {
      transactionId: req.params.id,
    });
  }
}

export async function settleRealStonePaymentController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const t = await settleRealStonePayment(req.params.id, req.body, authReq.user.userId);
    res.json({ success: true, data: t });
  } catch (error) {
    handleErr(error, res, 'Failed to settle real stone payment', {
      transactionId: req.params.id,
    });
  }
}

export async function getRealStonePaymentsController(req: Request, res: Response) {
  try {
    const payments = await getRealStonePayments(req.params.id);
    res.json({ success: true, data: payments });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch real stone payments', {
      transactionId: req.params.id,
    });
  }
}

export async function exportRealStoneTransactionsController(req: Request, res: Response) {
  try {
    const { transactionType, vendorId, startDate, endDate, taxClass } = req.query;
    const buf = await exportRealStoneTransactions({
      transactionType: transactionType as string | undefined,
      vendorId: vendorId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      taxClass:
        taxClass === 'BILLABLE' || taxClass === 'NON_BILLABLE'
          ? (taxClass as 'BILLABLE' | 'NON_BILLABLE')
          : undefined,
    });
    const filename = `real-stone-transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (error) {
    handleErr(error, res, 'Failed to export real stone transactions', {});
  }
}

export async function getCurrentRealStoneRatesController(_req: Request, res: Response) {
  try {
    const rates = await getCurrentRealStoneRates();
    res.json({ success: true, data: rates });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch real stone rates', {});
  }
}

export async function createRealStoneRateController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const rate = await createRealStoneRate(req.body, authReq.user.userId);
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    handleErr(error, res, 'Failed to create real stone rate', {});
  }
}

// ============================================================================
// STONE PACKET CONTROLLERS
// ============================================================================

export async function getAllStonePacketsController(req: Request, res: Response) {
  try {
    const { stoneType, size } = req.query;
    const packets = await getAllStonePackets({
      stoneType: stoneType as any,
      size: size as string | undefined,
    });
    res.json({ success: true, data: packets });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch stone packets', {});
  }
}

export async function getStonePacketByIdController(req: Request, res: Response) {
  try {
    const { packetId } = req.params;
    const packet = await getStonePacketById(packetId);
    if (!packet) {
      return res.status(404).json({ success: false, error: { message: 'Stone packet not found' } });
    }
    res.json({ success: true, data: packet });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch stone packet', { packetId: req.params.packetId });
  }
}

export async function getLowStockStonePacketsController(_req: Request, res: Response) {
  try {
    const packets = await getLowStockStonePackets();
    res.json({ success: true, data: packets });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch low-stock stone packets', {});
  }
}

/** Legacy POST /packets — wraps a single packet in createStonePacketPurchase. */
export async function createStonePacketController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const result = await createStonePacketPurchase(
      {
        transactionType: 'PURCHASE',
        items: [req.body],
      },
      userId
    );
    res.status(201).json({ success: true, data: result[0]?.packet ?? null });
  } catch (error) {
    handleErr(error, res, 'Failed to create stone packet', {});
  }
}

export async function getStonePacketStockSummaryController(_req: Request, res: Response) {
  try {
    const summary = await getStonePacketStockSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch stone packet stock summary', {});
  }
}

/** Discriminated POST /packets/transactions — switches on transactionType. */
export async function createStonePacketTransactionController(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.userId;
  const type = req.body?.transactionType;
  try {
    let result;
    switch (type) {
      case 'PURCHASE':
        result = await createStonePacketPurchase(req.body, userId);
        break;
      case 'ISSUE_TO_DEPARTMENT':
        result = await issueStonePacket(req.body, userId);
        break;
      case 'TRANSFER':
        result = await transferStonePacket(req.body, userId);
        break;
      case 'ADJUSTMENT':
        result = await adjustStonePacket(req.body, userId);
        break;
      case 'RETURN_FROM_DEPARTMENT':
        result = await returnStonePacketFromDepartment(req.body, userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { message: `Unknown transactionType: ${type}` },
        });
    }
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    handleErr(error, res, 'Failed to create stone packet transaction', { type });
  }
}

export async function getAllStonePacketTransactionsController(req: Request, res: Response) {
  try {
    const { transactionType, vendorId, isBillable, startDate, endDate } = req.query;
    const txns = await getAllStonePacketTransactions({
      transactionType: transactionType as string | undefined,
      vendorId: vendorId as string | undefined,
      isBillable:
        isBillable === 'true' ? true : isBillable === 'false' ? false : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ success: true, data: txns });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch stone packet transactions', {});
  }
}

export async function updateStonePacketTransactionController(req: Request, res: Response) {
  try {
    const t = await updateStonePacketTransaction(req.params.id, req.body);
    res.json({ success: true, data: t });
  } catch (error) {
    handleErr(error, res, 'Failed to update stone packet transaction', {
      transactionId: req.params.id,
    });
  }
}

export async function deleteStonePacketTransactionController(req: Request, res: Response) {
  try {
    const r = await deleteStonePacketTransaction(req.params.id);
    res.json({ success: true, data: r });
  } catch (error) {
    handleErr(error, res, 'Failed to delete stone packet transaction', {
      transactionId: req.params.id,
    });
  }
}

export async function settleStonePacketPaymentController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const t = await settleStonePacketPayment(req.params.id, req.body, authReq.user.userId);
    res.json({ success: true, data: t });
  } catch (error) {
    handleErr(error, res, 'Failed to settle stone packet payment', {
      transactionId: req.params.id,
    });
  }
}

export async function getStonePacketPaymentsController(req: Request, res: Response) {
  try {
    const payments = await getStonePacketPayments(req.params.id);
    res.json({ success: true, data: payments });
  } catch (error) {
    handleErr(error, res, 'Failed to fetch stone packet payments', {
      transactionId: req.params.id,
    });
  }
}

export async function exportStonePacketTransactionsController(req: Request, res: Response) {
  try {
    const { transactionType, vendorId, startDate, endDate, taxClass } = req.query;
    const buf = await exportStonePacketTransactions({
      transactionType: transactionType as string | undefined,
      vendorId: vendorId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      taxClass:
        taxClass === 'BILLABLE' || taxClass === 'NON_BILLABLE'
          ? (taxClass as 'BILLABLE' | 'NON_BILLABLE')
          : undefined,
    });
    const filename = `stone-packet-transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (error) {
    handleErr(error, res, 'Failed to export stone packet transactions', {});
  }
}
