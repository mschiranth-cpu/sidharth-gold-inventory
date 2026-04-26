/**
 * ============================================
 * METAL INVENTORY SERVICE
 * ============================================
 */

import { PrismaClient, MetalType, MetalForm, MetalTransactionType } from '@prisma/client';
import { logger } from '../../utils/logger';
import { ApiError } from '../../middleware/errorHandler';
import {
  CreateMetalStockRequest,
  CreateMetalTransactionRequest,
  CreateMeltingBatchRequest,
  CreateMetalRateRequest,
  SettleMetalPaymentRequest,
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

  const stocks = await prisma.metalStock.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // For each stock row, find distinct vendors who contributed PURCHASE transactions
  const enriched = await Promise.all(
    stocks.map(async (stock) => {
      const vendors = await prisma.metalTransaction.findMany({
        where: {
          metalType: stock.metalType,
          purity: stock.purity,
          form: stock.form,
          transactionType: 'PURCHASE',
          vendorId: { not: null },
        },
        select: {
          vendor: { select: { id: true, name: true, uniqueCode: true } },
        },
        distinct: ['vendorId'],
      });
      return {
        ...stock,
        vendors: vendors.map((v) => v.vendor).filter(Boolean),
      };
    })
  );

  return enriched;
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
 * Create metal transaction.
 *
 * For billable PURCHASE rows we wrap everything in a $transaction with a
 * row-level lock on the vendor so credit balance updates are serialized:
 *   - Apply vendor credit (clamped to remaining balance and totalValue).
 *   - Park over-payments into vendor credit_balance.
 *   - Cache amount_paid + payment_status on the row.
 */
export async function createMetalTransaction(
  data: CreateMetalTransactionRequest,
  createdById: string
) {
  const pureWeight = calculatePureWeight(data.grossWeight, data.purity);
  // totalValue uses pureWeight (matches client-side totalPrice = (gross * purity / 24) * rate).
  // Previously this used grossWeight directly which mismatched the client display for non-24K purity.
  const totalValue = data.rate ? pureWeight * data.rate : undefined;

  const neftDate = data.neftDate ? new Date(data.neftDate) : undefined;
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const isBillablePurchase = data.transactionType === 'PURCHASE' && data.isBillable === true;

  const result = await prisma.$transaction(async (tx) => {
    // Vendor credit handling. Only relevant for billable PURCHASE rows that
    // have a vendor and a totalValue.
    let creditApplied = 0;
    let creditGenerated = 0;
    let effectivePaid = data.amountPaid ?? 0;
    let cachedAmountPaid = data.amountPaid ?? 0;
    let cachedStatus = data.paymentStatus;

    if (isBillablePurchase && data.vendorId && totalValue !== undefined) {
      // Lock the vendor row for the rest of this transaction so concurrent
      // receipts can't double-spend the same credit balance.
      await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${data.vendorId} FOR UPDATE`;
      const vendor = await tx.vendor.findUnique({
        where: { id: data.vendorId },
        select: { creditBalance: true },
      });
      const availableCredit = vendor?.creditBalance ?? 0;

      // 1. Apply credit (clamp to available + remaining-after-cash-paid).
      const requestedCredit = Math.max(0, data.creditApplied ?? 0);
      const remainingAfterPaid = Math.max(0, totalValue - (data.amountPaid ?? 0));
      creditApplied = Math.min(requestedCredit, availableCredit, remainingAfterPaid);

      // 2. effectivePaid = cash/NEFT actually entered + credit applied.
      effectivePaid = (data.amountPaid ?? 0) + creditApplied;

      // 3. Over-payment goes back into vendor credit.
      if (effectivePaid > totalValue + 0.01) {
        creditGenerated = effectivePaid - totalValue;
        cachedAmountPaid = totalValue; // cap the cached paid figure
      } else {
        cachedAmountPaid = effectivePaid;
      }

      // 4. Cached status — server overrides client when credit/over-payment changes the math.
      if (cachedAmountPaid + 0.01 >= totalValue) cachedStatus = 'COMPLETE';
      else if (cachedAmountPaid <= 0.01) cachedStatus = 'PENDING';
      else cachedStatus = 'HALF';

      // 5. Update vendor credit balance.
      const balanceDelta = creditGenerated - creditApplied;
      if (balanceDelta !== 0) {
        await tx.vendor.update({
          where: { id: data.vendorId },
          data: { creditBalance: { increment: balanceDelta } },
        });
      }
    }

    const transaction = await tx.metalTransaction.create({
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
        vendorId: data.vendorId,
        notes: data.notes,
        referenceNumber: data.referenceNumber,
        createdById: createdById,
        // Override createdAt only if the user picked a transaction date.
        ...(txnDate ? { createdAt: txnDate } : {}),
        // Payment fields. Only set when the caller explicitly sends isBillable.
        // ISSUE / RETURN / etc. (and any non-PURCHASE) leave these as NULL.
        isBillable: data.isBillable,
        paymentMode: isBillablePurchase ? data.paymentMode : undefined,
        paymentStatus: isBillablePurchase ? cachedStatus : undefined,
        amountPaid: isBillablePurchase ? cachedAmountPaid : undefined,
        cashAmount: isBillablePurchase ? data.cashAmount : undefined,
        neftAmount: isBillablePurchase ? data.neftAmount : undefined,
        neftUtr: isBillablePurchase ? data.neftUtr || undefined : undefined,
        neftBank: isBillablePurchase ? data.neftBank || undefined : undefined,
        neftDate: isBillablePurchase ? neftDate : undefined,
        creditApplied: isBillablePurchase && creditApplied > 0 ? creditApplied : undefined,
        creditGenerated:
          isBillablePurchase && creditGenerated > 0 ? creditGenerated : undefined,
      },
      include: {
        stock: true,
        vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    // Update or auto-create stock for this metal+purity+form combo.
    if (data.stockId) {
      // Explicit stockId — update that row.
      const stock = await tx.metalStock.findUnique({ where: { id: data.stockId } });
      if (stock) {
        const weightChange =
          data.transactionType === 'PURCHASE' || data.transactionType === 'RETURN_FROM_DEPARTMENT'
            ? data.grossWeight
            : -data.grossWeight;

        await tx.metalStock.update({
          where: { id: data.stockId },
          data: {
            grossWeight: stock.grossWeight + weightChange,
            pureWeight: stock.pureWeight + (weightChange * data.purity) / 24,
          },
        });
      }
    } else if (
      data.transactionType === 'PURCHASE' ||
      data.transactionType === 'RETURN_FROM_DEPARTMENT'
    ) {
      // No stockId — auto-upsert: find matching stock row by metal+purity+form,
      // create if it doesn't exist, increment weights.
      const existing = await tx.metalStock.findFirst({
        where: {
          metalType: data.metalType,
          purity: data.purity,
          form: data.form,
        },
      });
      if (existing) {
        await tx.metalStock.update({
          where: { id: existing.id },
          data: {
            grossWeight: existing.grossWeight + data.grossWeight,
            pureWeight: existing.pureWeight + pureWeight,
          },
        });
      } else {
        await tx.metalStock.create({
          data: {
            metalType: data.metalType,
            purity: data.purity,
            form: data.form,
            grossWeight: data.grossWeight,
            pureWeight: pureWeight,
          },
        });
      }
    }

    return transaction;
  });

  logger.info('Metal transaction created', {
    transactionId: result.id,
    creditApplied: result.creditApplied,
    creditGenerated: result.creditGenerated,
  });
  return result;
}

/**
 * Update an existing metal transaction.
 *
 * Reverses the OLD row's effects (stock + vendor credit) and re-applies the
 * NEW values inside one $transaction. Done this way so the same code paths
 * used at create time also drive edits — no second source of truth.
 *
 * Refused (use the dedicated flow):
 *   - Rows that already have settlement-ledger entries (`metal_payments`).
 *     Those settlements are append-only; reconcile/void them first.
 */
export async function updateMetalTransaction(
  id: string,
  data: import('./metal.types').UpdateMetalTransactionRequest
) {
  return await prisma.$transaction(async (tx) => {
    const old = await tx.metalTransaction.findUnique({
      where: { id },
      include: { payments: { select: { id: true } } },
    });
    if (!old) {
      throw new ApiError(404, 'Transaction not found');
    }
    if (old.payments && old.payments.length > 0) {
      throw new ApiError(
        400,
        'Cannot edit a transaction that has settlement entries. Reconcile/void the settlements first.'
      );
    }

    // ----- Merged "new" view of the row -----
    const newTxnType = data.transactionType ?? old.transactionType;
    const newMetal = data.metalType ?? old.metalType;
    const newPurity = data.purity ?? old.purity;
    const newForm = data.form ?? old.form;
    const newGross = data.grossWeight ?? old.grossWeight;
    const newRate = data.rate !== undefined ? data.rate : old.rate;
    const newPure = calculatePureWeight(newGross, newPurity);
    const newTotalValue = newRate ? newPure * newRate : null;
    const newVendorId =
      data.vendorId !== undefined ? data.vendorId : old.vendorId;
    const newIsBillable =
      data.isBillable !== undefined ? data.isBillable : old.isBillable;
    const isBillablePurchase =
      newTxnType === 'PURCHASE' && newIsBillable === true;

    // ===== 1. Reverse OLD vendor-credit effect =====
    // Original logic at create time:
    //   vendor.creditBalance += creditGenerated - creditApplied  (balanceDelta)
    // To reverse: subtract that same delta from the OLD vendor.
    if (
      old.transactionType === 'PURCHASE' &&
      old.isBillable === true &&
      old.vendorId
    ) {
      const oldDelta =
        (old.creditGenerated ?? 0) - (old.creditApplied ?? 0);
      if (oldDelta !== 0) {
        await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${old.vendorId} FOR UPDATE`;
        await tx.vendor.update({
          where: { id: old.vendorId },
          data: { creditBalance: { increment: -oldDelta } },
        });
      }
    }

    // ===== 2. Reverse OLD stock effect =====
    const isAdd = (t: string) =>
      t === 'PURCHASE' || t === 'RETURN_FROM_DEPARTMENT';

    const oldStock = await tx.metalStock.findFirst({
      where: { metalType: old.metalType, purity: old.purity, form: old.form },
    });
    if (oldStock) {
      const oldSign = isAdd(old.transactionType) ? -1 : 1; // reverse
      await tx.metalStock.update({
        where: { id: oldStock.id },
        data: {
          grossWeight: oldStock.grossWeight + oldSign * old.grossWeight,
          pureWeight: oldStock.pureWeight + oldSign * old.pureWeight,
        },
      });
    }

    // ===== 3. Apply NEW vendor-credit effect =====
    // Mirrors createMetalTransaction's credit logic exactly so behavior is
    // identical between Receive and Edit flows.
    let creditApplied = 0;
    let creditGenerated = 0;
    let cachedAmountPaid = data.amountPaid ?? 0;
    let cachedStatus: string | null | undefined =
      data.paymentStatus ?? old.paymentStatus;

    if (isBillablePurchase && newVendorId && newTotalValue !== null) {
      await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${newVendorId} FOR UPDATE`;
      const vendor = await tx.vendor.findUnique({
        where: { id: newVendorId },
        select: { creditBalance: true },
      });
      const availableCredit = vendor?.creditBalance ?? 0;

      const requestedCredit = Math.max(0, data.creditApplied ?? 0);
      const remainingAfterPaid = Math.max(0, newTotalValue - (data.amountPaid ?? 0));
      creditApplied = Math.min(requestedCredit, availableCredit, remainingAfterPaid);

      const effectivePaid = (data.amountPaid ?? 0) + creditApplied;

      if (effectivePaid > newTotalValue + 0.01) {
        creditGenerated = effectivePaid - newTotalValue;
        cachedAmountPaid = newTotalValue;
      } else {
        cachedAmountPaid = effectivePaid;
      }

      if (cachedAmountPaid + 0.01 >= newTotalValue) cachedStatus = 'COMPLETE';
      else if (cachedAmountPaid <= 0.01) cachedStatus = 'PENDING';
      else cachedStatus = 'HALF';

      const balanceDelta = creditGenerated - creditApplied;
      if (balanceDelta !== 0) {
        await tx.vendor.update({
          where: { id: newVendorId },
          data: { creditBalance: { increment: balanceDelta } },
        });
      }
    }

    // ===== 4. Apply NEW stock effect =====
    const newSign = isAdd(newTxnType) ? 1 : -1;
    const newStockExisting = await tx.metalStock.findFirst({
      where: { metalType: newMetal, purity: newPurity, form: newForm },
    });
    if (newStockExisting) {
      await tx.metalStock.update({
        where: { id: newStockExisting.id },
        data: {
          grossWeight: newStockExisting.grossWeight + newSign * newGross,
          pureWeight: newStockExisting.pureWeight + newSign * newPure,
        },
      });
    } else if (newSign === 1) {
      await tx.metalStock.create({
        data: {
          metalType: newMetal,
          purity: newPurity,
          form: newForm,
          grossWeight: newGross,
          pureWeight: newPure,
        },
      });
    }

    // ===== 5. Update transaction row =====
    const neftDate = data.neftDate ? new Date(data.neftDate) : undefined;
    const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;

    const updated = await tx.metalTransaction.update({
      where: { id },
      data: {
        transactionType: newTxnType,
        metalType: newMetal,
        purity: newPurity,
        form: newForm,
        grossWeight: newGross,
        pureWeight: newPure,
        rate: newRate,
        totalValue: newTotalValue,
        notes: data.notes !== undefined ? data.notes : old.notes,
        referenceNumber:
          data.referenceNumber !== undefined ? data.referenceNumber : old.referenceNumber,
        vendorId: newVendorId,
        // Allow editing the transaction date.
        ...(txnDate ? { createdAt: txnDate } : {}),
        isBillable: data.isBillable !== undefined ? data.isBillable : old.isBillable,
        paymentMode: isBillablePurchase
          ? data.paymentMode ?? old.paymentMode
          : null,
        paymentStatus: isBillablePurchase ? cachedStatus : null,
        amountPaid: isBillablePurchase ? cachedAmountPaid : null,
        cashAmount: isBillablePurchase
          ? data.cashAmount !== undefined
            ? data.cashAmount
            : old.cashAmount
          : null,
        neftAmount: isBillablePurchase
          ? data.neftAmount !== undefined
            ? data.neftAmount
            : old.neftAmount
          : null,
        neftUtr: isBillablePurchase
          ? data.neftUtr !== undefined
            ? data.neftUtr || null
            : old.neftUtr
          : null,
        neftBank: isBillablePurchase
          ? data.neftBank !== undefined
            ? data.neftBank || null
            : old.neftBank
          : null,
        neftDate: isBillablePurchase
          ? data.neftDate !== undefined
            ? neftDate ?? null
            : old.neftDate
          : null,
        creditApplied: isBillablePurchase && creditApplied > 0 ? creditApplied : null,
        creditGenerated:
          isBillablePurchase && creditGenerated > 0 ? creditGenerated : null,
      },
      include: {
        stock: true,
        vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    logger.info('Metal transaction updated', { transactionId: id });
    return updated;
  });
}

/**
 * Delete a metal transaction.
 *
 * Reverses the row's stock + vendor-credit effects inside one $transaction,
 * then deletes the transaction. Refused if the row has settlement-ledger
 * entries — those are accounting records and must be voided first.
 */
export async function deleteMetalTransaction(id: string) {
  return await prisma.$transaction(async (tx) => {
    const old = await tx.metalTransaction.findUnique({
      where: { id },
      include: { payments: { select: { id: true } } },
    });
    if (!old) {
      throw new ApiError(404, 'Transaction not found');
    }
    if (old.payments && old.payments.length > 0) {
      throw new ApiError(
        400,
        'Cannot delete a transaction that has settlement entries. Reconcile/void the settlements first.'
      );
    }

    // Reverse vendor-credit delta (same logic as updateMetalTransaction).
    if (
      old.transactionType === 'PURCHASE' &&
      old.isBillable === true &&
      old.vendorId
    ) {
      const oldDelta =
        (old.creditGenerated ?? 0) - (old.creditApplied ?? 0);
      if (oldDelta !== 0) {
        await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${old.vendorId} FOR UPDATE`;
        await tx.vendor.update({
          where: { id: old.vendorId },
          data: { creditBalance: { increment: -oldDelta } },
        });
      }
    }

    // Reverse stock effect.
    const isAdd = (t: string) =>
      t === 'PURCHASE' || t === 'RETURN_FROM_DEPARTMENT';
    const oldStock = await tx.metalStock.findFirst({
      where: { metalType: old.metalType, purity: old.purity, form: old.form },
    });
    if (oldStock) {
      const oldSign = isAdd(old.transactionType) ? -1 : 1;
      await tx.metalStock.update({
        where: { id: oldStock.id },
        data: {
          grossWeight: oldStock.grossWeight + oldSign * old.grossWeight,
          pureWeight: oldStock.pureWeight + oldSign * old.pureWeight,
        },
      });
    }

    await tx.metalTransaction.delete({ where: { id } });

    logger.info('Metal transaction deleted', { transactionId: id });
    return { id };
  });
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
      vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
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

