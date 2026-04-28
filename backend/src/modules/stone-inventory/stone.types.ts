/**
 * ============================================
 * STONE INVENTORY TYPES — Real Stone + Synthetic Stone Packet
 * ============================================
 * Mirrors backend/src/modules/diamond-inventory/diamond.types.ts.
 */

import { RealStoneType, SyntheticStoneType } from '@prisma/client';

// ============================================================================
// REAL STONE
// ============================================================================

export interface CreateRealStoneRequest {
  stockNumber?: string;
  stoneType: RealStoneType;
  caratWeight: number;
  shape: string;
  color: string;
  clarity?: string;
  cut?: string;
  origin?: string;
  treatment?: string;
  treatmentNotes?: string;
  certLab?: string;
  certNumber?: string;
  certDate?: Date;
  pricePerCarat?: number;
}

/** Per-item billing block (mirrors DiamondBillingBlock). */
export interface RealStoneBillingBlock {
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

export interface RealStonePurchaseItem extends CreateRealStoneRequest, RealStoneBillingBlock {}

export interface CreateRealStonePurchaseRequest {
  transactionType: 'PURCHASE';
  vendorId?: string;
  referenceNumber?: string;
  transactionDate?: string;
  notes?: string;
  items: RealStonePurchaseItem[];
}

export interface IssueRealStoneRequest {
  transactionType: 'ISSUE_TO_DEPARTMENT';
  stoneId: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  notes?: string;
  transactionDate?: string;
}

export interface TransferRealStoneRequest {
  transactionType: 'TRANSFER';
  stoneId: string;
  fromLocation?: string;
  toLocation: string;
  notes?: string;
  transactionDate?: string;
}

export interface AdjustRealStoneRequest {
  transactionType: 'ADJUSTMENT';
  stoneId: string;
  deltaCarats?: number;
  notes?: string;
  transactionDate?: string;
}

export interface ReturnRealStoneFromDepartmentRequest {
  transactionType: 'RETURN_FROM_DEPARTMENT';
  stoneId: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  notes?: string;
  transactionDate?: string;
}

export type CreateRealStoneTransactionRequest =
  | CreateRealStonePurchaseRequest
  | IssueRealStoneRequest
  | TransferRealStoneRequest
  | AdjustRealStoneRequest
  | ReturnRealStoneFromDepartmentRequest;

export interface UpdateRealStoneTransactionRequest {
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

export interface SettleRealStonePaymentRequest {
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

export interface CreateRealStoneRateRequest {
  stoneType: RealStoneType;
  quality?: string;
  caratFrom: number;
  caratTo: number;
  pricePerCarat: number;
  effectiveDate: Date;
  source?: string;
}

export interface RealStoneStockSummary {
  totalStones: number;
  totalCarats: number;
  totalValue: number;
  byStoneType: Array<{
    stoneType: RealStoneType;
    count: number;
    carats: number;
    value: number;
  }>;
  byQuality: Array<{
    quality: string;
    count: number;
    carats: number;
    value: number;
  }>;
}

// ============================================================================
// STONE PACKET (Synthetic)
// ============================================================================

export interface CreateStonePacketRequest {
  packetNumber?: string;
  stoneType: SyntheticStoneType;
  shape: string;
  size: string;
  color: string;
  quality?: string;
  totalPieces?: number;
  totalWeight: number;
  unit?: string;
  pricePerUnit?: number;
  reorderLevel?: number;
}

export interface StonePacketBillingBlock {
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

export interface StonePacketPurchaseItem extends CreateStonePacketRequest, StonePacketBillingBlock {}

export interface CreateStonePacketPurchaseRequest {
  transactionType: 'PURCHASE';
  vendorId?: string;
  referenceNumber?: string;
  transactionDate?: string;
  notes?: string;
  items: StonePacketPurchaseItem[];
}

export interface IssueStonePacketRequest {
  transactionType: 'ISSUE_TO_DEPARTMENT';
  packetId: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  /** Required: amount being issued (in `unit`). */
  quantity: number;
  unit?: string;
  notes?: string;
  transactionDate?: string;
}

export interface TransferStonePacketRequest {
  transactionType: 'TRANSFER';
  packetId: string;
  fromLocation?: string;
  toLocation: string;
  notes?: string;
  transactionDate?: string;
}

export interface AdjustStonePacketRequest {
  transactionType: 'ADJUSTMENT';
  packetId: string;
  deltaWeight?: number;
  deltaPieces?: number;
  notes?: string;
  transactionDate?: string;
}

export interface ReturnStonePacketFromDepartmentRequest {
  transactionType: 'RETURN_FROM_DEPARTMENT';
  packetId: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  quantity: number;
  unit?: string;
  notes?: string;
  transactionDate?: string;
}

export type CreateStonePacketTransactionRequest =
  | CreateStonePacketPurchaseRequest
  | IssueStonePacketRequest
  | TransferStonePacketRequest
  | AdjustStonePacketRequest
  | ReturnStonePacketFromDepartmentRequest;

export interface UpdateStonePacketTransactionRequest {
  vendorId?: string | null;
  referenceNumber?: string;
  notes?: string;
  pricePerUnit?: number;
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

export interface SettleStonePacketPaymentRequest {
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

export interface StonePacketStockSummary {
  totalPackets: number;
  totalPieces: number;
  totalWeight: number;
  totalValue: number;
  byStoneType: Array<{
    stoneType: SyntheticStoneType;
    count: number;
    pieces: number;
    weight: number;
    value: number;
  }>;
  byQuality: Array<{
    quality: string;
    count: number;
    pieces: number;
    weight: number;
    value: number;
  }>;
}
