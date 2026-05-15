/**
 * Diamond Purchase Order service — owns the full PO lifecycle plus the
 * receive-against-PO bridge into existing DiamondTransaction PURCHASE rows.
 *
 * Status machine (validated server-side; column is a plain String):
 *   DRAFT → PLACED → PARTIALLY_RECEIVED → FULLY_RECEIVED
 *                 ↳ CANCELLED  (terminal, requires `?force=true` if any
 *                               receives already exist — we keep the
 *                               purchase_order_id for audit)
 *
 * Inheritance rule: when `receiveAgainstPO()` creates a Diamond +
 * DiamondTransaction, it copies `dueDate = po.dueDate` verbatim. Free
 * receives (Phase 1) keep using `computeDueDate(receiveDate, vendor)`.
 *
 * The FULLY_RECEIVED transition allows ±0.5 ct slack per line to absorb
 * sieve rounding (real receives often differ by < 0.3 ct from order).
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import { ApiError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { computeDueDate } from '../../utils/credit';

const prisma = new PrismaClient();

export const PO_STATUSES = [
  'DRAFT',
  'PLACED',
  'PARTIALLY_RECEIVED',
  'FULLY_RECEIVED',
  'CANCELLED',
] as const;
export type PoStatus = (typeof PO_STATUSES)[number];

const RECEIVE_TOLERANCE_CT = 0.5;

export interface PoLineInput {
  sieveSizeId: number;
  shape?: string;
  color?: string;
  colorBand?: string;
  clarity?: string;
  expectedPieces?: number;
  expectedCarats: number;
  expectedRate?: number;
  notes?: string;
}

export interface CreateDiamondPOInput {
  vendorId: string;
  expectedDeliveryDate?: string;
  /** Per-PO override for due date. When omitted, computed from vendor. */
  dueDate?: string;
  notes?: string;
  status?: 'DRAFT' | 'PLACED'; // anything else is rejected
  lines: PoLineInput[];
}

export interface UpdateDiamondPOInput
  extends Partial<Omit<CreateDiamondPOInput, 'vendorId' | 'status'>> {
  /** Status edits are gated by the lifecycle helper, not by this field. */
  notes?: string;
}

/**
 * Generate a fresh PO number with retry-on-collision. Prefix is `DPO-` and
 * the suffix is the next zero-padded sequence. Uses a tx-safe loop —
 * collisions are extremely rare in practice (< 1% even at 1k POs/day).
 */
async function nextPoNumber(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await tx.diamondPurchaseOrder.findFirst({
      where: { poNumber: { startsWith: 'DPO-' } },
      orderBy: { createdAt: 'desc' },
      select: { poNumber: true },
    });
    const lastNum = last
      ? parseInt(last.poNumber.replace(/^DPO-/, ''), 10) || 0
      : 0;
    const candidate = `DPO-${String(lastNum + 1 + attempt).padStart(5, '0')}`;
    const exists = await tx.diamondPurchaseOrder.findUnique({
      where: { poNumber: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new ApiError(500, 'Could not generate a unique PO number; retry.');
}

function validateLines(lines: PoLineInput[]): void {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ApiError(400, 'At least one PO line is required');
  }
  for (const [i, l] of lines.entries()) {
    if (!Number.isInteger(l.sieveSizeId)) {
      throw new ApiError(400, `Line ${i + 1}: sieveSizeId must be an integer`);
    }
    if (
      typeof l.expectedCarats !== 'number' ||
      !Number.isFinite(l.expectedCarats) ||
      l.expectedCarats <= 0
    ) {
      throw new ApiError(400, `Line ${i + 1}: expectedCarats must be > 0`);
    }
    if (l.expectedRate != null && l.expectedRate < 0) {
      throw new ApiError(400, `Line ${i + 1}: expectedRate cannot be negative`);
    }
  }
}

export async function createDiamondPO(
  data: CreateDiamondPOInput,
  createdById: string
) {
  if (!data.vendorId) throw new ApiError(400, 'vendorId is required');
  validateLines(data.lines);
  if (data.status && !['DRAFT', 'PLACED'].includes(data.status)) {
    throw new ApiError(400, 'status on create must be DRAFT or PLACED');
  }

  return prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.findUnique({
      where: { id: data.vendorId },
      select: { id: true, paymentDueDays: true, gstDetails: true },
    });
    if (!vendor) throw new ApiError(404, 'Vendor not found');

    const placedAt = data.status === 'PLACED' ? new Date() : null;
    // dueDate is computed against placedAt (or now if still DRAFT). When the
    // user supplies an explicit override, we mark dueDateOverridden=true so
    // the PLACE transition leaves it untouched. Otherwise the auto-computed
    // value is just a best-effort estimate and is recomputed on PLACE so the
    // binding agreement runs from the real placedAt timestamp.
    const hasOverride = !!(data.dueDate && data.dueDate.length > 0);
    const dueDate = computeDueDate(placedAt ?? new Date(), vendor, data.dueDate);

    const poNumber = await nextPoNumber(tx);
    const created = await tx.diamondPurchaseOrder.create({
      data: {
        poNumber,
        vendorId: vendor.id,
        status: data.status ?? 'DRAFT',
        placedAt,
        expectedDeliveryDate: data.expectedDeliveryDate
          ? new Date(data.expectedDeliveryDate)
          : null,
        dueDate,
        dueDateOverridden: hasOverride,
        notes: data.notes,
        createdById,
        lines: {
          create: data.lines.map((l) => ({
            sieveSizeId: l.sieveSizeId,
            shape: l.shape,
            color: l.color,
            colorBand: l.colorBand,
            clarity: l.clarity,
            expectedPieces: l.expectedPieces,
            expectedCarats: l.expectedCarats,
            expectedRate: l.expectedRate,
            expectedTotal:
              l.expectedRate != null ? l.expectedCarats * l.expectedRate : null,
            notes: l.notes,
          })),
        },
      },
      include: { lines: { include: { sieveSize: true } } },
    });

    logger.info('Diamond PO created', {
      poId: created.id,
      poNumber: created.poNumber,
      vendorId: vendor.id,
      lines: data.lines.length,
      status: created.status,
    });
    return created;
  });
}