/**
 * Settle a payment against a billable PURCHASE metal transaction.
 * Append-only: writes a row to metal_payments and updates the
 * denormalized cache (amount_paid + payment_status) on the parent row.
 * Server derives the running total from the ledger sum (with a fallback
 * to the existing amountPaid for rows created before the ledger existed).
 */
export async function settleMetalPayment(
  transactionId: string,
  data: SettleMetalPaymentRequest,
  userId: string
) {
  if (data.amount == null || data.amount < 0) {
    throw new ApiError(400, 'Settlement amount must be 0 or greater');
  }
  if (!data.paymentMode) {
    throw new ApiError(400, 'paymentMode is required');
  }
  // Either cash/NEFT amount > 0 OR credit being applied — at least one.
  if ((data.amount ?? 0) <= 0 && (data.creditApplied ?? 0) <= 0) {
    throw new ApiError(400, 'Either settlement amount or credit applied must be greater than 0');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Pessimistic row-level lock on the parent transaction. Prevents the
    // classic read-then-write race where two concurrent settles each read
    // the same previouslyPaid snapshot and both pass the over-pay check.
    // Postgres holds the lock until the surrounding transaction commits.
    await tx.$queryRaw`SELECT id FROM metal_transactions WHERE id = ${transactionId} FOR UPDATE`;

    const txn = await tx.metalTransaction.findUnique({
      where: { id: transactionId },
      include: { payments: true },
    });

    if (!txn) {
      throw new ApiError(404, 'Metal transaction not found', true, 'NOT_FOUND');
    }
    if (txn.transactionType !== 'PURCHASE' || txn.isBillable !== true) {
      throw new ApiError(400, 'Only billable purchases can be settled');
    }

    const totalValue = txn.totalValue ?? 0;
    const ledgerSum = txn.payments.reduce((s, p) => s + p.amount, 0);
    // Fallback: if no ledger rows yet but the transaction was created with
    // an initial amountPaid, treat that as the previously paid amount.
    const previouslyPaid = Math.max(ledgerSum, txn.amountPaid ?? 0);
    const remaining = Math.max(0, totalValue - previouslyPaid);

    // Vendor credit handling — also lock the vendor row.
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
      // Apply at most: requested, available, remaining-after-cash.
      creditApplied = Math.min(
        requestedCredit,
        availableCredit,
        Math.max(0, remaining - data.amount)
      );
    }

    const effectiveSettled = data.amount + creditApplied;
    if (effectiveSettled > remaining + 0.01) {
      // Over-payment routes excess into vendor credit (not an error).
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

    await tx.metalPayment.create({
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

    // Cap newAmountPaid at totalValue (over-payment lives in credit, not in cache).
    const newAmountPaid = Math.min(totalValue, previouslyPaid + effectiveSettled);
    const newStatus = newAmountPaid + 0.01 >= totalValue ? 'COMPLETE' : 'HALF';

    // Adjust vendor credit balance.
    if (txn.vendorId && creditApplied - creditGenerated !== 0) {
      const balanceDelta = creditGenerated - creditApplied;
      await tx.vendor.update({
        where: { id: txn.vendorId },
        data: { creditBalance: { increment: balanceDelta } },
      });
    }

    return tx.metalTransaction.update({
      where: { id: transactionId },
      data: {
        amountPaid: newAmountPaid,
        paymentStatus: newStatus,
      },
      include: {
        vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
        payments: {
          include: { recordedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { recordedAt: 'desc' },
        },
      },
    });
  });

  logger.info('Metal payment settled', {
    transactionId,
    userId,
    amount: data.amount,
    newStatus: result.paymentStatus,
  });
  return result;
}

/**
 * Get all settlements for a given metal transaction (newest first).
 * Throws 404 if the parent transaction does not exist so callers don't
 * confuse "unknown id" with "no settlements yet".
 */
export async function getMetalPayments(transactionId: string) {
  const exists = await prisma.metalTransaction.findUnique({
    where: { id: transactionId },
    select: { id: true },
  });
  if (!exists) {
    throw new ApiError(404, 'Metal transaction not found', true, 'NOT_FOUND');
  }
  return prisma.metalPayment.findMany({
    where: { transactionId },
    include: {
      recordedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { recordedAt: 'desc' },
  });
}
