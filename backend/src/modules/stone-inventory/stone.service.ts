/**
 * ============================================
 * STONE INVENTORY SERVICE — Real Stone + Synthetic Stone Packet
 * ============================================
 * Mirrors backend/src/modules/diamond-inventory/diamond.service.ts.
 */

import { PrismaClient, RealStoneType, SyntheticStoneType } from '@prisma/client';
import * as XLSX from 'xlsx';
import { logger } from '../../utils/logger';
import { ApiError } from '../../middleware/errorHandler';
import {
  CreateRealStoneRequest,
  CreateRealStonePurchaseRequest,
  IssueRealStoneRequest,
  TransferRealStoneRequest,
  AdjustRealStoneRequest,
  ReturnRealStoneFromDepartmentRequest,
  UpdateRealStoneTransactionRequest,
  SettleRealStonePaymentRequest,
  CreateRealStoneRateRequest,
  RealStoneStockSummary,
  CreateStonePacketRequest,
  CreateStonePacketPurchaseRequest,
  IssueStonePacketRequest,
  TransferStonePacketRequest,
  AdjustStonePacketRequest,
  ReturnStonePacketFromDepartmentRequest,
  UpdateStonePacketTransactionRequest,
  SettleStonePacketPaymentRequest,
  StonePacketStockSummary,
} from './stone.types';

const prisma = new PrismaClient();

// ============================================================================
// SHARED HELPERS
// ============================================================================

/**
 * Vendor-credit math for a single PURCHASE item.
 * Mirrors diamond.service.ts applyCreditMath exactly.
 */
function applyCreditMath(
  totalValue: number,
  amountPaid: number,
  requestedCredit: number,
  availableCredit: number
): {
  creditApplied: number;
  creditGenerated: number;
  cachedAmountPaid: number;
  cachedStatus: 'COMPLETE' | 'HALF' | 'PENDING';
  balanceDelta: number;
} {
  const remainingAfterPaid = Math.max(0, totalValue - amountPaid);
  const creditApplied = Math.min(
    Math.max(0, requestedCredit),
    availableCredit,
    remainingAfterPaid
  );
  const effectivePaid = amountPaid + creditApplied;
  let cachedAmountPaid = effectivePaid;
  let creditGenerated = 0;
  if (effectivePaid > totalValue + 0.01) {
    creditGenerated = effectivePaid - totalValue;
    cachedAmountPaid = totalValue;
  }
  let cachedStatus: 'COMPLETE' | 'HALF' | 'PENDING';
  if (cachedAmountPaid + 0.01 >= totalValue) cachedStatus = 'COMPLETE';
  else if (cachedAmountPaid <= 0.01) cachedStatus = 'PENDING';
  else cachedStatus = 'HALF';
  const balanceDelta = creditGenerated - creditApplied;
  return { creditApplied, creditGenerated, cachedAmountPaid, cachedStatus, balanceDelta };
}

function tsStamp(): string {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    '-' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  );
}

// ============================================================================
// REAL STONE — READS
// ============================================================================

