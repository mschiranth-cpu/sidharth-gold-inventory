/**
 * ============================================
 * METAL INVENTORY SERVICE
 * ============================================
 */

import { PrismaClient, MetalType, MetalForm, MetalTransactionType } from '@prisma/client';
import { logger } from '../../utils/logger';
import {
  CreateMetalStockRequest,
  CreateMetalTransactionRequest,
  CreateMeltingBatchRequest,
  CreateMetalRateRequest,
  MetalStockSummary,
} from './metal.types';

const prisma = new PrismaClient();

/**
 * Calculate pure weight from gross weight and purity
 */
function calculatePureWeight(grossWeight: number, purity: number): number {
  return (grossWeight * purity) / 24;
}

/**
 * Get all metal stock
 */
export async function getAllMetalStock(filters?: { metalType?: MetalType; purity?: number }) {
  const where: any = {};
  if (filters?.metalType) where.metalType = filters.metalType;
  if (filters?.purity) where.purity = filters.purity;

  return await prisma.metalStock.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get metal stock summary
 */
export async function getMetalStockSummary(): Promise<MetalStockSummary[]> {
  const stocks = await prisma.metalStock.findMany();

  const summary: Map<string, MetalStockSummary> = new Map();

  stocks.forEach((stock) => {
    const key = `${stock.metalType}-${stock.purity}`;
    const existing = summary.get(key);

    if (existing) {
      existing.totalGrossWeight += stock.grossWeight;
      existing.totalPureWeight += stock.pureWeight;
    } else {
      summary.set(key, {
        metalType: stock.metalType,
        purity: stock.purity,
        totalGrossWeight: stock.grossWeight,
        totalPureWeight: stock.pureWeight,
        totalValue: 0,
      });
    }
  });

  return Array.from(summary.values());
}

/**
 * Create metal stock entry
 */
export async function createMetalStock(data: CreateMetalStockRequest) {
  const pureWeight = calculatePureWeight(data.grossWeight, data.purity);

  return await prisma.metalStock.create({
    data: {
      metalType: data.metalType,
      purity: data.purity,
      form: data.form,
      grossWeight: data.grossWeight,
      pureWeight: pureWeight,
      location: data.location,
      batchNumber: data.batchNumber,
    },
  });
}

/**
 * Create metal transaction
 */
export async function createMetalTransaction(
  data: CreateMetalTransactionRequest,
  createdById: string
) {
  const pureWeight = calculatePureWeight(data.grossWeight, data.purity);
  const totalValue = data.rate ? data.grossWeight * data.rate : undefined;

  const transaction = await prisma.metalTransaction.create({
    data: {
      transactionType: data.transactionType,
      metalType: data.metalType,
      purity: data.purity,
      form: data.form,
      grossWeight: data.grossWeight,
      pureWeight: pureWeight,
      rate: data.rate,
      totalValue: totalValue,
      stockId: data.stockId,
      orderId: data.orderId,
      departmentId: data.departmentId,
      workerId: data.workerId,
      supplierId: data.supplierId,
      notes: data.notes,
      referenceNumber: data.referenceNumber,
      createdById: createdById,
    },
    include: {
      stock: true,
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Update stock if stockId provided
  if (data.stockId) {
    const stock = await prisma.metalStock.findUnique({ where: { id: data.stockId } });
    if (stock) {
      const weightChange =
        data.transactionType === 'PURCHASE' || data.transactionType === 'RETURN_FROM_DEPARTMENT'
          ? data.grossWeight
          : -data.grossWeight;

      await prisma.metalStock.update({
        where: { id: data.stockId },
        data: {
          grossWeight: stock.grossWeight + weightChange,
          pureWeight: stock.pureWeight + (weightChange * data.purity) / 24,
        },
      });
    }
  }

  logger.info('Metal transaction created', { transactionId: transaction.id });
  return transaction;
}

/**
 * Create melting batch
 */
export async function createMeltingBatch(data: CreateMeltingBatchRequest, meltedById: string) {
  const totalInputWeight = data.inputMetals.reduce((sum, m) => sum + m.weight, 0);
  const wastageWeight = totalInputWeight - data.outputWeight;
  const wastagePercent = (wastageWeight / totalInputWeight) * 100;

  const lastBatch = await prisma.meltingBatch.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { batchNumber: true },
  });

  const lastNumber = lastBatch?.batchNumber.match(/\d+$/)?.[0] || '0';
  const nextNumber = (parseInt(lastNumber) + 1).toString().padStart(5, '0');
  const batchNumber = `MELT-${new Date().getFullYear()}-${nextNumber}`;

  return await prisma.meltingBatch.create({
    data: {
      batchNumber,
      inputMetals: data.inputMetals,
      totalInputWeight,
      outputPurity: data.outputPurity,
      outputWeight: data.outputWeight,
      outputForm: data.outputForm,
      wastageWeight,
      wastagePercent,
      meltedById,
      meltedAt: new Date(),
      notes: data.notes,
    },
    include: {
      meltedBy: {
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Get all metal transactions
 */
export async function getAllMetalTransactions(filters?: {
  metalType?: MetalType;
  transactionType?: MetalTransactionType;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};

  if (filters?.metalType) where.metalType = filters.metalType;
  if (filters?.transactionType) where.transactionType = filters.transactionType;
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return await prisma.metalTransaction.findMany({
    where,
    include: {
      stock: true,
      createdBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

/**
 * Get current metal rates
 */
export async function getCurrentMetalRates() {
  const rates = await prisma.metalRate.findMany({
    orderBy: { effectiveDate: 'desc' },
    distinct: ['metalType', 'purity'],
  });

  return rates;
}

/**
 * Create metal rate
 */
export async function createMetalRate(data: CreateMetalRateRequest, createdById: string) {
  return await prisma.metalRate.create({
    data: {
      metalType: data.metalType,
      purity: data.purity,
      ratePerGram: data.ratePerGram,
      effectiveDate: data.effectiveDate,
      source: data.source,
      createdById,
    },
  });
}

/**
 * Get melting batches
 */
export async function getMeltingBatches() {
  return await prisma.meltingBatch.findMany({
    include: {
      meltedBy: {
        select: {
          name: true,
        },
      },
      transactions: true,
    },
    orderBy: { meltedAt: 'desc' },
    take: 50,
  });
}
