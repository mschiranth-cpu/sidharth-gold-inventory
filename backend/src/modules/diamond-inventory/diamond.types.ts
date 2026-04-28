/**
 * ============================================
 * DIAMOND INVENTORY TYPES
 * ============================================
 */

import { DiamondShape, DiamondClarity, DiamondColor, DiamondCut } from '@prisma/client';

export interface CreateDiamondLotRequest {
  lotNumber: string;
  description?: string;
  totalPieces: number;
  totalCarats: number;
  avgPricePerCarat?: number;
  supplierId?: string;
  purchaseDate?: Date;
}

export interface CreateDiamondRequest {
  stockNumber: string;
  /**
   * 'LOOSE' for parcel/loose-piece purchases (color sold by band, e.g. E/F),
   * 'SOLITAIRE' for individually-graded stones. Defaults to 'SOLITAIRE'
   * server-side if omitted to preserve existing API behaviour.
   */
  category?: 'LOOSE' | 'SOLITAIRE';
  caratWeight: number;
  color: DiamondColor;
  /**
   * Color band string (e.g. 'D/E', 'E/F', 'F/G', 'G/H', 'H/I', 'I/J', 'J/K').
   * Required when category === 'LOOSE'. The single `color` field still
   * carries the lower bound of the band so existing filters keep working.
   */
  colorBand?: string;
  clarity: DiamondClarity;
  cut?: DiamondCut;
  shape: DiamondShape;
  measurements?: string;
  depthPercent?: number;
  tablePercent?: number;
  polish?: string;
  symmetry?: string;
  fluorescence?: string;
  certificationLab?: string;
  certNumber?: string;
  certDate?: Date;
  certUrl?: string;
  pricePerCarat?: number;
  /**
   * For LOOSE parcels: number of pieces in the parcel. Decremented on partial
   * issue. For SOLITAIRE: ignored / null (treated as 1).
   */
  totalPieces?: number;
  lotId?: string;
}

export interface IssueDiamondRequest {
  diamondId: string;
  orderId: string;
  notes?: string;
}

// ============================================================================
// PARITY-WITH-METAL TYPES (Phase 3 — full diamond inventory parity)
// ============================================================================

/**
 * String discriminator for the unified `POST /diamonds/transactions` endpoint.
 * Mirrors the metal-module vocabulary. Stored verbatim on
 * `diamond_transactions.transaction_type` (no Prisma enum — it's a String column).
 */
export type DiamondTransactionType =
  | 'PURCHASE'
  | 'ISSUE_TO_DEPARTMENT'
  | 'RETURN_FROM_DEPARTMENT'
  | 'TRANSFER'
  | 'ADJUSTMENT';

/**
 * Per-item billing block. Identical shape to metal's payment fields so the
 * frontend SettlePaymentModal can reuse its logic via a `domain` prop.
 */
export interface DiamondBillingBlock {
  isBillable?: boolean;
  paymentMode?: string;     // 'CASH' | 'NEFT' | 'BOTH'
  paymentStatus?: string;   // 'COMPLETE' | 'HALF' | 'PENDING'
  amountPaid?: number;
  cashAmount?: number;
  neftAmount?: number;
  neftUtr?: string;
  neftBank?: string;
  neftDate?: string;        // ISO string from <input type="date">
  creditApplied?: number;
}

/** A single diamond inside a multi-item PURCHASE invoice. */
export interface DiamondPurchaseItem extends CreateDiamondRequest, DiamondBillingBlock {
  /**
   * For LOOSE parcels: number of pieces in the parcel. For SOLITAIRE: omitted
   * (treated as 1). Persisted to `diamonds.total_pieces` and snapshotted onto
   * the resulting DiamondTransaction.
   */
  totalPieces?: number;
}

/** Body of `POST /diamonds/transactions` when `transactionType === 'PURCHASE'`. */
export interface CreateDiamondPurchaseRequest {
  transactionType: 'PURCHASE';
  vendorId?: string;
  referenceNumber?: string;
  /** ISO date — back-dates all items in this invoice. Defaults to now(). */
  transactionDate?: string;
  notes?: string;
  items: DiamondPurchaseItem[];
}