export async function getAllRealStones(filters?: {
  stoneType?: RealStoneType;
  status?: string;
}) {
  const where: any = {};
  if (filters?.stoneType) where.stoneType = filters.stoneType;
  if (filters?.status) where.status = filters.status;
  return prisma.realStone.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRealStoneById(stoneId: string) {
  return prisma.realStone.findUnique({
    where: { id: stoneId },
    include: {
      transactions: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/** Legacy single-stone create — wraps into createRealStonePurchase. */
export async function createRealStone(data: CreateRealStoneRequest, createdById: string) {
  const result = await createRealStonePurchase(
    {
      transactionType: 'PURCHASE',
      items: [
        {
          stockNumber: data.stockNumber,
          stoneType: data.stoneType,
          caratWeight: data.caratWeight,
          shape: data.shape,
          color: data.color,
          clarity: data.clarity,
          cut: data.cut,
          origin: data.origin,
          treatment: data.treatment,
          treatmentNotes: data.treatmentNotes,
          certLab: data.certLab,
          certNumber: data.certNumber,
          certDate: data.certDate,
          pricePerCarat: data.pricePerCarat,
        },
      ],
    },
    createdById
  );
  return result[0]?.stone;
}

// ============================================================================
// REAL STONE — PURCHASE
// ============================================================================

/**
 * Multi-item PURCHASE. Each item creates a RealStone row + RealStoneTransaction.
 * Vendor row is locked once for the entire batch.
 */
export async function createRealStonePurchase(
  data: CreateRealStonePurchaseRequest,
  createdById: string
) {
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new ApiError(400, 'PURCHASE requires at least one item');
  }
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;

  const result = await prisma.$transaction(async (tx) => {
    let availableCredit = 0;
    if (data.vendorId) {
      await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${data.vendorId} FOR UPDATE`;
      const vendor = await tx.vendor.findUnique({
        where: { id: data.vendorId },
        select: { creditBalance: true },
      });
      availableCredit = vendor?.creditBalance ?? 0;
    }

    const created: any[] = [];
    let runningBalanceDelta = 0;
    const stamp = tsStamp();

    for (let idx = 0; idx < data.items.length; idx++) {
      const item = data.items[idx];
      const totalValue = item.pricePerCarat ? item.caratWeight * item.pricePerCarat : 0;
      const stockNumber =
        item.stockNumber && String(item.stockNumber).trim().length > 0
          ? item.stockNumber
          : `RST-${stamp}-${String(idx + 1).padStart(3, '0')}`;

      const stone = await tx.realStone.create({
        data: {
          stockNumber,
          stoneType: item.stoneType,
          caratWeight: item.caratWeight,
          shape: item.shape,
          color: item.color,
          clarity: item.clarity,
          cut: item.cut,
          origin: item.origin,
          treatment: item.treatment,
          treatmentNotes: item.treatmentNotes,
          certLab: item.certLab,
          certNumber: item.certNumber,
          certDate: item.certDate,
          pricePerCarat: item.pricePerCarat,
          totalPrice: totalValue || undefined,
          status: 'IN_STOCK',
        },
      });

      let billing = {
        creditApplied: 0,
        creditGenerated: 0,
        cachedAmountPaid: item.amountPaid ?? 0,
        cachedStatus: 'PENDING' as 'COMPLETE' | 'HALF' | 'PENDING',
        balanceDelta: 0,
      };
      if (data.vendorId && totalValue > 0) {
        billing = applyCreditMath(
          totalValue,
          item.amountPaid ?? 0,
          item.creditApplied ?? 0,
          availableCredit
        );
        availableCredit = Math.max(
          0,
          availableCredit - billing.creditApplied + billing.creditGenerated
        );
        runningBalanceDelta += billing.balanceDelta;
      }

      const neftDate = item.neftDate ? new Date(item.neftDate) : undefined;
      const transaction = await tx.realStoneTransaction.create({
        data: {
          stoneId: stone.id,
          transactionType: 'PURCHASE',
          vendorId: data.vendorId,
          referenceNumber: data.referenceNumber,
          notes: data.notes ?? undefined,
          createdById,
          ...(txnDate ? { createdAt: txnDate } : {}),
          caratWeight: item.caratWeight,
          pricePerCarat: item.pricePerCarat,
          totalValue: totalValue || undefined,
          isBillable: item.isBillable,
          paymentMode: item.paymentMode,
          paymentStatus: billing.cachedStatus,
          amountPaid: billing.cachedAmountPaid,
          cashAmount: item.cashAmount,
          neftAmount: item.neftAmount,
          neftUtr: item.neftUtr || undefined,
          neftBank: item.neftBank || undefined,
          neftDate,
          creditApplied: billing.creditApplied > 0 ? billing.creditApplied : undefined,
          creditGenerated: billing.creditGenerated > 0 ? billing.creditGenerated : undefined,
        },
        include: {
          stone: true,
          vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
        },
      });
      created.push(transaction);
    }

    if (data.vendorId && runningBalanceDelta !== 0) {
      await tx.vendor.update({
        where: { id: data.vendorId },
        data: { creditBalance: { increment: runningBalanceDelta } },
      });
    }

    return created;
  });

  logger.info('Real stone purchase created', {
    items: result.length,
    vendorId: data.vendorId,
    referenceNumber: data.referenceNumber,
  });
  return result;
}

// ============================================================================
// REAL STONE — MOVEMENTS
// ============================================================================

/** Issue a real stone (whole-stone — IN_STOCK -> ISSUED). */
export async function issueRealStoneV2(data: IssueRealStoneRequest, createdById: string) {
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM real_stones WHERE id = ${data.stoneId} FOR UPDATE`;
    const stone = await tx.realStone.findUnique({ where: { id: data.stoneId } });
    if (!stone) throw new ApiError(404, 'Real stone not found');
    if (stone.status !== 'IN_STOCK') {
      throw new ApiError(400, `Stone is ${stone.status}, cannot issue`);
    }

    await tx.realStone.update({
      where: { id: stone.id },
      data: { status: 'ISSUED' },
    });

    return tx.realStoneTransaction.create({
      data: {
        stoneId: stone.id,
        transactionType: 'ISSUE_TO_DEPARTMENT',
        orderId: data.orderId,
        departmentId: data.departmentId,
        workerId: data.workerId,
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
        caratWeight: stone.caratWeight,
        pricePerCarat: stone.pricePerCarat,
        totalValue: stone.totalPrice ?? (stone.pricePerCarat ? stone.pricePerCarat * stone.caratWeight : undefined),
      },
      include: { stone: true, createdBy: { select: { name: true, email: true } } },
    });
  });

  logger.info('Real stone issued', { stoneId: data.stoneId });
  return result;
}

export async function transferRealStone(data: TransferRealStoneRequest, createdById: string) {
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM real_stones WHERE id = ${data.stoneId} FOR UPDATE`;
    const stone = await tx.realStone.findUnique({ where: { id: data.stoneId } });
    if (!stone) throw new ApiError(404, 'Real stone not found');

    return tx.realStoneTransaction.create({
      data: {
        stoneId: data.stoneId,
        transactionType: 'TRANSFER',
        fromLocation: data.fromLocation,
        toLocation: data.toLocation,
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
        caratWeight: stone.caratWeight,
      },
      include: { stone: true },
    });
  });
  logger.info('Real stone transferred', { stoneId: data.stoneId, to: data.toLocation });
  return result;
}

export async function adjustRealStone(data: AdjustRealStoneRequest, createdById: string) {
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM real_stones WHERE id = ${data.stoneId} FOR UPDATE`;
    const stone = await tx.realStone.findUnique({ where: { id: data.stoneId } });
    if (!stone) throw new ApiError(404, 'Real stone not found');

    if (data.deltaCarats != null && data.deltaCarats !== 0) {
      const newWeight = Math.max(0, stone.caratWeight + data.deltaCarats);
      await tx.realStone.update({
        where: { id: stone.id },
        data: { caratWeight: newWeight },
      });
    }

    return tx.realStoneTransaction.create({
      data: {
        stoneId: data.stoneId,
        transactionType: 'ADJUSTMENT',
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
        caratWeight: data.deltaCarats,
      },
      include: { stone: true },
    });
  });
  logger.info('Real stone adjusted', { stoneId: data.stoneId });
  return result;
}

export async function returnRealStoneFromDepartment(
  data: ReturnRealStoneFromDepartmentRequest,
  createdById: string
) {
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM real_stones WHERE id = ${data.stoneId} FOR UPDATE`;
    const stone = await tx.realStone.findUnique({ where: { id: data.stoneId } });
    if (!stone) throw new ApiError(404, 'Real stone not found');

    await tx.realStone.update({
      where: { id: stone.id },
      data: { status: 'IN_STOCK' },
    });

    return tx.realStoneTransaction.create({
      data: {
        stoneId: data.stoneId,
        transactionType: 'RETURN_FROM_DEPARTMENT',
        orderId: data.orderId,
        departmentId: data.departmentId,
        workerId: data.workerId,
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
        caratWeight: stone.caratWeight,
      },
      include: { stone: true },
    });
  });
  logger.info('Real stone returned from department', { stoneId: data.stoneId });
  return result;
}

// ============================================================================
// REAL STONE — TRANSACTIONS LIST / EDIT / DELETE
// ============================================================================

export async function getAllRealStoneTransactions(filters?: {
  transactionType?: string;
  vendorId?: string;
  isBillable?: boolean;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};
  if (filters?.transactionType) where.transactionType = filters.transactionType;
  if (filters?.vendorId) where.vendorId = filters.vendorId;
  if (filters?.isBillable !== undefined) where.isBillable = filters.isBillable;
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  return prisma.realStoneTransaction.findMany({
    where,
    include: {
      stone: { select: { id: true, stockNumber: true, stoneType: true, shape: true, color: true } },
      vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function updateRealStoneTransaction(
  id: string,
  data: UpdateRealStoneTransactionRequest
) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.realStoneTransaction.findUnique({
      where: { id },
      include: { payments: { select: { id: true } } },
    });
    if (!old) throw new ApiError(404, 'Real stone transaction not found');
    if (old.payments.length > 0) {
      throw new ApiError(
        400,
        'Cannot edit a transaction that has settlement entries. Reconcile/void the settlements first.'
      );
    }

    const isPurchase = old.transactionType === 'PURCHASE';
    const newVendorId = data.vendorId !== undefined ? data.vendorId : old.vendorId;
    const newPpc = data.pricePerCarat ?? old.pricePerCarat ?? null;
    const newTotalValue = newPpc && old.caratWeight ? newPpc * old.caratWeight : old.totalValue;

    if (isPurchase && old.vendorId) {
      const oldDelta = (old.creditGenerated ?? 0) - (old.creditApplied ?? 0);
      if (oldDelta !== 0) {
        await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${old.vendorId} FOR UPDATE`;
        await tx.vendor.update({
          where: { id: old.vendorId },
          data: { creditBalance: { increment: -oldDelta } },
        });
      }
    }

    let creditApplied = 0;
    let creditGenerated = 0;
    let cachedAmountPaid = data.amountPaid ?? old.amountPaid ?? 0;
    let cachedStatus: string | null | undefined = data.paymentStatus ?? old.paymentStatus;
    if (isPurchase && newVendorId && newTotalValue && newTotalValue > 0) {
      await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${newVendorId} FOR UPDATE`;
      const vendor = await tx.vendor.findUnique({
        where: { id: newVendorId },
        select: { creditBalance: true },
      });
      const math = applyCreditMath(
        newTotalValue,
        data.amountPaid ?? old.amountPaid ?? 0,
        data.creditApplied ?? old.creditApplied ?? 0,
        vendor?.creditBalance ?? 0
      );
      creditApplied = math.creditApplied;
      creditGenerated = math.creditGenerated;
      cachedAmountPaid = math.cachedAmountPaid;
      cachedStatus = math.cachedStatus;
      if (math.balanceDelta !== 0) {
        await tx.vendor.update({
          where: { id: newVendorId },
          data: { creditBalance: { increment: math.balanceDelta } },
        });
      }
    }

    const neftDate = data.neftDate ? new Date(data.neftDate) : undefined;
    const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;

    const updated = await tx.realStoneTransaction.update({
      where: { id },
      data: {
        vendorId: newVendorId,
        referenceNumber: data.referenceNumber !== undefined ? data.referenceNumber : old.referenceNumber,
        notes: data.notes !== undefined ? data.notes : old.notes,
        pricePerCarat: newPpc,
        totalValue: newTotalValue,
        ...(txnDate ? { createdAt: txnDate } : {}),
        isBillable: data.isBillable !== undefined ? data.isBillable : old.isBillable,
        paymentMode: isPurchase ? data.paymentMode ?? old.paymentMode : null,
        paymentStatus: isPurchase ? cachedStatus : null,
        amountPaid: isPurchase ? cachedAmountPaid : null,
        cashAmount: isPurchase ? (data.cashAmount !== undefined ? data.cashAmount : old.cashAmount) : null,
        neftAmount: isPurchase ? (data.neftAmount !== undefined ? data.neftAmount : old.neftAmount) : null,
        neftUtr: isPurchase ? (data.neftUtr !== undefined ? data.neftUtr || null : old.neftUtr) : null,
        neftBank: isPurchase ? (data.neftBank !== undefined ? data.neftBank || null : old.neftBank) : null,
        neftDate: isPurchase ? (data.neftDate !== undefined ? neftDate ?? null : old.neftDate) : null,
        creditApplied: isPurchase && creditApplied > 0 ? creditApplied : null,
        creditGenerated: isPurchase && creditGenerated > 0 ? creditGenerated : null,
      },
      include: {
        stone: true,
        vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
      },
    });
    logger.info('Real stone transaction updated', { transactionId: id });
    return updated;
  });
}

export async function deleteRealStoneTransaction(id: string) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.realStoneTransaction.findUnique({
      where: { id },
      include: { payments: { select: { id: true } }, stone: true },
    });
    if (!old) throw new ApiError(404, 'Real stone transaction not found');
    if (old.payments.length > 0) {
      throw new ApiError(
        400,
        'Cannot delete a transaction that has settlement entries. Reconcile/void the settlements first.'
      );
    }
    if (old.transactionType === 'PURCHASE') {
      throw new ApiError(
        400,
        'Cannot delete a PURCHASE transaction directly. Delete the stone instead, which cascades.'
      );
    }

    if (old.vendorId) {
      const oldDelta = (old.creditGenerated ?? 0) - (old.creditApplied ?? 0);
      if (oldDelta !== 0) {
        await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${old.vendorId} FOR UPDATE`;
        await tx.vendor.update({
          where: { id: old.vendorId },
          data: { creditBalance: { increment: -oldDelta } },
        });
      }
    }

    // Reverse status changes for ISSUE / RETURN.
    await tx.$queryRaw`SELECT id FROM real_stones WHERE id = ${old.stoneId} FOR UPDATE`;
    if (old.transactionType === 'ISSUE_TO_DEPARTMENT') {
      await tx.realStone.update({
        where: { id: old.stoneId },
        data: { status: 'IN_STOCK' },
      });
    } else if (old.transactionType === 'ADJUSTMENT' && old.caratWeight) {
      const stone = await tx.realStone.findUnique({ where: { id: old.stoneId } });
      if (stone) {
        await tx.realStone.update({
          where: { id: stone.id },
          data: { caratWeight: Math.max(0, stone.caratWeight - old.caratWeight) },
        });
      }
    }

    await tx.realStoneTransaction.delete({ where: { id } });
    logger.info('Real stone transaction deleted', { transactionId: id });
    return { id };
  });
}

