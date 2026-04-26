/**
 * ============================================
 * METAL INVENTORY TYPES
 * ============================================
 */

import { MetalType, MetalForm, MetalTransactionType } from '@prisma/client';

export interface CreateMetalStockRequest {
  metalType: MetalType;
  purity: number;
  form: MetalForm;
  grossWeight: number;
  location?: string;
  batchNumber?: string;
}

export interface CreateMetalTransactionRequest {
  transactionType: MetalTransactionType;
  metalType: MetalType;
  purity: number;
  form: MetalForm;
  grossWeight: number;
  rate?: number;
  stockId?: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  vendorId?: string;
  notes?: string;
  referenceNumber?: string;
  // Transaction date (yyyy-mm-dd or ISO). Overrides the default `createdAt`
  // so back-dated entries display under the correct day. Defaults to now() if
  // omitted (preserves backward compatibility).
  transactionDate?: string;
  // Payment tracking (only set on PURCHASE rows from ReceiveMetalPage).
  isBillable?: boolean;
  paymentMode?: string;     // 'CASH' | 'NEFT' | 'BOTH'
  paymentStatus?: string;   // 'COMPLETE' | 'HALF' | 'PENDING'
  amountPaid?: number;
  cashAmount?: number;
  neftAmount?: number;
  neftUtr?: string;
  neftBank?: string;
  neftDate?: string;        // ISO string from <input type="date">
  // Vendor credit to apply against this purchase (deducted from Vendor.creditBalance).
  // Server clamps to min(creditApplied, vendor.creditBalance, totalValue).
  creditApplied?: number;
}

export interface UpdateMetalTransactionRequest {
  // Core fields. All optional — only provided fields are changed.
  // Changing any of metalType / purity / form / grossWeight / transactionType
  // will reverse the old row's effect on metalStock and apply the new effect.
  transactionType?: MetalTransactionType;
  metalType?: MetalType;
  purity?: number;
  form?: MetalForm;
  grossWeight?: number;
  rate?: number;
  notes?: string;
  referenceNumber?: string;
  vendorId?: string | null;
  // Override the row's transaction date (stored in `createdAt`).
  transactionDate?: string;
  // Payment / billing fields. Only honored on billable PURCHASE rows that
  // have NO settlement-ledger entries yet (use the Settle flow otherwise).
  isBillable?: boolean;
  paymentMode?: string;     // 'CASH' | 'NEFT' | 'BOTH'
  paymentStatus?: string;   // 'COMPLETE' | 'HALF' | 'PENDING'
  amountPaid?: number;
  cashAmount?: number;
  neftAmount?: number;
  neftUtr?: string;
  neftBank?: string;
  neftDate?: string;
  creditApplied?: number;
}

export interface SettleMetalPaymentRequest {
  amount: number;           // Delta amount being settled NOW (not cumulative).
  paymentMode: string;      // 'CASH' | 'NEFT' | 'BOTH'
  cashAmount?: number;
  neftAmount?: number;
  neftUtr?: string;
  neftBank?: string;
  neftDate?: string;        // ISO string
  notes?: string;
  // Vendor credit to apply on top of `amount` (counts toward balance reduction).
  creditApplied?: number;
}

export interface CreateMeltingBatchRequest {
  inputMetals: Array<{
    purity: number;
    weight: number;
    form: MetalForm;
  }>;
  outputPurity: number;
  outputWeight: number;
  outputForm: MetalForm;
  notes?: string;
}

export interface CreateMetalRateRequest {
  metalType: MetalType;
  purity: number;
  ratePerGram: number;
  effectiveDate: Date;
  source?: string;
}

export interface MetalStockSummary {
  metalType: MetalType;
  purity: number;
  totalGrossWeight: number;
  totalPureWeight: number;
  totalValue: number;
}

export interface WastageReport {
  departmentId?: string;
  totalWastage: number;
  wastagePercent: number;
  period: {
    start: Date;
    end: Date;
  };
}