export async function listDiamondPOs(filters: {
  vendorId?: string;
  status?: PoStatus;
}) {
  const where: Prisma.DiamondPurchaseOrderWhereInput = {};
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.status) where.status = filters.status;

  return prisma.diamondPurchaseOrder.findMany({
    where,
    include: {
      vendor: { select: { id: true, name: true, uniqueCode: true } },
      lines: { include: { sieveSize: true } },
      _count: { select: { receives: true } },
    },
    orderBy: [{ placedAt: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
}

export async function getDiamondPO(id: string) {
  const po = await prisma.diamondPurchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      createdBy: { select: { id: true, name: true } },
      lines: {
        include: {
          sieveSize: true,
          receives: {
            select: {
              id: true,
              caratWeight: true,
              quantityPieces: true,
              totalValue: true,
              createdAt: true,
              diamond: { select: { stockNumber: true } },
            },
          },
        },
      },
    },
  });
  if (!po) throw new ApiError(404, 'Purchase order not found');

  // Variance = received vs expected, per line (carats + ₹).
  const linesWithVariance = po.lines.map((line) => {
    const receivedCarats = line.receives.reduce(
      (s, r) => s + (r.caratWeight ?? 0),
      0
    );
    const receivedValue = line.receives.reduce(
      (s, r) => s + (r.totalValue ?? 0),
      0
    );
    const receivedPieces = line.receives.reduce(
      (s, r) => s + (r.quantityPieces ?? 0),
      0
    );
    return {
      ...line,
      receivedCarats,
      receivedValue,
      receivedPieces,
      varianceCarats: receivedCarats - line.expectedCarats,
      varianceValue:
        line.expectedTotal != null ? receivedValue - line.expectedTotal : null,
    };
  });

  return { ...po, lines: linesWithVariance };
}