// ============================================================================
// REAL STONE — PAYMENT SETTLEMENT
// ============================================================================

export async function settleRealStonePayment(
  transactionId: string,
  data: SettleRealStonePaymentRequest,
  userId: string
) {
  if (data.amount == null || data.amount < 0) {
    throw new ApiError(400, 'Settlement amount must be 0 or greater');
  }
  if (!data.paymentMode) {
    throw new ApiError(400, 'paymentMode is required');
  }
  if ((data.amount ?? 0) <= 0 && (data.creditApplied ?? 0) <= 0) {
    throw new ApiError(400, 'Either settlement amount or credit applied must be greater than 0');
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM real_stone_transactions WHERE id = ${transactionId} FOR UPDATE`;
    const txn = await tx.realStoneTransaction.findUnique({
      where: { id: transactionId },
      include: { payments: true },
    });
    if (!txn) throw new ApiError(404, 'Real stone transaction not found', true, 'NOT_FOUND');
    if (txn.transactionType !== 'PURCHASE') {
      throw new ApiError(400, 'Only purchases can be settled');
    }

    const totalValue = txn.totalValue ?? 0;
    const ledgerSum = txn.payments.reduce((s, p) => s + p.amount, 0);
    const previouslyPaid = Math.max(ledgerSum, txn.amountPaid ?? 0);
    const remaining = Math.max(0, totalValue - previouslyPaid);

    let creditApplied = 0;
    let creditGenerated = 0;
    if (txn.vendorId) {
      await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${txn.vendorId} FOR UPDATE`;
      const vendor = await tx.vendor.findUnique({
        where: { id: txn.vendorId },
        select: { creditBalance: true },
      });
      const availableCredit = vendor?.creditBalance ?? 0;
      const requestedCredit = Math.max(0, data.creditApplied ?? 0);
      creditApplied = Math.min(
        requestedCredit,
        availableCredit,
        Math.max(0, remaining - data.amount)
      );
    }

    const effectiveSettled = data.amount + creditApplied;
    if (effectiveSettled > remaining + 0.01) {
      creditGenerated = effectiveSettled - remaining;
    }

    if (data.paymentMode === 'BOTH') {
      const cash = data.cashAmount ?? 0;
      const neft = data.neftAmount ?? 0;
      if (Math.abs(cash + neft - data.amount) > 0.01) {
        throw new ApiError(
          400,
          `Cash (${cash}) + NEFT (${neft}) must equal settlement amount (${data.amount})`
        );
      }
    }

    const neftDateObj = data.neftDate ? new Date(data.neftDate) : undefined;

    await tx.realStonePayment.create({
      data: {
        transactionId,
        amount: data.amount,
        paymentMode: data.paymentMode,
        cashAmount: data.paymentMode === 'BOTH' ? data.cashAmount : undefined,
        neftAmount: data.paymentMode === 'BOTH' ? data.neftAmount : undefined,
        neftUtr: data.neftUtr || undefined,
        neftBank: data.neftBank || undefined,
        neftDate: neftDateObj,
        notes: data.notes || undefined,
        recordedById: userId,
        creditApplied: creditApplied > 0 ? creditApplied : undefined,
        creditGenerated: creditGenerated > 0 ? creditGenerated : undefined,
      },
    });

    const newAmountPaid = Math.min(totalValue, previouslyPaid + effectiveSettled);
    const newStatus = newAmountPaid + 0.01 >= totalValue ? 'COMPLETE' : 'HALF';

    if (txn.vendorId && creditApplied - creditGenerated !== 0) {
      const balanceDelta = creditGenerated - creditApplied;
      await tx.vendor.update({
        where: { id: txn.vendorId },
        data: { creditBalance: { increment: balanceDelta } },
      });
    }

    return tx.realStoneTransaction.update({
      where: { id: transactionId },
      data: { amountPaid: newAmountPaid, paymentStatus: newStatus },
      include: {
        stone: true,
        vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
        payments: {
          include: { recordedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { recordedAt: 'desc' },
        },
      },
    });
  });

  logger.info('Real stone payment settled', {
    transactionId,
    userId,
    amount: data.amount,
    newStatus: result.paymentStatus,
  });
  return result;
}