/**
 * Body of `POST /diamonds/transactions` when `transactionType === 'ISSUE_TO_DEPARTMENT'`.
 *
 * For SOLITAIRE diamonds, `quantityPieces` and `caratWeight` are ignored and
 * the whole stone is issued (status → ISSUED).
 *
 * For LOOSE parcels, the server decrements `Diamond.totalPieces` and
 * `Diamond.caratWeight` by the supplied amounts; the parcel row stays
 * IN_STOCK until both fall to ~0.
 */
export interface IssueDiamondV2Request {
  transactionType: 'ISSUE_TO_DEPARTMENT';
  diamondId: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  /** Pieces being issued (loose parcels only). */
  quantityPieces?: number;
  /** Carats being issued (loose parcels only). */
  caratWeight?: number;
  notes?: string;
  transactionDate?: string;
}

/** Body when `transactionType === 'TRANSFER'`. */
export interface TransferDiamondRequest {
  transactionType: 'TRANSFER';
  diamondId: string;
  fromLocation?: string;
  toLocation: string;
  notes?: string;
  transactionDate?: string;
}

/** Body when `transactionType === 'ADJUSTMENT'`. */
export interface AdjustDiamondRequest {
  transactionType: 'ADJUSTMENT';
  diamondId: string;
  /** Positive = add stock back, negative = remove stock. */
  deltaPieces?: number;
  deltaCarats?: number;
  notes?: string;
  transactionDate?: string;
}

/** Body when `transactionType === 'RETURN_FROM_DEPARTMENT'`. */
export interface ReturnDiamondFromDepartmentRequest {
  transactionType: 'RETURN_FROM_DEPARTMENT';
  diamondId: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  quantityPieces?: number;
  caratWeight?: number;
  notes?: string;
  transactionDate?: string;
}

/** Discriminated union for the unified endpoint. */
export type CreateDiamondTransactionRequest =
  | CreateDiamondPurchaseRequest
  | IssueDiamondV2Request
  | TransferDiamondRequest
  | AdjustDiamondRequest
  | ReturnDiamondFromDepartmentRequest;

/**
 * PATCH /diamonds/transactions/:id — restricted to vendor / billing / notes
 * fields. Stock-bearing fields (caratWeight, quantityPieces) are frozen
 * post-create. Mirror of metal's UpdateMetalTransactionRequest discipline.
 */
export interface UpdateDiamondTransactionRequest {
  vendorId?: string | null;
  referenceNumber?: string;
  notes?: string;
  pricePerCarat?: number;
  transactionDate?: string;
  isBillable?: boolean;
  paymentMode?: string;
  paymentStatus?: string;
  amountPaid?: number;
  cashAmount?: number;
  neftAmount?: number;
  neftUtr?: string;
  neftBank?: string;
  neftDate?: string;
  creditApplied?: number;
}

/** Mirror of SettleMetalPaymentRequest. */
export interface SettleDiamondPaymentRequest {
  amount: number;
  paymentMode: string;
  cashAmount?: number;
  neftAmount?: number;
  neftUtr?: string;
  neftBank?: string;
  neftDate?: string;
  notes?: string;
  creditApplied?: number;
}

export interface CreateDiamondRateRequest {
  shape: DiamondShape;
  color: DiamondColor;
  clarity: DiamondClarity;
  caratFrom: number;
  caratTo: number;
  pricePerCarat: number;
  effectiveDate: Date;
  source?: string;
}

/** Aggregated stock summary returned by `GET /diamonds/stock/summary`. */
export interface DiamondStockSummary {
  totalDiamonds: number;
  totalPieces: number;
  totalCarats: number;
  totalValue: number;
  bySolitaireVsLoose: Array<{
    category: 'LOOSE' | 'SOLITAIRE';
    count: number;
    pieces: number;
    carats: number;
    value: number;
  }>;
  byShape: Array<{
    shape: DiamondShape;
    count: number;
    carats: number;
    value: number;
  }>;
}
