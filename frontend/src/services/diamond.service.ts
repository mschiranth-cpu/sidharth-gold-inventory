/**
 * ============================================
 * DIAMOND INVENTORY SERVICE
 * ============================================
 */

import api from './api';

export interface Diamond {
  id: string;
  stockNumber: string;
  /** 'LOOSE' (parcel) or 'SOLITAIRE' (individually graded). */
  category?: 'LOOSE' | 'SOLITAIRE';
  caratWeight: number;
  color: string;
  /** Color band string for LOOSE pieces, e.g. 'D/E', 'E/F', 'F/G'. */
  colorBand?: string | null;
  clarity: string;
  cut?: string;
  shape: string;
  measurements?: string;
  certificationLab?: string;
  certNumber?: string;
  pricePerCarat?: number;
  totalPrice?: number;
  status: string;
  createdAt: string;
}

export interface DiamondLot {
  id: string;
  lotNumber: string;
  description?: string;
  totalPieces: number;
  totalCarats: number;
  avgPricePerCarat?: number;
  purchaseDate?: string | null;
  createdAt: string;
  diamonds?: Diamond[];
}

export async function getAllDiamonds(filters?: any): Promise<Diamond[]> {
  const response = await api.get('/diamonds', { params: filters });
  return response.data.data;
}

export async function getDiamondById(diamondId: string): Promise<Diamond> {
  const response = await api.get(`/diamonds/${diamondId}`);
  return response.data.data;
}

export async function createDiamond(data: any) {
  const response = await api.post('/diamonds', data);
  return response.data.data;
}

export async function issueDiamond(data: any) {
  const response = await api.post('/diamonds/issue', data);
  return response.data.data;
}

export async function getAllDiamondLots(): Promise<DiamondLot[]> {
  const response = await api.get('/diamonds/lots/all');
  return response.data.data;
}

export async function createDiamondLot(data: any) {
  const response = await api.post('/diamonds/lots', data);
  return response.data.data;
}

// ============================================================================
// PARITY-WITH-METAL TYPES + FUNCTIONS (Phase 3 — full diamond inventory parity)
// ============================================================================

export interface DiamondTransaction {
  id: string;
  /**
   * 'PURCHASE' | 'ISSUE_TO_DEPARTMENT' | 'RETURN_FROM_DEPARTMENT'
   * | 'TRANSFER' | 'ADJUSTMENT'
   */
  transactionType: string;
  diamondId: string;
  diamond?: {
    id?: string;
    stockNumber: string;
    category?: 'LOOSE' | 'SOLITAIRE';
    shape?: string;
    color?: string;
    clarity?: string;
  } | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  orderId?: string | null;
  departmentId?: string | null;
  workerId?: string | null;
  vendorId?: string | null;
  vendor?: { id: string; name: string; uniqueCode: string; creditBalance?: number } | null;
  notes?: string | null;
  referenceNumber?: string | null;
  createdAt: string;
  createdBy?: { name: string };
  // Snapshot fields
  caratWeight?: number | null;
  pricePerCarat?: number | null;
  totalValue?: number | null;
  quantityPieces?: number | null;
  // Billing / payment
  isBillable?: boolean | null;
  paymentMode?: string | null;
  paymentStatus?: string | null;
  amountPaid?: number | null;
  cashAmount?: number | null;
  neftAmount?: number | null;
  neftUtr?: string | null;
  neftBank?: string | null;
  neftDate?: string | null;
  creditApplied?: number | null;
  creditGenerated?: number | null;
  payments?: DiamondPayment[];
}

export interface DiamondPayment {
  id: string;
  transactionId: string;
  amount: number;
  paymentMode: string;
  cashAmount?: number | null;
  neftAmount?: number | null;
  neftUtr?: string | null;
  neftBank?: string | null;
  neftDate?: string | null;
  notes?: string | null;
  creditApplied?: number | null;
  creditGenerated?: number | null;
  recordedAt: string;
  recordedBy?: { id: string; name: string; email?: string } | null;
}

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

export interface DiamondRate {
  id: string;
  shape: string;
  color: string;
  clarity: string;
  caratFrom: number;
  caratTo: number;
  pricePerCarat: number;
  effectiveDate: string;
  source?: string | null;
  createdBy?: { name: string };
}

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
  byShape: Array<{ shape: string; count: number; carats: number; value: number }>;
}

