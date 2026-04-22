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
  supplierId?: string;
  notes?: string;
  referenceNumber?: string;
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