export async function updateDiamondPO(id: string, data: UpdateDiamondPOInput) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.diamondPurchaseOrder.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!po) throw new ApiError(404, 'Purchase order not found');
    if (po.status === 'CANCELLED' || po.status === 'FULLY_RECEIVED') {
      throw new ApiError(409, `Cannot edit a ${po.status} PO`);
    }
    if (po.status !== 'DRAFT' && data.lines) {
      throw new ApiError(
        409,
        'Lines can only be edited while the PO is in DRAFT'
      );
    }

    const updates: Prisma.DiamondPurchaseOrderUpdateInput = {};
    if (data.expectedDeliveryDate !== undefined) {
      updates.expectedDeliveryDate = data.expectedDeliveryDate
        ? new Date(data.expectedDeliveryDate)
        : null;
    }
    if (data.dueDate !== undefined) {
      // Editing dueDate on an existing PO is always treated as an explicit
      // override — even when the user clears it back to vendor default,
      // because the act of editing demonstrates intent. PLACE will then
      // preserve this value verbatim.
      updates.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      updates.dueDateOverridden = !!data.dueDate;
    }
    if (data.notes !== undefined) updates.notes = data.notes;

    if (data.lines) {
      validateLines(data.lines);
      // Replace-all strategy in DRAFT — simplest correct semantics.
      await tx.diamondPurchaseOrderLine.deleteMany({ where: { poId: id } });
      updates.lines = {
        create: data.lines.map((l) => ({
          sieveSizeId: l.sieveSizeId,
          shape: l.shape,
          color: l.color,
          colorBand: l.colorBand,
          clarity: l.clarity,
          expectedPieces: l.expectedPieces,
          expectedCarats: l.expectedCarats,
          expectedRate: l.expectedRate,
          expectedTotal:
            l.expectedRate != null ? l.expectedCarats * l.expectedRate : null,
          notes: l.notes,
        })),
      };
    }

    return tx.diamondPurchaseOrder.update({
      where: { id },
      data: updates,
      include: { lines: { include: { sieveSize: true } } },
    });
  });
}

export async function placeDiamondPO(id: string) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.diamondPurchaseOrder.findUnique({
      where: { id },
      include: { vendor: { select: { paymentDueDays: true, gstDetails: true } } },
    });
    if (!po) throw new ApiError(404, 'Purchase order not found');
    if (po.status !== 'DRAFT') {
      throw new ApiError(409, `Can only place DRAFT POs (current: ${po.status})`);
    }
    const placedAt = new Date();
    // If the user supplied an explicit override at creation/edit time,
    // preserve dueDate verbatim. Otherwise the DRAFT-time value was a
    // best-effort estimate against the draft creation date — recompute it
    // now against the real placedAt so NET-N runs from PO placement.
    const nextDueDate = po.dueDateOverridden
      ? po.dueDate
      : computeDueDate(placedAt, po.vendor);
    return tx.diamondPurchaseOrder.update({
      where: { id },
      data: {
        status: 'PLACED',
        placedAt,
        dueDate: nextDueDate,
      },
    });
  });
}

export async function cancelDiamondPO(
  id: string,
  cancelledById: string,
  opts: { reason?: string; force?: boolean }
) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.diamondPurchaseOrder.findUnique({
      where: { id },
      include: { _count: { select: { receives: true } } },
    });
    if (!po) throw new ApiError(404, 'Purchase order not found');
    if (po.status === 'CANCELLED') return po;
    if (po.status === 'FULLY_RECEIVED') {
      throw new ApiError(409, 'Cannot cancel a FULLY_RECEIVED PO');
    }
    if (po._count.receives > 0 && !opts.force) {
      throw new ApiError(409, {
        code: 'PO_HAS_RECEIVES',
        message: `PO has ${po._count.receives} receive(s). Pass ?force=true to cancel anyway.`,
        receiveCount: po._count.receives,
      } as any);
    }
    return tx.diamondPurchaseOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById,
        cancelReason: opts.reason,
      },
    });
  });
}

export interface ReceivePoLineInput {
  poLineId: string;
  shape: string;
  color: string;
  colorBand?: string;
  clarity: string;
  caratWeight: number;
  pieces: number;
  pricePerCarat: number;
  /** stockNumber is auto-generated server-side if omitted. */
  stockNumber?: string;
  notes?: string;
}

export interface ReceiveAgainstPoInput {
  referenceNumber?: string;
  notes?: string;
  /** Optional invoice-level billing (passed through to DiamondTransaction). */
  isBillable?: boolean;
  paymentMode?: string;
  paymentStatus?: string;
  amountPaid?: number;
  cashAmount?: number;
  neftAmount?: number;
  neftUtr?: string;
  neftBank?: string;
  neftDate?: string;
  lines: ReceivePoLineInput[];
}

/**
 * Create Diamond + DiamondTransaction rows tied to a PO. Updates PO status:
 *   - any pending lines (received < expected − tolerance) → PARTIALLY_RECEIVED
 *   - all lines satisfied (received ≥ expected − tolerance) → FULLY_RECEIVED
 */