export async function getDiamondStockSummary(): Promise<DiamondStockSummary> {
  const response = await api.get('/diamonds/stock/summary');
  return response.data.data;
}

export async function getAllDiamondTransactions(filters?: {
  transactionType?: string;
  vendorId?: string;
  isBillable?: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<DiamondTransaction[]> {
  const response = await api.get('/diamonds/transactions', { params: filters });
  return response.data.data;
}

/**
 * Unified `POST /diamonds/transactions`. The request body must include
 * `transactionType` to discriminate. See diamond.types.ts on the backend
 * for the exact shape per type.
 */
export async function createDiamondTransaction(data: any): Promise<DiamondTransaction | DiamondTransaction[]> {
  const response = await api.post('/diamonds/transactions', data);
  return response.data.data;
}

/** Convenience: multi-item PURCHASE invoice. */
export async function createDiamondPurchase(data: {
  vendorId?: string;
  referenceNumber?: string;
  transactionDate?: string;
  notes?: string;
  items: any[];
}): Promise<DiamondTransaction[]> {
  const response = await api.post('/diamonds/transactions', { transactionType: 'PURCHASE', ...data });
  return response.data.data;
}

/** Convenience: V2 issue (parcel-aware). */
export async function issueDiamondV2(data: {
  diamondId: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  quantityPieces?: number;
  caratWeight?: number;
  notes?: string;
  transactionDate?: string;
}): Promise<DiamondTransaction> {
  const response = await api.post('/diamonds/transactions', {
    transactionType: 'ISSUE_TO_DEPARTMENT',
    ...data,
  });
  return response.data.data;
}

export async function transferDiamond(data: {
  diamondId: string;
  fromLocation?: string;
  toLocation: string;
  notes?: string;
  transactionDate?: string;
}): Promise<DiamondTransaction> {
  const response = await api.post('/diamonds/transactions', { transactionType: 'TRANSFER', ...data });
  return response.data.data;
}

export async function adjustDiamond(data: {
  diamondId: string;
  deltaPieces?: number;
  deltaCarats?: number;
  notes?: string;
  transactionDate?: string;
}): Promise<DiamondTransaction> {
  const response = await api.post('/diamonds/transactions', { transactionType: 'ADJUSTMENT', ...data });
  return response.data.data;
}

export async function returnDiamondFromDepartment(data: {
  diamondId: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  quantityPieces?: number;
  caratWeight?: number;
  notes?: string;
  transactionDate?: string;
}): Promise<DiamondTransaction> {
  const response = await api.post('/diamonds/transactions', {
    transactionType: 'RETURN_FROM_DEPARTMENT',
    ...data,
  });
  return response.data.data;
}

export async function updateDiamondTransaction(id: string, data: any): Promise<DiamondTransaction> {
  const response = await api.patch(`/diamonds/transactions/${id}`, data);
  return response.data.data;
}

export async function deleteDiamondTransaction(id: string) {
  const response = await api.delete(`/diamonds/transactions/${id}`);
  return response.data.data;
}

export async function settleDiamondPayment(
  id: string,
  data: SettleDiamondPaymentRequest
): Promise<DiamondTransaction> {
  const response = await api.patch(`/diamonds/transactions/${id}/payment`, data);
  return response.data.data;
}

export async function getDiamondPayments(transactionId: string): Promise<DiamondPayment[]> {
  const response = await api.get(`/diamonds/transactions/${transactionId}/payments`);
  return response.data.data;
}

export async function exportDiamondTransactionsXlsx(filters?: {
  transactionType?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
  taxClass?: 'BILLABLE' | 'NON_BILLABLE';
}): Promise<Blob> {
  const response = await api.get('/diamonds/transactions/export', {
    params: filters,
    responseType: 'blob',
  });
  return response.data as Blob;
}

export async function getCurrentDiamondRates(): Promise<DiamondRate[]> {
  const response = await api.get('/diamonds/rates');
  return response.data.data;
}

export async function createDiamondRate(data: {
  shape: string;
  color: string;
  clarity: string;
  caratFrom: number;
  caratTo: number;
  pricePerCarat: number;
  effectiveDate: string;
  source?: string;
}): Promise<DiamondRate> {
  const response = await api.post('/diamonds/rates', data);
  return response.data.data;
}