export async function getRealStonePayments(transactionId: string) {
  const exists = await prisma.realStoneTransaction.findUnique({
    where: { id: transactionId },
    select: { id: true },
  });
  if (!exists) {
    throw new ApiError(404, 'Real stone transaction not found', true, 'NOT_FOUND');
  }
  return prisma.realStonePayment.findMany({
    where: { transactionId },
    include: { recordedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { recordedAt: 'desc' },
  });
}

// ============================================================================
// REAL STONE — XLSX EXPORT
// ============================================================================

export async function exportRealStoneTransactions(filters: {
  transactionType?: string;
  vendorId?: string;
  startDate?: Date;
  endDate?: Date;
  taxClass?: 'BILLABLE' | 'NON_BILLABLE';
}): Promise<Buffer> {
  const where: any = {};
  if (filters.transactionType) where.transactionType = filters.transactionType;
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  if (filters.taxClass === 'BILLABLE') where.isBillable = true;
  if (filters.taxClass === 'NON_BILLABLE') where.isBillable = { not: true };

  const transactions = await prisma.realStoneTransaction.findMany({
    where,
    include: {
      stone: { select: { stockNumber: true, stoneType: true, shape: true, color: true, clarity: true } },
      vendor: { select: { name: true, uniqueCode: true, gstNumber: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const fmt = (n: number | null | undefined) => (n == null ? '' : Number(n.toFixed(2)));
  const rows = transactions.map((t) => ({
    Date: t.createdAt.toISOString().split('T')[0],
    Type: t.transactionType,
    'Tax Class': t.isBillable === true ? 'Billable' : 'Non-Billable',
    'Stock #': t.stone?.stockNumber ?? '',
    'Stone Type': t.stone?.stoneType ?? '',
    Shape: t.stone?.shape ?? '',
    Color: t.stone?.color ?? '',
    Clarity: t.stone?.clarity ?? '',
    'Carat Wt': fmt(t.caratWeight),
    '₹/Carat': fmt(t.pricePerCarat),
    'Total Value (₹)': fmt(t.totalValue),
    'Amount Paid (₹)': fmt(t.amountPaid),
    'Balance (₹)':
      t.totalValue != null && t.amountPaid != null
        ? fmt(Math.max(0, t.totalValue - t.amountPaid))
        : '',
    'Payment Mode': t.paymentMode ?? '',
    'Payment Status': t.paymentStatus ?? '',
    'Cash (₹)': fmt(t.cashAmount),
    'NEFT (₹)': fmt(t.neftAmount),
    'NEFT UTR': t.neftUtr ?? '',
    'NEFT Bank': t.neftBank ?? '',
    'Credit Applied (₹)': fmt(t.creditApplied),
    'Credit Generated (₹)': fmt(t.creditGenerated),
    Vendor: t.vendor?.name ?? '',
    'Vendor Code': t.vendor?.uniqueCode ?? '',
    GSTIN: t.vendor?.gstNumber ?? '',
    Reference: t.referenceNumber ?? '',
    Notes: t.notes ?? '',
    'Recorded By': t.createdBy?.name ?? '',
  }));

  const billable = rows.filter((r) => r['Tax Class'] === 'Billable');
  const nonBillable = rows.filter((r) => r['Tax Class'] === 'Non-Billable');

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'All Transactions');
  if (billable.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(billable), 'Billable');
  }
  if (nonBillable.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(nonBillable), 'Non-Billable');
  }
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

// ============================================================================
// REAL STONE — RATES
// ============================================================================

/** Latest rate per (stoneType, quality, caratFrom). */
export async function getCurrentRealStoneRates() {
  return prisma.realStoneRate.findMany({
    distinct: ['stoneType', 'quality', 'caratFrom'],
    orderBy: [
      { stoneType: 'asc' },
      { quality: 'asc' },
      { caratFrom: 'asc' },
      { effectiveDate: 'desc' },
    ],
    include: { createdBy: { select: { name: true } } },
  });
}

export async function createRealStoneRate(data: CreateRealStoneRateRequest, createdById: string) {
  return prisma.realStoneRate.create({
    data: {
      stoneType: data.stoneType,
      quality: data.quality,
      caratFrom: data.caratFrom,
      caratTo: data.caratTo,
      pricePerCarat: data.pricePerCarat,
      effectiveDate: data.effectiveDate,
      source: data.source,
      createdById,
    },
  });
}

export async function lookupRealStoneRate(args: {
  stoneType: RealStoneType;
  quality?: string | null;
  caratWeight: number;
}) {
  return prisma.realStoneRate.findFirst({
    where: {
      stoneType: args.stoneType,
      ...(args.quality ? { quality: args.quality } : {}),
      caratFrom: { lte: args.caratWeight },
      caratTo: { gte: args.caratWeight },
    },
    orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function valueRealStone(stone: {
  stoneType: RealStoneType;
  quality?: string | null;
  caratWeight: number;
  pricePerCarat: number | null;
}) {
  const rate = await lookupRealStoneRate(stone);
  const ppc = rate?.pricePerCarat ?? stone.pricePerCarat ?? 0;
  return {
    pricePerCarat: ppc,
    totalValue: ppc * stone.caratWeight,
    rateSource: rate ? 'rate-band' : stone.pricePerCarat ? 'row' : 'none',
    rateId: rate?.id ?? null,
  };
}

// ============================================================================
// REAL STONE — STOCK SUMMARY
// ============================================================================

export async function getRealStoneStockSummary(): Promise<RealStoneStockSummary> {
  const inStock = await prisma.realStone.findMany({
    where: { status: 'IN_STOCK' },
    select: {
      stoneType: true,
      clarity: true,
      caratWeight: true,
      pricePerCarat: true,
    },
  });

  const valueOf = (d: { caratWeight: number; pricePerCarat: number | null }) =>
    (d.pricePerCarat ?? 0) * d.caratWeight;

  const totalStones = inStock.length;
  const totalCarats = inStock.reduce((s, d) => s + d.caratWeight, 0);
  const totalValue = inStock.reduce((s, d) => s + valueOf(d), 0);

  const typeMap = new Map<RealStoneType, { count: number; carats: number; value: number }>();
  for (const d of inStock) {
    const cur = typeMap.get(d.stoneType) ?? { count: 0, carats: 0, value: 0 };
    cur.count += 1;
    cur.carats += d.caratWeight;
    cur.value += valueOf(d);
    typeMap.set(d.stoneType, cur);
  }

  const qualityMap = new Map<string, { count: number; carats: number; value: number }>();
  for (const d of inStock) {
    const key = d.clarity ?? 'UNSPECIFIED';
    const cur = qualityMap.get(key) ?? { count: 0, carats: 0, value: 0 };
    cur.count += 1;
    cur.carats += d.caratWeight;
    cur.value += valueOf(d);
    qualityMap.set(key, cur);
  }

  return {
    totalStones,
    totalCarats,
    totalValue,
    byStoneType: Array.from(typeMap.entries()).map(([stoneType, v]) => ({ stoneType, ...v })),
    byQuality: Array.from(qualityMap.entries()).map(([quality, v]) => ({ quality, ...v })),
  };
}

// ============================================================================
// STONE PACKET — READS
// ============================================================================

export async function getAllStonePackets(filters?: {
  stoneType?: SyntheticStoneType;
  size?: string;
}) {
  const where: any = {};
  if (filters?.stoneType) where.stoneType = filters.stoneType;
  if (filters?.size) where.size = filters.size;
  return prisma.stonePacket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getStonePacketById(packetId: string) {
  return prisma.stonePacket.findUnique({
    where: { id: packetId },
    include: {
      transactions: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/** Low-stock query: packets where currentWeight <= reorderLevel. */
export async function getLowStockStonePackets() {
  return prisma.$queryRaw<Array<{
    id: string;
    packet_number: string;
    stone_type: string;
    size: string;
    color: string;
    current_weight: number;
    reorder_level: number | null;
    unit: string;
  }>>`
    SELECT id, packet_number, stone_type, size, color, current_weight, reorder_level, unit
      FROM stone_packets
     WHERE reorder_level IS NOT NULL AND current_weight <= reorder_level
     ORDER BY (current_weight / NULLIF(reorder_level, 0)) ASC
  `;
}

// ============================================================================
// STONE PACKET — PURCHASE
// ============================================================================

/** Legacy single-packet create — wraps into createStonePacketPurchase. */
export async function createStonePacket(data: CreateStonePacketRequest, createdById: string) {
  const result = await createStonePacketPurchase(
    { transactionType: 'PURCHASE', items: [data] },
    createdById
  );
  return result[0]?.packet;
}

export async function createStonePacketPurchase(
  data: CreateStonePacketPurchaseRequest,
  createdById: string
) {
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new ApiError(400, 'PURCHASE requires at least one item');
  }
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;

  const result = await prisma.$transaction(async (tx) => {
    let availableCredit = 0;
    if (data.vendorId) {
      await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${data.vendorId} FOR UPDATE`;
      const vendor = await tx.vendor.findUnique({
        where: { id: data.vendorId },
        select: { creditBalance: true },
      });
      availableCredit = vendor?.creditBalance ?? 0;
    }

    const created: any[] = [];
    let runningBalanceDelta = 0;
    const stamp = tsStamp();

    for (let idx = 0; idx < data.items.length; idx++) {
      const item = data.items[idx];
      const totalValue = item.pricePerUnit ? item.totalWeight * item.pricePerUnit : 0;
      const unit = item.unit ?? 'CARAT';
      const packetNumber =
        item.packetNumber && String(item.packetNumber).trim().length > 0
          ? item.packetNumber
          : `PKT-${stamp}-${String(idx + 1).padStart(3, '0')}`;

      const packet = await tx.stonePacket.create({
        data: {
          packetNumber,
          stoneType: item.stoneType,
          shape: item.shape,
          size: item.size,
          color: item.color,
          quality: item.quality,
          totalPieces: item.totalPieces,
          totalWeight: item.totalWeight,
          unit,
          currentPieces: item.totalPieces,
          currentWeight: item.totalWeight,
          pricePerUnit: item.pricePerUnit,
          reorderLevel: item.reorderLevel,
        },
      });

      let billing = {
        creditApplied: 0,
        creditGenerated: 0,
        cachedAmountPaid: item.amountPaid ?? 0,
        cachedStatus: 'PENDING' as 'COMPLETE' | 'HALF' | 'PENDING',
        balanceDelta: 0,
      };
      if (data.vendorId && totalValue > 0) {
        billing = applyCreditMath(
          totalValue,
          item.amountPaid ?? 0,
          item.creditApplied ?? 0,
          availableCredit
        );
        availableCredit = Math.max(
          0,
          availableCredit - billing.creditApplied + billing.creditGenerated
        );
        runningBalanceDelta += billing.balanceDelta;
      }

      const neftDate = item.neftDate ? new Date(item.neftDate) : undefined;
      const transaction = await tx.stonePacketTransaction.create({
        data: {
          packetId: packet.id,
          transactionType: 'PURCHASE',
          quantity: item.totalWeight,
          unit,
          vendorId: data.vendorId,
          referenceNumber: data.referenceNumber,
          notes: data.notes ?? undefined,
          createdById,
          ...(txnDate ? { createdAt: txnDate } : {}),
          pricePerUnit: item.pricePerUnit,
          totalValue: totalValue || undefined,
          isBillable: item.isBillable,
          paymentMode: item.paymentMode,
          paymentStatus: billing.cachedStatus,
          amountPaid: billing.cachedAmountPaid,
          cashAmount: item.cashAmount,
          neftAmount: item.neftAmount,
          neftUtr: item.neftUtr || undefined,
          neftBank: item.neftBank || undefined,
          neftDate,
          creditApplied: billing.creditApplied > 0 ? billing.creditApplied : undefined,
          creditGenerated: billing.creditGenerated > 0 ? billing.creditGenerated : undefined,
        },
        include: {
          packet: true,
          vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
        },
      });
      created.push(transaction);
    }

    if (data.vendorId && runningBalanceDelta !== 0) {
      await tx.vendor.update({
        where: { id: data.vendorId },
        data: { creditBalance: { increment: runningBalanceDelta } },
      });
    }

    return created;
  });

  logger.info('Stone packet purchase created', {
    items: result.length,
    vendorId: data.vendorId,
    referenceNumber: data.referenceNumber,
  });
  return result;
}

// ============================================================================
// STONE PACKET — MOVEMENTS
// ============================================================================

/**
 * Issue weight from a packet. Decrements currentWeight (always) and
 * currentPieces proportionally when totalPieces is known.
 *   issuedPieces = floor(quantity / totalWeight * totalPieces)
 */
export async function issueStonePacket(data: IssueStonePacketRequest, createdById: string) {
  if (data.quantity == null || data.quantity <= 0) {
    throw new ApiError(400, 'quantity must be > 0');
  }
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM stone_packets WHERE id = ${data.packetId} FOR UPDATE`;
    const packet = await tx.stonePacket.findUnique({ where: { id: data.packetId } });
    if (!packet) throw new ApiError(404, 'Stone packet not found');

    if (packet.currentWeight + 0.0001 < data.quantity) {
      throw new ApiError(
        400,
        `Cannot issue ${data.quantity}${packet.unit} — only ${packet.currentWeight}${packet.unit} in stock`
      );
    }

    const newWeight = Math.max(0, packet.currentWeight - data.quantity);
    let newPieces = packet.currentPieces ?? null;
    let issuedPieces: number | null = null;
    if (packet.totalPieces != null && packet.totalWeight > 0) {
      issuedPieces = Math.floor((data.quantity / packet.totalWeight) * packet.totalPieces);
      const cur = packet.currentPieces ?? packet.totalPieces;
      newPieces = Math.max(0, cur - issuedPieces);
    }

    await tx.stonePacket.update({
      where: { id: packet.id },
      data: { currentWeight: newWeight, currentPieces: newPieces },
    });

    const totalValue = packet.pricePerUnit ? packet.pricePerUnit * data.quantity : undefined;

    return tx.stonePacketTransaction.create({
      data: {
        packetId: packet.id,
        transactionType: 'ISSUE_TO_DEPARTMENT',
        quantity: data.quantity,
        unit: data.unit ?? packet.unit,
        orderId: data.orderId,
        departmentId: data.departmentId,
        workerId: data.workerId,
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
        pricePerUnit: packet.pricePerUnit,
        totalValue,
      },
      include: { packet: true, createdBy: { select: { name: true, email: true } } },
    });
  });

  logger.info('Stone packet issued', { packetId: data.packetId, quantity: data.quantity });
  return result;
}

export async function transferStonePacket(data: TransferStonePacketRequest, createdById: string) {
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM stone_packets WHERE id = ${data.packetId} FOR UPDATE`;
    const packet = await tx.stonePacket.findUnique({ where: { id: data.packetId } });
    if (!packet) throw new ApiError(404, 'Stone packet not found');

    return tx.stonePacketTransaction.create({
      data: {
        packetId: data.packetId,
        transactionType: 'TRANSFER',
        quantity: packet.currentWeight,
        unit: packet.unit,
        fromLocation: data.fromLocation,
        toLocation: data.toLocation,
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
      },
      include: { packet: true },
    });
  });
  logger.info('Stone packet transferred', { packetId: data.packetId, to: data.toLocation });
  return result;
}

export async function adjustStonePacket(data: AdjustStonePacketRequest, createdById: string) {
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM stone_packets WHERE id = ${data.packetId} FOR UPDATE`;
    const packet = await tx.stonePacket.findUnique({ where: { id: data.packetId } });
    if (!packet) throw new ApiError(404, 'Stone packet not found');

    const newWeight = Math.max(0, packet.currentWeight + (data.deltaWeight ?? 0));
    const newPieces =
      packet.currentPieces != null
        ? Math.max(0, packet.currentPieces + (data.deltaPieces ?? 0))
        : packet.currentPieces;

    await tx.stonePacket.update({
      where: { id: packet.id },
      data: { currentWeight: newWeight, currentPieces: newPieces },
    });

    return tx.stonePacketTransaction.create({
      data: {
        packetId: data.packetId,
        transactionType: 'ADJUSTMENT',
        quantity: data.deltaWeight ?? 0,
        unit: packet.unit,
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
      },
      include: { packet: true },
    });
  });
  logger.info('Stone packet adjusted', { packetId: data.packetId });
  return result;
}

export async function returnStonePacketFromDepartment(
  data: ReturnStonePacketFromDepartmentRequest,
  createdById: string
) {
  if (data.quantity == null || data.quantity <= 0) {
    throw new ApiError(400, 'quantity must be > 0');
  }
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM stone_packets WHERE id = ${data.packetId} FOR UPDATE`;
    const packet = await tx.stonePacket.findUnique({ where: { id: data.packetId } });
    if (!packet) throw new ApiError(404, 'Stone packet not found');

    const newWeight = packet.currentWeight + data.quantity;
    let newPieces = packet.currentPieces ?? null;
    if (packet.totalPieces != null && packet.totalWeight > 0) {
      const returnedPieces = Math.floor((data.quantity / packet.totalWeight) * packet.totalPieces);
      newPieces = (packet.currentPieces ?? 0) + returnedPieces;
    }

    await tx.stonePacket.update({
      where: { id: packet.id },
      data: { currentWeight: newWeight, currentPieces: newPieces },
    });

    return tx.stonePacketTransaction.create({
      data: {
        packetId: data.packetId,
        transactionType: 'RETURN_FROM_DEPARTMENT',
        quantity: data.quantity,
        unit: data.unit ?? packet.unit,
        orderId: data.orderId,
        departmentId: data.departmentId,
        workerId: data.workerId,
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
      },
      include: { packet: true },
    });
  });
  logger.info('Stone packet returned from department', { packetId: data.packetId });
  return result;
}

// ============================================================================
// STONE PACKET — TRANSACTIONS LIST / EDIT / DELETE
// ============================================================================

export async function getAllStonePacketTransactions(filters?: {
  transactionType?: string;
  vendorId?: string;
  isBillable?: boolean;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};
  if (filters?.transactionType) where.transactionType = filters.transactionType;
  if (filters?.vendorId) where.vendorId = filters.vendorId;
  if (filters?.isBillable !== undefined) where.isBillable = filters.isBillable;
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  return prisma.stonePacketTransaction.findMany({
    where,
    include: {
      packet: { select: { id: true, packetNumber: true, stoneType: true, size: true, color: true, unit: true } },
      vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function updateStonePacketTransaction(
  id: string,
  data: UpdateStonePacketTransactionRequest
) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.stonePacketTransaction.findUnique({
      where: { id },
      include: { payments: { select: { id: true } } },
    });
    if (!old) throw new ApiError(404, 'Stone packet transaction not found');
    if (old.payments.length > 0) {
      throw new ApiError(
        400,
        'Cannot edit a transaction that has settlement entries. Reconcile/void the settlements first.'
      );
    }

    const isPurchase = old.transactionType === 'PURCHASE';
    const newVendorId = data.vendorId !== undefined ? data.vendorId : old.vendorId;
    const newPpu = data.pricePerUnit ?? old.pricePerUnit ?? null;
    const newTotalValue = newPpu && old.quantity ? newPpu * old.quantity : old.totalValue;

    if (isPurchase && old.vendorId) {
      const oldDelta = (old.creditGenerated ?? 0) - (old.creditApplied ?? 0);
      if (oldDelta !== 0) {
        await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${old.vendorId} FOR UPDATE`;
        await tx.vendor.update({
          where: { id: old.vendorId },
          data: { creditBalance: { increment: -oldDelta } },
        });
      }
    }

    let creditApplied = 0;
    let creditGenerated = 0;
    let cachedAmountPaid = data.amountPaid ?? old.amountPaid ?? 0;
    let cachedStatus: string | null | undefined = data.paymentStatus ?? old.paymentStatus;
    if (isPurchase && newVendorId && newTotalValue && newTotalValue > 0) {
      await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${newVendorId} FOR UPDATE`;
      const vendor = await tx.vendor.findUnique({
        where: { id: newVendorId },
        select: { creditBalance: true },
      });
      const math = applyCreditMath(
        newTotalValue,
        data.amountPaid ?? old.amountPaid ?? 0,
        data.creditApplied ?? old.creditApplied ?? 0,
        vendor?.creditBalance ?? 0
      );
      creditApplied = math.creditApplied;
      creditGenerated = math.creditGenerated;
      cachedAmountPaid = math.cachedAmountPaid;
      cachedStatus = math.cachedStatus;
      if (math.balanceDelta !== 0) {
        await tx.vendor.update({
          where: { id: newVendorId },
          data: { creditBalance: { increment: math.balanceDelta } },
        });
      }
    }

    const neftDate = data.neftDate ? new Date(data.neftDate) : undefined;
    const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;

    const updated = await tx.stonePacketTransaction.update({
      where: { id },
      data: {
        vendorId: newVendorId,
        referenceNumber: data.referenceNumber !== undefined ? data.referenceNumber : old.referenceNumber,
        notes: data.notes !== undefined ? data.notes : old.notes,
        pricePerUnit: newPpu,
        totalValue: newTotalValue,
        ...(txnDate ? { createdAt: txnDate } : {}),
        isBillable: data.isBillable !== undefined ? data.isBillable : old.isBillable,
        paymentMode: isPurchase ? data.paymentMode ?? old.paymentMode : null,
        paymentStatus: isPurchase ? cachedStatus : null,
        amountPaid: isPurchase ? cachedAmountPaid : null,
        cashAmount: isPurchase ? (data.cashAmount !== undefined ? data.cashAmount : old.cashAmount) : null,
        neftAmount: isPurchase ? (data.neftAmount !== undefined ? data.neftAmount : old.neftAmount) : null,
        neftUtr: isPurchase ? (data.neftUtr !== undefined ? data.neftUtr || null : old.neftUtr) : null,
        neftBank: isPurchase ? (data.neftBank !== undefined ? data.neftBank || null : old.neftBank) : null,
        neftDate: isPurchase ? (data.neftDate !== undefined ? neftDate ?? null : old.neftDate) : null,
        creditApplied: isPurchase && creditApplied > 0 ? creditApplied : null,
        creditGenerated: isPurchase && creditGenerated > 0 ? creditGenerated : null,
      },
      include: {
        packet: true,
        vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
      },
    });
    logger.info('Stone packet transaction updated', { transactionId: id });
    return updated;
  });
}

export async function deleteStonePacketTransaction(id: string) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.stonePacketTransaction.findUnique({
      where: { id },
      include: { payments: { select: { id: true } }, packet: true },
    });
    if (!old) throw new ApiError(404, 'Stone packet transaction not found');
    if (old.payments.length > 0) {
      throw new ApiError(
        400,
        'Cannot delete a transaction that has settlement entries. Reconcile/void the settlements first.'
      );
    }
    if (old.transactionType === 'PURCHASE') {
      throw new ApiError(
        400,
        'Cannot delete a PURCHASE transaction directly. Delete the packet instead, which cascades.'
      );
    }

    if (old.vendorId) {
      const oldDelta = (old.creditGenerated ?? 0) - (old.creditApplied ?? 0);
      if (oldDelta !== 0) {
        await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${old.vendorId} FOR UPDATE`;
        await tx.vendor.update({
          where: { id: old.vendorId },
          data: { creditBalance: { increment: -oldDelta } },
        });
      }
    }

    // Reverse stock effects.
    await tx.$queryRaw`SELECT id FROM stone_packets WHERE id = ${old.packetId} FOR UPDATE`;
    const packet = await tx.stonePacket.findUnique({ where: { id: old.packetId } });
    if (packet) {
      if (old.transactionType === 'ISSUE_TO_DEPARTMENT') {
        const newWeight = packet.currentWeight + old.quantity;
        let newPieces = packet.currentPieces ?? null;
        if (packet.totalPieces != null && packet.totalWeight > 0) {
          const returnedPieces = Math.floor((old.quantity / packet.totalWeight) * packet.totalPieces);
          newPieces = (packet.currentPieces ?? 0) + returnedPieces;
        }
        await tx.stonePacket.update({
          where: { id: packet.id },
          data: { currentWeight: newWeight, currentPieces: newPieces },
        });
      } else if (old.transactionType === 'RETURN_FROM_DEPARTMENT') {
        const newWeight = Math.max(0, packet.currentWeight - old.quantity);
        let newPieces = packet.currentPieces ?? null;
        if (packet.totalPieces != null && packet.totalWeight > 0) {
          const removedPieces = Math.floor((old.quantity / packet.totalWeight) * packet.totalPieces);
          newPieces = Math.max(0, (packet.currentPieces ?? 0) - removedPieces);
        }
        await tx.stonePacket.update({
          where: { id: packet.id },
          data: { currentWeight: newWeight, currentPieces: newPieces },
        });
      } else if (old.transactionType === 'ADJUSTMENT') {
        await tx.stonePacket.update({
          where: { id: packet.id },
          data: { currentWeight: Math.max(0, packet.currentWeight - old.quantity) },
        });
      }
    }

    await tx.stonePacketTransaction.delete({ where: { id } });
    logger.info('Stone packet transaction deleted', { transactionId: id });
    return { id };
  });
}

// ============================================================================
// STONE PACKET — PAYMENT SETTLEMENT
// ============================================================================

export async function settleStonePacketPayment(
  transactionId: string,
  data: SettleStonePacketPaymentRequest,
  userId: string
) {
  if (data.amount == null || data.amount < 0) {
    throw new ApiError(400, 'Settlement amount must be 0 or greater');
  }
  if (!data.paymentMode) {
    throw new ApiError(400, 'paymentMode is required');
  }
  if ((data.amount ?? 0) <= 0 && (data.creditApplied ?? 0) <= 0) {
    throw new ApiError(400, 'Either settlement amount or credit applied must be greater than 0');
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM stone_packet_transactions WHERE id = ${transactionId} FOR UPDATE`;
    const txn = await tx.stonePacketTransaction.findUnique({
      where: { id: transactionId },
      include: { payments: true },
    });
    if (!txn) throw new ApiError(404, 'Stone packet transaction not found', true, 'NOT_FOUND');
    if (txn.transactionType !== 'PURCHASE') {
      throw new ApiError(400, 'Only purchases can be settled');
    }

    const totalValue = txn.totalValue ?? 0;
    const ledgerSum = txn.payments.reduce((s, p) => s + p.amount, 0);
    const previouslyPaid = Math.max(ledgerSum, txn.amountPaid ?? 0);
    const remaining = Math.max(0, totalValue - previouslyPaid);

    let creditApplied = 0;
    let creditGenerated = 0;
    if (txn.vendorId) {
      await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${txn.vendorId} FOR UPDATE`;
      const vendor = await tx.vendor.findUnique({
        where: { id: txn.vendorId },
        select: { creditBalance: true },
      });
      const availableCredit = vendor?.creditBalance ?? 0;
      const requestedCredit = Math.max(0, data.creditApplied ?? 0);
      creditApplied = Math.min(
        requestedCredit,
        availableCredit,
        Math.max(0, remaining - data.amount)
      );
    }

    const effectiveSettled = data.amount + creditApplied;
    if (effectiveSettled > remaining + 0.01) {
      creditGenerated = effectiveSettled - remaining;
    }

    if (data.paymentMode === 'BOTH') {
      const cash = data.cashAmount ?? 0;
      const neft = data.neftAmount ?? 0;
      if (Math.abs(cash + neft - data.amount) > 0.01) {
        throw new ApiError(
          400,
          `Cash (${cash}) + NEFT (${neft}) must equal settlement amount (${data.amount})`
        );
      }
    }

    const neftDateObj = data.neftDate ? new Date(data.neftDate) : undefined;

    await tx.stonePacketPayment.create({
      data: {
        transactionId,
        amount: data.amount,
        paymentMode: data.paymentMode,
        cashAmount: data.paymentMode === 'BOTH' ? data.cashAmount : undefined,
        neftAmount: data.paymentMode === 'BOTH' ? data.neftAmount : undefined,
        neftUtr: data.neftUtr || undefined,
        neftBank: data.neftBank || undefined,
        neftDate: neftDateObj,
        notes: data.notes || undefined,
        recordedById: userId,
        creditApplied: creditApplied > 0 ? creditApplied : undefined,
        creditGenerated: creditGenerated > 0 ? creditGenerated : undefined,
      },
    });

    const newAmountPaid = Math.min(totalValue, previouslyPaid + effectiveSettled);
    const newStatus = newAmountPaid + 0.01 >= totalValue ? 'COMPLETE' : 'HALF';

    if (txn.vendorId && creditApplied - creditGenerated !== 0) {
      const balanceDelta = creditGenerated - creditApplied;
      await tx.vendor.update({
        where: { id: txn.vendorId },
        data: { creditBalance: { increment: balanceDelta } },
      });
    }

    return tx.stonePacketTransaction.update({
      where: { id: transactionId },
      data: { amountPaid: newAmountPaid, paymentStatus: newStatus },
      include: {
        packet: true,
        vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
        payments: {
          include: { recordedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { recordedAt: 'desc' },
        },
      },
    });
  });

  logger.info('Stone packet payment settled', {
    transactionId,
    userId,
    amount: data.amount,
    newStatus: result.paymentStatus,
  });
  return result;
}

export async function getStonePacketPayments(transactionId: string) {
  const exists = await prisma.stonePacketTransaction.findUnique({
    where: { id: transactionId },
    select: { id: true },
  });
  if (!exists) {
    throw new ApiError(404, 'Stone packet transaction not found', true, 'NOT_FOUND');
  }
  return prisma.stonePacketPayment.findMany({
    where: { transactionId },
    include: { recordedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { recordedAt: 'desc' },
  });
}

// ============================================================================
// STONE PACKET — XLSX EXPORT
// ============================================================================

export async function exportStonePacketTransactions(filters: {
  transactionType?: string;
  vendorId?: string;
  startDate?: Date;
  endDate?: Date;
  taxClass?: 'BILLABLE' | 'NON_BILLABLE';
}): Promise<Buffer> {
  const where: any = {};
  if (filters.transactionType) where.transactionType = filters.transactionType;
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  if (filters.taxClass === 'BILLABLE') where.isBillable = true;
  if (filters.taxClass === 'NON_BILLABLE') where.isBillable = { not: true };

  const transactions = await prisma.stonePacketTransaction.findMany({
    where,
    include: {
      packet: { select: { packetNumber: true, stoneType: true, shape: true, size: true, color: true, quality: true } },
      vendor: { select: { name: true, uniqueCode: true, gstNumber: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const fmt = (n: number | null | undefined) => (n == null ? '' : Number(n.toFixed(2)));
  const rows = transactions.map((t) => ({
    Date: t.createdAt.toISOString().split('T')[0],
    Type: t.transactionType,
    'Tax Class': t.isBillable === true ? 'Billable' : 'Non-Billable',
    'Packet #': t.packet?.packetNumber ?? '',
    'Stone Type': t.packet?.stoneType ?? '',
    Shape: t.packet?.shape ?? '',
    Size: t.packet?.size ?? '',
    Color: t.packet?.color ?? '',
    Quality: t.packet?.quality ?? '',
    Quantity: fmt(t.quantity),
    Unit: t.unit ?? '',
    '₹/Unit': fmt(t.pricePerUnit),
    'Total Value (₹)': fmt(t.totalValue),
    'Amount Paid (₹)': fmt(t.amountPaid),
    'Balance (₹)':
      t.totalValue != null && t.amountPaid != null
        ? fmt(Math.max(0, t.totalValue - t.amountPaid))
        : '',
    'Payment Mode': t.paymentMode ?? '',
    'Payment Status': t.paymentStatus ?? '',
    'Cash (₹)': fmt(t.cashAmount),
    'NEFT (₹)': fmt(t.neftAmount),
    'NEFT UTR': t.neftUtr ?? '',
    'NEFT Bank': t.neftBank ?? '',
    'Credit Applied (₹)': fmt(t.creditApplied),
    'Credit Generated (₹)': fmt(t.creditGenerated),
    Vendor: t.vendor?.name ?? '',
    'Vendor Code': t.vendor?.uniqueCode ?? '',
    GSTIN: t.vendor?.gstNumber ?? '',
    Reference: t.referenceNumber ?? '',
    Notes: t.notes ?? '',
    'Recorded By': t.createdBy?.name ?? '',
  }));

  const billable = rows.filter((r) => r['Tax Class'] === 'Billable');
  const nonBillable = rows.filter((r) => r['Tax Class'] === 'Non-Billable');

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'All Transactions');
  if (billable.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(billable), 'Billable');
  }
  if (nonBillable.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(nonBillable), 'Non-Billable');
  }
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

// ============================================================================
// STONE PACKET — STOCK SUMMARY
// ============================================================================

export async function getStonePacketStockSummary(): Promise<StonePacketStockSummary> {
  const all = await prisma.stonePacket.findMany({
    select: {
      stoneType: true,
      quality: true,
      currentPieces: true,
      currentWeight: true,
      pricePerUnit: true,
    },
  });

  const valueOf = (p: { currentWeight: number; pricePerUnit: number | null }) =>
    (p.pricePerUnit ?? 0) * p.currentWeight;

  const totalPackets = all.length;
  const totalPieces = all.reduce((s, p) => s + (p.currentPieces ?? 0), 0);
  const totalWeight = all.reduce((s, p) => s + p.currentWeight, 0);
  const totalValue = all.reduce((s, p) => s + valueOf(p), 0);

  const typeMap = new Map<SyntheticStoneType, { count: number; pieces: number; weight: number; value: number }>();
  for (const p of all) {
    const cur = typeMap.get(p.stoneType) ?? { count: 0, pieces: 0, weight: 0, value: 0 };
    cur.count += 1;
    cur.pieces += p.currentPieces ?? 0;
    cur.weight += p.currentWeight;
    cur.value += valueOf(p);
    typeMap.set(p.stoneType, cur);
  }

  const qualityMap = new Map<string, { count: number; pieces: number; weight: number; value: number }>();
  for (const p of all) {
    const key = p.quality ?? 'UNSPECIFIED';
    const cur = qualityMap.get(key) ?? { count: 0, pieces: 0, weight: 0, value: 0 };
    cur.count += 1;
    cur.pieces += p.currentPieces ?? 0;
    cur.weight += p.currentWeight;
    cur.value += valueOf(p);
    qualityMap.set(key, cur);
  }

  return {
    totalPackets,
    totalPieces,
    totalWeight,
    totalValue,
    byStoneType: Array.from(typeMap.entries()).map(([stoneType, v]) => ({ stoneType, ...v })),
    byQuality: Array.from(qualityMap.entries()).map(([quality, v]) => ({ quality, ...v })),
  };
}