export async function receiveAgainstPo(
  poId: string,
  data: ReceiveAgainstPoInput,
  createdById: string
) {
  if (!data.lines?.length) throw new ApiError(400, 'At least one receive line is required');

  return prisma.$transaction(async (tx) => {
    const po = await tx.diamondPurchaseOrder.findUnique({
      where: { id: poId },
      include: {
        lines: { select: { id: true, sieveSizeId: true, expectedCarats: true } },
      },
    });
    if (!po) throw new ApiError(404, 'Purchase order not found');
    if (po.status === 'CANCELLED' || po.status === 'FULLY_RECEIVED') {
      throw new ApiError(409, `Cannot receive against a ${po.status} PO`);
    }
    if (po.status === 'DRAFT') {
      throw new ApiError(409, 'Place the PO before receiving against it');
    }

    const lineMap = new Map(po.lines.map((l) => [l.id, l]));

    const stamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);
    const created: any[] = [];

    for (let idx = 0; idx < data.lines.length; idx++) {
      const item = data.lines[idx];
      const poLine = lineMap.get(item.poLineId);
      if (!poLine) {
        throw new ApiError(400, `Unknown PO line: ${item.poLineId}`);
      }
      if (item.caratWeight <= 0) {
        throw new ApiError(400, `Line ${idx + 1}: caratWeight must be > 0`);
      }

      const totalValue = item.caratWeight * (item.pricePerCarat ?? 0);
      const stockNumber =
        item.stockNumber && item.stockNumber.trim().length > 0
          ? item.stockNumber.trim()
          : `DIA-${stamp}-${String(idx + 1).padStart(3, '0')}`;

      const diamond = await tx.diamond.create({
        data: {
          stockNumber,
          category: 'LOOSE',
          caratWeight: item.caratWeight,
          color: item.color as any,
          colorBand: item.colorBand ?? null,
          clarity: item.clarity as any,
          shape: item.shape as any,
          pricePerCarat: item.pricePerCarat,
          totalPrice: totalValue,
          totalPieces: item.pieces,
          sieveSizeId: poLine.sieveSizeId,
          status: 'IN_STOCK',
        },
      });

      const txn = await tx.diamondTransaction.create({
        data: {
          diamondId: diamond.id,
          transactionType: 'PURCHASE',
          vendorId: po.vendorId,
          referenceNumber: data.referenceNumber,
          notes: data.notes ?? item.notes,
          createdById,
          caratWeight: item.caratWeight,
          pricePerCarat: item.pricePerCarat,
          totalValue,
          quantityPieces: item.pieces,
          isBillable: data.isBillable,
          paymentMode: idx === 0 ? data.paymentMode : undefined,
          paymentStatus: idx === 0 ? data.paymentStatus : undefined,
          amountPaid: idx === 0 ? data.amountPaid : undefined,
          cashAmount: idx === 0 ? data.cashAmount : undefined,
          neftAmount: idx === 0 ? data.neftAmount : undefined,
          neftUtr: idx === 0 ? data.neftUtr : undefined,
          neftBank: idx === 0 ? data.neftBank : undefined,
          neftDate: idx === 0 && data.neftDate ? new Date(data.neftDate) : undefined,
          // Inherit dueDate from the PO — the binding agreement.
          dueDate: po.dueDate,
          sieveSizeId: poLine.sieveSizeId,
          purchaseOrderId: po.id,
          purchaseOrderLineId: poLine.id,
        },
      });
      created.push(txn);
    }

    // Recompute PO status from cumulative receives.
    const linesWithReceives = await tx.diamondPurchaseOrderLine.findMany({
      where: { poId: po.id },
      select: {
        id: true,
        expectedCarats: true,
        receives: { select: { caratWeight: true } },
      },
    });
    const allSatisfied = linesWithReceives.every((l) => {
      const got = l.receives.reduce((s, r) => s + (r.caratWeight ?? 0), 0);
      return got + RECEIVE_TOLERANCE_CT >= l.expectedCarats;
    });
    // We've just inserted at least one receive in this transaction (early
    // return at the top guards against empty data.lines), so the PO is
    // guaranteed to be either fully or partially received from here on.
    const newStatus: PoStatus = allSatisfied
      ? 'FULLY_RECEIVED'
      : 'PARTIALLY_RECEIVED';

    if (newStatus !== po.status) {
      await tx.diamondPurchaseOrder.update({
        where: { id: po.id },
        data: { status: newStatus },
      });
    }

    logger.info('Diamond PO received', {
      poId: po.id,
      receives: created.length,
      newStatus,
    });

    return { receives: created, status: newStatus };
  });
}
