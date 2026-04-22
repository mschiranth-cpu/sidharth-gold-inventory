/**
 * ============================================
 * METAL INVENTORY SERVICE
 * ============================================
 */

import api from './api';

export interface MetalStock {
  id: string;
  metalType: string;
  purity: number;
  form: string;
  grossWeight: number;
  pureWeight: number;
  location?: string;
  batchNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetalTransaction {
  id: string;
  transactionType: string;
  metalType: string;
  purity: number;
  form: string;
  grossWeight: number;
  pureWeight: number;
  rate?: number;
  totalValue?: number;
  createdAt: string;
  createdBy?: {
    name: string;
  };
}

export interface MeltingBatch {
  id: string;
  batchNumber: string;
  inputMetals: any;
  totalInputWeight: number;
  outputPurity: number;
  outputWeight: number;
  wastageWeight: number;
  wastagePercent: number;
  meltedAt: string;
  meltedBy?: {
    name: string;
  };
}

export interface MetalRate {
  id: string;
  metalType: string;
  purity: number;
  ratePerGram: number;
  effectiveDate: string;
  source?: string;
}

export async function getAllMetalStock(filters?: {
  metalType?: string;
  purity?: number;
}): Promise<MetalStock[]> {
  const response = await api.get('/metal/stock', { params: filters });
  return response.data.data;
}

export async function getMetalStockSummary() {
  const response = await api.get('/metal/stock/summary');
  return response.data.data;
}

export async function createMetalStock(data: any) {
  const response = await api.post('/metal/stock', data);
  return response.data.data;
}

export async function createMetalTransaction(data: any) {
  const response = await api.post('/metal/transactions', data);
  return response.data.data;
}

export async function getAllMetalTransactions(filters?: any): Promise<MetalTransaction[]> {
  const response = await api.get('/metal/transactions', { params: filters });
  return response.data.data;
}

export async function createMeltingBatch(data: any) {
  const response = await api.post('/metal/melting-batches', data);
  return response.data.data;
}

export async function getMeltingBatches(): Promise<MeltingBatch[]> {
  const response = await api.get('/metal/melting-batches');
  return response.data.data;
}

export async function getCurrentMetalRates(): Promise<MetalRate[]> {
  const response = await api.get('/metal/rates');
  return response.data.data;
}

export async function createMetalRate(data: any) {
  const response = await api.post('/metal/rates', data);
  return response.data.data;
}
