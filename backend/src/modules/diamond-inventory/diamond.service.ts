/**
 * ============================================
 * DIAMOND INVENTORY SERVICE
 * ============================================
 */

import { PrismaClient, DiamondShape, DiamondColor, DiamondClarity } from '@prisma/client';
import * as XLSX from 'xlsx';
import { logger } from '../../utils/logger';
import { ApiError } from '../../middleware/errorHandler';
import {
  CreateDiamondLotRequest,
  CreateDiamondRequest,
  IssueDiamondRequest,
  CreateDiamondPurchaseRequest,
  IssueDiamondV2Request,
  TransferDiamondRequest,
  AdjustDiamondRequest,
  ReturnDiamondFromDepartmentRequest,
  UpdateDiamondTransactionRequest,
  SettleDiamondPaymentRequest,
  CreateDiamondRateRequest,
  DiamondStockSummary,
} from './diamond.types';

const prisma = new PrismaClient();

export async function getAllDiamonds(filters?: {
  shape?: string;
  color?: string;
  clarity?: string;
  status?: string;
  category?: string;
}) {
  const where: any = {};
  if (filters?.shape) where.shape = filters.shape;
  if (filters?.color) where.color = filters.color;
  if (filters?.clarity) where.clarity = filters.clarity;
  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.category = filters.category;

  return await prisma.diamond.findMany({
    where,
    include: {
      lot: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDiamondById(diamondId: string) {
  return await prisma.diamond.findUnique({
    where: { id: diamondId },
    include: {
      lot: true,
      transactions: {
        include: {
          createdBy: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createDiamond(data: CreateDiamondRequest) {
  const category = data.category ?? 'SOLITAIRE';
  // Server-side validation — must mirror createDiamondPurchase.
  if (category === 'LOOSE' && !data.colorBand) {
    throw new ApiError(400, 'colorBand is required for LOOSE diamonds');
  }
  const totalPrice = data.pricePerCarat ? data.caratWeight * data.pricePerCarat : undefined;
  // For loose pieces colorBand is the source of truth — but the legacy `color`
  // enum column is still required by the schema, so we keep it populated with
  // the lower bound of the band so existing reports/filters keep working.
  const colorBand = category === 'LOOSE' ? data.colorBand ?? null : null;

  return await prisma.diamond.create({
    data: {
      stockNumber: data.stockNumber,
      category,
      caratWeight: data.caratWeight,
      color: data.color,
      colorBand,
      clarity: data.clarity,
      cut: data.cut,
      shape: data.shape,
      measurements: data.measurements,
      depthPercent: data.depthPercent,
      tablePercent: data.tablePercent,
      polish: data.polish,
      symmetry: data.symmetry,
      fluorescence: data.fluorescence,
      certificationLab: data.certificationLab,
      certNumber: data.certNumber,
      certDate: data.certDate,
      certUrl: data.certUrl,
      pricePerCarat: data.pricePerCarat,
      totalPrice: totalPrice,
      totalPieces: category === 'LOOSE' ? data.totalPieces ?? null : null,
      lotId: data.lotId,
    },
  });
}

export async function issueDiamond(data: IssueDiamondRequest, createdById: string) {
  const diamond = await prisma.diamond.update({
    where: { id: data.diamondId },
    data: {
      status: 'ISSUED',
      issuedToOrderId: data.orderId,
      issuedAt: new Date(),
    },
  });

  await prisma.diamondTransaction.create({
    data: {
      diamondId: data.diamondId,
      transactionType: 'ISSUE_TO_DEPARTMENT',
      orderId: data.orderId,
      notes: data.notes,
      createdById: createdById,
    },
  });

  logger.info('Diamond issued', { diamondId: data.diamondId, orderId: data.orderId });
  return diamond;
}

export async function getAllDiamondLots() {
  return await prisma.diamondLot.findMany({
    include: {
      diamonds: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createDiamondLot(data: CreateDiamondLotRequest) {
  return await prisma.diamondLot.create({
    data,
  });
}

// ============================================================================
// PARITY-WITH-METAL: stock summary, transactions, payments, export, rates
// ============================================================================

/**
 * Aggregate diamond stock without a separate stock table — derive from the
 * `diamonds` table directly. Loose parcels' caratWeight/totalPieces ARE the
 * stock; solitaires count as 1 piece each.
 */
export async function getDiamondStockSummary(): Promise<DiamondStockSummary> {
  const inStock = await prisma.diamond.findMany({
    where: { status: 'IN_STOCK' },
    select: {
      category: true,
      shape: true,
      caratWeight: true,
      pricePerCarat: true,
      totalPieces: true,
    },
  });

  const piecesOf = (d: { category: string; totalPieces: number | null }) =>
    d.category === 'LOOSE' ? d.totalPieces ?? 0 : 1;
  const valueOf = (d: { caratWeight: number; pricePerCarat: number | null }) =>
    (d.pricePerCarat ?? 0) * d.caratWeight;

  const totalDiamonds = inStock.length;
  const totalPieces = inStock.reduce((s, d) => s + piecesOf(d), 0);
  const totalCarats = inStock.reduce((s, d) => s + d.caratWeight, 0);
  const totalValue = inStock.reduce((s, d) => s + valueOf(d), 0);

  // by category
  const catMap = new Map<'LOOSE' | 'SOLITAIRE', { count: number; pieces: number; carats: number; value: number }>();
  for (const d of inStock) {
    const cat = (d.category === 'LOOSE' ? 'LOOSE' : 'SOLITAIRE') as 'LOOSE' | 'SOLITAIRE';
    const cur = catMap.get(cat) ?? { count: 0, pieces: 0, carats: 0, value: 0 };
    cur.count += 1;
    cur.pieces += piecesOf(d);
    cur.carats += d.caratWeight;
    cur.value += valueOf(d);
    catMap.set(cat, cur);
  }

  // by shape
  const shapeMap = new Map<DiamondShape, { count: number; carats: number; value: number }>();
  for (const d of inStock) {
    const cur = shapeMap.get(d.shape) ?? { count: 0, carats: 0, value: 0 };
    cur.count += 1;
    cur.carats += d.caratWeight;
    cur.value += valueOf(d);
    shapeMap.set(d.shape, cur);
  }

  return {
    totalDiamonds,
    totalPieces,
    totalCarats,
    totalValue,
    bySolitaireVsLoose: Array.from(catMap.entries()).map(([category, v]) => ({ category, ...v })),
    byShape: Array.from(shapeMap.entries()).map(([shape, v]) => ({ shape, ...v })),
  };
}

/**
 * Internal: vendor-credit math for a single PURCHASE item.
 * Returns the cached billing fields and the balance delta to apply on the vendor.
 * Mirrors createMetalTransaction logic exactly.
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

/**
 * Multi-item PURCHASE. Each item creates its own Diamond row + DiamondTransaction
 * under the same `referenceNumber`. Vendor row is locked once for the entire
 * batch (so concurrent receipts can't double-spend the same credit balance).
 */
export async function createDiamondPurchase(
  data: CreateDiamondPurchaseRequest,
  createdById: string
) {
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new ApiError(400, 'PURCHASE requires at least one item');
  }
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;

  const result = await prisma.$transaction(async (tx) => {
    let availableCredit = 0;
    if (data.vendorId) {
      // Lock vendor for the entire multi-item batch.
      await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${data.vendorId} FOR UPDATE`;
      const vendor = await tx.vendor.findUnique({
        where: { id: data.vendorId },
        select: { creditBalance: true },
      });
      availableCredit = vendor?.creditBalance ?? 0;
    }

    const created: any[] = [];
    let runningBalanceDelta = 0;

    // Auto-generated stockNumber prefix when caller didn't supply one. The
    // ReceiveDiamondPage UI doesn't collect a stock number per item — we mint
    // one here so `Diamond.stockNumber @unique` (required) is always satisfied.
    const now = new Date();
    const stamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      '-' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    for (let idx = 0; idx < data.items.length; idx++) {
      const item = data.items[idx];
      // 1. Server-side validation of category/colorBand pairing.
      const category = item.category ?? 'SOLITAIRE';
      if (category === 'LOOSE' && !item.colorBand) {
        throw new ApiError(400, 'colorBand is required for LOOSE diamonds');
      }
      if (category === 'SOLITAIRE' && item.totalPieces != null && item.totalPieces > 1) {
        throw new ApiError(400, 'SOLITAIRE diamonds must have totalPieces = 1');
      }
      const totalPrice = item.pricePerCarat ? item.caratWeight * item.pricePerCarat : undefined;
      const totalValue = totalPrice ?? 0;
      const stockNumber =
        item.stockNumber && String(item.stockNumber).trim().length > 0
          ? item.stockNumber
          : `DIA-${stamp}-${String(idx + 1).padStart(3, '0')}`;

      // 2. Create the Diamond row.
      const diamond = await tx.diamond.create({
        data: {
          stockNumber,
          category,
          caratWeight: item.caratWeight,
          color: item.color,
          colorBand: category === 'LOOSE' ? item.colorBand ?? null : null,
          clarity: item.clarity,
          cut: item.cut,
          shape: item.shape,
          measurements: item.measurements,
          depthPercent: item.depthPercent,
          tablePercent: item.tablePercent,
          polish: item.polish,
          symmetry: item.symmetry,
          fluorescence: item.fluorescence,
          certificationLab: item.certificationLab,
          certNumber: item.certNumber,
          certDate: item.certDate,
          certUrl: item.certUrl,
          pricePerCarat: item.pricePerCarat,
          totalPrice,
          totalPieces: category === 'LOOSE' ? item.totalPieces ?? null : null,
          lotId: item.lotId,
          status: 'IN_STOCK',
        },
      });

      // 3. Per-item billing math (only if vendor + totalValue > 0).
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
        // Drain the running available credit so subsequent items in the same
        // invoice don't double-spend the same balance.
        availableCredit = Math.max(0, availableCredit - billing.creditApplied + billing.creditGenerated);
        runningBalanceDelta += billing.balanceDelta;
      }

      // 4. Create the DiamondTransaction (snapshot + billing).
      const neftDate = item.neftDate ? new Date(item.neftDate) : undefined;
      const transaction = await tx.diamondTransaction.create({
        data: {
          diamondId: diamond.id,
          transactionType: 'PURCHASE',
          vendorId: data.vendorId,
          referenceNumber: data.referenceNumber,
          notes: data.notes ?? item.measurements ?? undefined,
          createdById,
          ...(txnDate ? { createdAt: txnDate } : {}),
          // Snapshot
          caratWeight: item.caratWeight,
          pricePerCarat: item.pricePerCarat,
          totalValue: totalPrice,
          quantityPieces: category === 'LOOSE' ? item.totalPieces ?? null : 1,
          // Billing
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
          diamond: true,
          vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
        },
      });
      created.push(transaction);
    }

    // 5. Apply aggregated balance delta once at the end.
    if (data.vendorId && runningBalanceDelta !== 0) {
      await tx.vendor.update({
        where: { id: data.vendorId },
        data: { creditBalance: { increment: runningBalanceDelta } },
      });
    }

    return created;
  });

  logger.info('Diamond purchase created', {
    items: result.length,
    vendorId: data.vendorId,
    referenceNumber: data.referenceNumber,
  });
  return result;
}

/**
 * V2 issue: solitaires issue whole; loose parcels decrement pieces+carats.
 * Locks the diamond row to prevent concurrent over-issue.
 */
export async function issueDiamondV2(data: IssueDiamondV2Request, createdById: string) {
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM diamonds WHERE id = ${data.diamondId} FOR UPDATE`;
    const diamond = await tx.diamond.findUnique({ where: { id: data.diamondId } });
    if (!diamond) throw new ApiError(404, 'Diamond not found');
    if (diamond.status === 'ISSUED') {
      throw new ApiError(400, 'Diamond already issued');
    }

    let issuedCarats: number;
    let issuedPieces: number;
    let snapshotPrice = diamond.pricePerCarat;
    let snapshotValue: number | undefined;

    if (diamond.category === 'LOOSE') {
      issuedCarats = data.caratWeight ?? diamond.caratWeight;
      issuedPieces = data.quantityPieces ?? diamond.totalPieces ?? 1;
      if (issuedCarats <= 0 || issuedPieces <= 0) {
        throw new ApiError(400, 'quantityPieces and caratWeight must be > 0 for LOOSE issue');
      }
      if (issuedCarats > diamond.caratWeight + 0.0001) {
        throw new ApiError(400, `Cannot issue ${issuedCarats}ct — only ${diamond.caratWeight}ct in stock`);
      }
      if (diamond.totalPieces != null && issuedPieces > diamond.totalPieces) {
        throw new ApiError(400, `Cannot issue ${issuedPieces} pieces — only ${diamond.totalPieces} in stock`);
      }
      const remainingCarats = diamond.caratWeight - issuedCarats;
      const remainingPieces = (diamond.totalPieces ?? issuedPieces) - issuedPieces;
      const fullyIssued = remainingCarats <= 0.0001 && remainingPieces <= 0;
      await tx.diamond.update({
        where: { id: diamond.id },
        data: {
          caratWeight: Math.max(0, remainingCarats),
          totalPieces: diamond.totalPieces == null ? null : Math.max(0, remainingPieces),
          status: fullyIssued ? 'ISSUED' : diamond.status,
          issuedToOrderId: fullyIssued ? data.orderId : diamond.issuedToOrderId,
          issuedAt: fullyIssued ? new Date() : diamond.issuedAt,
        },
      });
      snapshotValue = snapshotPrice ? snapshotPrice * issuedCarats : undefined;
    } else {
      // SOLITAIRE — whole stone.
      issuedCarats = diamond.caratWeight;
      issuedPieces = 1;
      await tx.diamond.update({
        where: { id: diamond.id },
        data: {
          status: 'ISSUED',
          issuedToOrderId: data.orderId,
          issuedAt: new Date(),
        },
      });
      snapshotValue = diamond.totalPrice ?? (snapshotPrice ? snapshotPrice * issuedCarats : undefined);
    }

    return tx.diamondTransaction.create({
      data: {
        diamondId: diamond.id,
        transactionType: 'ISSUE_TO_DEPARTMENT',
        orderId: data.orderId,
        departmentId: data.departmentId,
        workerId: data.workerId,
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
        caratWeight: issuedCarats,
        pricePerCarat: snapshotPrice,
        totalValue: snapshotValue,
        quantityPieces: issuedPieces,
      },
      include: {
        diamond: true,
        createdBy: { select: { name: true, email: true } },
      },
    });
  });

  logger.info('Diamond issued (v2)', {
    diamondId: data.diamondId,
    pieces: result.quantityPieces,
    carats: result.caratWeight,
  });
  return result;
}

/** Move a diamond between locations. Just logs the movement + updates currentLocation. */
export async function transferDiamond(data: TransferDiamondRequest, createdById: string) {
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    // Lock the diamond row so a concurrent issue/transfer can't race us.
    await tx.$queryRaw`SELECT id FROM diamonds WHERE id = ${data.diamondId} FOR UPDATE`;
    const diamond = await tx.diamond.findUnique({ where: { id: data.diamondId } });
    if (!diamond) throw new ApiError(404, 'Diamond not found');
    await tx.diamond.update({
      where: { id: data.diamondId },
      data: { currentLocation: data.toLocation },
    });
    return tx.diamondTransaction.create({
      data: {
        diamondId: data.diamondId,
        transactionType: 'TRANSFER',
        fromLocation: data.fromLocation ?? diamond.currentLocation,
        toLocation: data.toLocation,
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
        caratWeight: diamond.caratWeight,
        quantityPieces: diamond.category === 'LOOSE' ? diamond.totalPieces : 1,
      },
      include: { diamond: true },
    });
  });
  logger.info('Diamond transferred', { diamondId: data.diamondId, to: data.toLocation });
  return result;
}

/** Manual stock correction. */
export async function adjustDiamond(data: AdjustDiamondRequest, createdById: string) {
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM diamonds WHERE id = ${data.diamondId} FOR UPDATE`;
    const diamond = await tx.diamond.findUnique({ where: { id: data.diamondId } });
    if (!diamond) throw new ApiError(404, 'Diamond not found');

    const newCarat = Math.max(0, diamond.caratWeight + (data.deltaCarats ?? 0));
    const newPieces =
      diamond.totalPieces != null
        ? Math.max(0, diamond.totalPieces + (data.deltaPieces ?? 0))
        : diamond.totalPieces;

    await tx.diamond.update({
      where: { id: data.diamondId },
      data: { caratWeight: newCarat, totalPieces: newPieces },
    });

    return tx.diamondTransaction.create({
      data: {
        diamondId: data.diamondId,
        transactionType: 'ADJUSTMENT',
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
        caratWeight: data.deltaCarats,
        quantityPieces: data.deltaPieces,
      },
      include: { diamond: true },
    });
  });
  logger.info('Diamond adjusted', { diamondId: data.diamondId });
  return result;
}

/** Return previously-issued stock back to inventory. */
export async function returnDiamondFromDepartment(
  data: ReturnDiamondFromDepartmentRequest,
  createdById: string
) {
  const txnDate = data.transactionDate ? new Date(data.transactionDate) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM diamonds WHERE id = ${data.diamondId} FOR UPDATE`;
    const diamond = await tx.diamond.findUnique({ where: { id: data.diamondId } });
    if (!diamond) throw new ApiError(404, 'Diamond not found');

    const returnedCarats = data.caratWeight ?? diamond.caratWeight;
    const returnedPieces = data.quantityPieces ?? 1;

    if (diamond.category === 'LOOSE') {
      await tx.diamond.update({
        where: { id: data.diamondId },
        data: {
          caratWeight: diamond.caratWeight + returnedCarats,
          totalPieces:
            diamond.totalPieces == null ? returnedPieces : diamond.totalPieces + returnedPieces,
          status: 'IN_STOCK',
        },
      });
    } else {
      await tx.diamond.update({
        where: { id: data.diamondId },
        data: { status: 'IN_STOCK', issuedToOrderId: null, issuedAt: null },
      });
    }

    return tx.diamondTransaction.create({
      data: {
        diamondId: data.diamondId,
        transactionType: 'RETURN_FROM_DEPARTMENT',
        orderId: data.orderId,
        departmentId: data.departmentId,
        workerId: data.workerId,
        notes: data.notes,
        createdById,
        ...(txnDate ? { createdAt: txnDate } : {}),
        caratWeight: returnedCarats,
        quantityPieces: returnedPieces,
      },
      include: { diamond: true },
    });
  });
  logger.info('Diamond returned from department', { diamondId: data.diamondId });
  return result;
}

/**
 * List diamond transactions with filters. Mirrors getAllMetalTransactions.
 */
export async function getAllDiamondTransactions(filters?: {
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
  return prisma.diamondTransaction.findMany({
    where,
    include: {
      diamond: { select: { id: true, stockNumber: true, category: true, shape: true, color: true, clarity: true } },
      vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

/**
 * PATCH /diamonds/transactions/:id — restricted to vendor / billing / notes.
 * Stock-bearing fields are FROZEN post-create. Refuses if any DiamondPayment
 * row exists (use the Settle flow). Mirrors metal's discipline.
 */
export async function updateDiamondTransaction(
  id: string,
  data: UpdateDiamondTransactionRequest
) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.diamondTransaction.findUnique({
      where: { id },
      include: { payments: { select: { id: true } } },
    });
    if (!old) throw new ApiError(404, 'Diamond transaction not found');
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

    // Reverse old vendor-credit delta.
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

    // Apply new vendor-credit delta.
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

    const updated = await tx.diamondTransaction.update({
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
        diamond: true,
        vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
      },
    });
    logger.info('Diamond transaction updated', { transactionId: id });
    return updated;
  });
}

/**
 * Delete a diamond transaction. Reverses stock (parcel decrements / status
 * flips) and vendor credit, then deletes. Refuses if any DiamondPayment exists.
 */
export async function deleteDiamondTransaction(id: string) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.diamondTransaction.findUnique({
      where: { id },
      include: { payments: { select: { id: true } }, diamond: true },
    });
    if (!old) throw new ApiError(404, 'Diamond transaction not found');
    if (old.payments.length > 0) {
      throw new ApiError(
        400,
        'Cannot delete a transaction that has settlement entries. Reconcile/void the settlements first.'
      );
    }

    // Reverse vendor credit (PURCHASE only).
    if (old.transactionType === 'PURCHASE' && old.vendorId) {
      const oldDelta = (old.creditGenerated ?? 0) - (old.creditApplied ?? 0);
      if (oldDelta !== 0) {
        await tx.$queryRaw`SELECT id FROM vendors WHERE id = ${old.vendorId} FOR UPDATE`;
        await tx.vendor.update({
          where: { id: old.vendorId },
          data: { creditBalance: { increment: -oldDelta } },
        });
      }
    }

    // Reverse stock for ISSUE_TO_DEPARTMENT (re-increment parcel) and TRANSFER (no-op),
    // ADJUSTMENT (reverse delta), RETURN_FROM_DEPARTMENT (decrement what we added).
    await tx.$queryRaw`SELECT id FROM diamonds WHERE id = ${old.diamondId} FOR UPDATE`;
    const d = await tx.diamond.findUnique({ where: { id: old.diamondId } });
    if (d) {
      if (old.transactionType === 'ISSUE_TO_DEPARTMENT') {
        if (d.category === 'LOOSE') {
          await tx.diamond.update({
            where: { id: d.id },
            data: {
              caratWeight: d.caratWeight + (old.caratWeight ?? 0),
              totalPieces:
                d.totalPieces == null
                  ? old.quantityPieces ?? null
                  : d.totalPieces + (old.quantityPieces ?? 0),
              status: 'IN_STOCK',
            },
          });
        } else {
          await tx.diamond.update({
            where: { id: d.id },
            data: { status: 'IN_STOCK', issuedToOrderId: null, issuedAt: null },
          });
        }
      } else if (old.transactionType === 'RETURN_FROM_DEPARTMENT' && d.category === 'LOOSE') {
        await tx.diamond.update({
          where: { id: d.id },
          data: {
            caratWeight: Math.max(0, d.caratWeight - (old.caratWeight ?? 0)),
            totalPieces:
              d.totalPieces == null
                ? null
                : Math.max(0, d.totalPieces - (old.quantityPieces ?? 0)),
          },
        });
      } else if (old.transactionType === 'ADJUSTMENT') {
        await tx.diamond.update({
          where: { id: d.id },
          data: {
            caratWeight: Math.max(0, d.caratWeight - (old.caratWeight ?? 0)),
            totalPieces:
              d.totalPieces == null
                ? null
                : Math.max(0, d.totalPieces - (old.quantityPieces ?? 0)),
          },
        });
      }
      // PURCHASE: refuse — would orphan the Diamond row. Delete the diamond instead.
      // (Caller should delete the Diamond, which cascades the transaction.)
      if (old.transactionType === 'PURCHASE') {
        throw new ApiError(
          400,
          'Cannot delete a PURCHASE transaction directly. Delete the diamond instead, which cascades.'
        );
      }
    }

    await tx.diamondTransaction.delete({ where: { id } });
    logger.info('Diamond transaction deleted', { transactionId: id });
    return { id };
  });
}

/**
 * Settle a payment against a billable PURCHASE diamond transaction.
 * Mirror of settleMetalPayment.
 */
export async function settleDiamondPayment(
  transactionId: string,
  data: SettleDiamondPaymentRequest,
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
    await tx.$queryRaw`SELECT id FROM diamond_transactions WHERE id = ${transactionId} FOR UPDATE`;
    const txn = await tx.diamondTransaction.findUnique({
      where: { id: transactionId },
      include: { payments: true },
    });
    if (!txn) throw new ApiError(404, 'Diamond transaction not found', true, 'NOT_FOUND');
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

    await tx.diamondPayment.create({
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

    return tx.diamondTransaction.update({
      where: { id: transactionId },
      data: { amountPaid: newAmountPaid, paymentStatus: newStatus },
      include: {
        diamond: true,
        vendor: { select: { id: true, name: true, uniqueCode: true, creditBalance: true } },
        payments: {
          include: { recordedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { recordedAt: 'desc' },
        },
      },
    });
  });

  logger.info('Diamond payment settled', {
    transactionId,
    userId,
    amount: data.amount,
    newStatus: result.paymentStatus,
  });
  return result;
}

/** List settlement ledger for a diamond transaction. */
export async function getDiamondPayments(transactionId: string) {
  const exists = await prisma.diamondTransaction.findUnique({
    where: { id: transactionId },
    select: { id: true },
  });
  if (!exists) {
    throw new ApiError(404, 'Diamond transaction not found', true, 'NOT_FOUND');
  }
  return prisma.diamondPayment.findMany({
    where: { transactionId },
    include: { recordedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { recordedAt: 'desc' },
  });
}

/**
 * Export diamond transactions to XLSX. 3 sheets: All / Billable / Non-Billable.
 * Mirror of exportMetalTransactions.
 */
export async function exportDiamondTransactions(filters: {
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

  const transactions = await prisma.diamondTransaction.findMany({
    where,
    include: {
      diamond: { select: { stockNumber: true, category: true, shape: true, color: true, clarity: true } },
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
    'Stock #': t.diamond?.stockNumber ?? '',
    Category: t.diamond?.category ?? '',
    Shape: t.diamond?.shape ?? '',
    Color: t.diamond?.color ?? '',
    Clarity: t.diamond?.clarity ?? '',
    Pieces: t.quantityPieces ?? '',
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

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'All Transactions');
  if (billable.length > 0) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(billable), 'Billable');
  }
  if (nonBillable.length > 0) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(nonBillable), 'Non-Billable');
  }
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

/** Latest rate per (shape, color, clarity). Sorted shape→color→clarity, newest first. */
export async function getCurrentDiamondRates() {
  // Postgres requires DISTINCT ON columns to lead ORDER BY. We need
  // shape/color/clarity first (matches `distinct`), then effectiveDate desc
  // so the row Prisma keeps for each group is the most recent one.
  return prisma.diamondRate.findMany({
    distinct: ['shape', 'color', 'clarity'],
    orderBy: [
      { shape: 'asc' },
      { color: 'asc' },
      { clarity: 'asc' },
      { effectiveDate: 'desc' },
    ],
    include: { createdBy: { select: { name: true } } },
  });
}

export async function createDiamondRate(data: CreateDiamondRateRequest, createdById: string) {
  return prisma.diamondRate.create({
    data: {
      shape: data.shape,
      color: data.color,
      clarity: data.clarity,
      caratFrom: data.caratFrom,
      caratTo: data.caratTo,
      pricePerCarat: data.pricePerCarat,
      effectiveDate: data.effectiveDate,
      source: data.source,
      createdById,
    },
  });
}

/**
 * Look up the most recent DiamondRate matching shape/color/clarity AND
 * caratWeight ∈ [caratFrom, caratTo]. Tie-break by createdAt DESC. Returns
 * `null` if no rate band covers the given stone — caller should then fall
 * back to the Diamond row's own `pricePerCarat`.
 *
 * Mirrors the lookup semantics described in plan A4.
 */
export async function lookupDiamondRate(args: {
  shape: string;
  color: string;
  clarity: string;
  caratWeight: number;
}) {
  return prisma.diamondRate.findFirst({
    where: {
      shape: args.shape as any,
      color: args.color as any,
      clarity: args.clarity as any,
      caratFrom: { lte: args.caratWeight },
      caratTo: { gte: args.caratWeight },
    },
    orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
  });
}

/**
 * Value a single Diamond row at the current rate. Falls back to the row's
 * own `pricePerCarat` when no rate band applies. Returns both the resolved
 * unit price and the implied total value so callers can render either.
 */
export async function valueDiamond(diamond: {
  shape: string;
  color: string;
  clarity: string;
  caratWeight: number;
  pricePerCarat: number | null;
}) {
  const rate = await lookupDiamondRate(diamond);
  const ppc = rate?.pricePerCarat ?? diamond.pricePerCarat ?? 0;
  return {
    pricePerCarat: ppc,
    totalValue: ppc * diamond.caratWeight,
    rateSource: rate ? 'rate-band' : diamond.pricePerCarat ? 'row' : 'none',
    rateId: rate?.id ?? null,
  };
}
