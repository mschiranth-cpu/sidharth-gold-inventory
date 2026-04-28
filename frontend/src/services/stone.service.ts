/**
 * ============================================
 * STONE INVENTORY SERVICE
 * ============================================
 */

import api from './api';

export interface RealStone {
  id: string;
  stockNumber: string;
  stoneType: string;
  caratWeight: number;
  shape: string;
  color: string;
  clarity?: string;
  origin?: string;
  treatment?: string;
  treatmentNotes?: string | null;
  pricePerCarat?: number;
  totalPrice?: number;
  status: string;
  createdAt: string;
}

export interface StonePacket {
  id: string;
  packetNumber: string;
  stoneType: string;
  shape: string;
  size: string;
  color: string;
  quality?: string;
  totalPieces?: number | null;
  currentPieces?: number | null;
  totalWeight: number;
  currentWeight: number;
  unit: string;
  pricePerUnit?: number;
  reorderLevel?: number | null;
  createdAt: string;
}

export async function getAllRealStones(filters?: any): Promise<RealStone[]> {
  const response = await api.get('/stones/real', { params: filters });
  return response.data.data;
}

export async function getRealStoneById(id: string): Promise<RealStone> {
  const response = await api.get(`/stones/real/${id}`);
  return response.data.data;
}

/** Legacy single-stone create — kept for backward-compat. New flows should use {@link createRealStonePurchase}. */
export async function createRealStone(data: any) {
  const response = await api.post('/stones/real', data);
  return response.data.data;
}

export async function getAllStonePackets(filters?: any): Promise<StonePacket[]> {
  const response = await api.get('/stones/packets', { params: filters });
  return response.data.data;
}

export async function getStonePacketById(id: string): Promise<StonePacket> {
  const response = await api.get(`/stones/packets/${id}`);
  return response.data.data;
}

/** Legacy single-packet create — kept for backward-compat. New flows should use {@link createStonePacketPurchase}. */
export async function createStonePacket(data: any) {
  const response = await api.post('/stones/packets', data);
  return response.data.data;
}

/**
 * @deprecated kept only so the soon-to-be-deleted `StoneTransactionsPage`
 * still compiles. Use {@link createStonePacketTransactionV2} (the unified
 * `POST /stones/packets/transactions`) instead.
 */
export async function createStonePacketTransaction(data: any) {
  const response = await api.post('/stones/packets/transactions', data);
  return response.data.data;
}

// ============================================================================
// PARITY-WITH-DIAMOND TYPES + FUNCTIONS (Stone Inventory Parity, Phases 5-8)
// ============================================================================

export interface RealStonePayment {
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

export interface RealStoneTransaction {
  id: string;
  /**
   * 'PURCHASE' | 'ISSUE_TO_DEPARTMENT' | 'RETURN_FROM_DEPARTMENT'
   * | 'TRANSFER' | 'ADJUSTMENT'
   */
  transactionType: string;
  stoneId: string;
  stone?: {
    id?: string;
    stockNumber: string;
    stoneType?: string;
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
  caratWeight?: number | null;
  pricePerCarat?: number | null;
  totalValue?: number | null;
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
  payments?: RealStonePayment[];
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

export interface RealStoneRate {
  id: string;
  stoneType: string;
  quality?: string | null;
  caratFrom: number;
  caratTo: number;
  pricePerCarat: number;
  effectiveDate: string;
  source?: string | null;
  createdBy?: { name: string };
}

export interface RealStoneStockSummary {
  totalStones: number;
  totalCarats: number;
  totalValue: number;
  byStoneType: Array<{ stoneType: string; count: number; carats: number; value: number }>;
  byQuality: Array<{ quality: string; count: number; carats: number; value: number }>;
}

export interface StonePacketPayment {
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

export interface StonePacketTransaction {
  id: string;
  transactionType: string;
  packetId: string;
  packet?: {
    id?: string;
    packetNumber: string;
    stoneType?: string;
    size?: string;
    color?: string;
    quality?: string;
    unit?: string;
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
  quantity?: number | null;
  unit?: string | null;
  pricePerUnit?: number | null;
  totalValue?: number | null;
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
  payments?: StonePacketPayment[];
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
  byStoneType: Array<{ stoneType: string; count: number; pieces: number; weight: number; value: number }>;
  byQuality: Array<{ quality: string; count: number; pieces: number; weight: number; value: number }>;
}

// ----- Real Stone -----

export async function getRealStoneStockSummary(): Promise<RealStoneStockSummary> {
  const response = await api.get('/stones/real/stock/summary');
  return response.data.data;
}

export async function getAllRealStoneTransactions(filters?: {
  transactionType?: string;
  vendorId?: string;
  isBillable?: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<RealStoneTransaction[]> {
  const response = await api.get('/stones/real/transactions', { params: filters });
  return response.data.data;
}

/** Unified `POST /stones/real/transactions` (must include `transactionType`). */
export async function createRealStoneTransaction(
  data: any
): Promise<RealStoneTransaction | RealStoneTransaction[]> {
  const response = await api.post('/stones/real/transactions', data);
  return response.data.data;
}

/** Convenience: multi-item PURCHASE invoice. */
export async function createRealStonePurchase(data: {
  vendorId?: string;
  referenceNumber?: string;
  transactionDate?: string;
  notes?: string;
  items: any[];
}): Promise<RealStoneTransaction[]> {
  const response = await api.post('/stones/real/transactions', {
    transactionType: 'PURCHASE',
    ...data,
  });
  return response.data.data;
}

export async function issueRealStoneV2(data: {
  stoneId: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  notes?: string;
  transactionDate?: string;
}): Promise<RealStoneTransaction> {
  const response = await api.post('/stones/real/transactions', {
    transactionType: 'ISSUE_TO_DEPARTMENT',
    ...data,
  });
  return response.data.data;
}

export async function transferRealStone(data: {
  stoneId: string;
  fromLocation?: string;
  toLocation: string;
  notes?: string;
  transactionDate?: string;
}): Promise<RealStoneTransaction> {
  const response = await api.post('/stones/real/transactions', {
    transactionType: 'TRANSFER',
    ...data,
  });
  return response.data.data;
}

export async function adjustRealStone(data: {
  stoneId: string;
  deltaCarats?: number;
  notes?: string;
  transactionDate?: string;
}): Promise<RealStoneTransaction> {
  const response = await api.post('/stones/real/transactions', {
    transactionType: 'ADJUSTMENT',
    ...data,
  });
  return response.data.data;
}

export async function returnRealStoneFromDepartment(data: {
  stoneId: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  notes?: string;
  transactionDate?: string;
}): Promise<RealStoneTransaction> {
  const response = await api.post('/stones/real/transactions', {
    transactionType: 'RETURN_FROM_DEPARTMENT',
    ...data,
  });
  return response.data.data;
}

export async function updateRealStoneTransaction(
  id: string,
  data: any
): Promise<RealStoneTransaction> {
  const response = await api.patch(`/stones/real/transactions/${id}`, data);
  return response.data.data;
}

export async function deleteRealStoneTransaction(id: string) {
  const response = await api.delete(`/stones/real/transactions/${id}`);
  return response.data.data;
}

export async function settleRealStonePayment(
  id: string,
  data: SettleRealStonePaymentRequest
): Promise<RealStoneTransaction> {
  const response = await api.patch(`/stones/real/transactions/${id}/payment`, data);
  return response.data.data;
}

export async function getRealStonePayments(transactionId: string): Promise<RealStonePayment[]> {
  const response = await api.get(`/stones/real/transactions/${transactionId}/payments`);
  return response.data.data;
}

export async function exportRealStoneTransactionsXlsx(filters?: {
  transactionType?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
  taxClass?: 'BILLABLE' | 'NON_BILLABLE';
}): Promise<Blob> {
  const response = await api.get('/stones/real/transactions/export', {
    params: filters,
    responseType: 'blob',
  });
  return response.data as Blob;
}

export async function getCurrentRealStoneRates(): Promise<RealStoneRate[]> {
  const response = await api.get('/stones/real/rates');
  return response.data.data;
}

export async function createRealStoneRate(data: {
  stoneType: string;
  quality?: string;
  caratFrom: number;
  caratTo: number;
  pricePerCarat: number;
  effectiveDate: string;
  source?: string;
}): Promise<RealStoneRate> {
  const response = await api.post('/stones/real/rates', data);
  return response.data.data;
}

// ----- Stone Packet -----

export async function getStonePacketStockSummary(): Promise<StonePacketStockSummary> {
  const response = await api.get('/stones/packets/stock/summary');
  return response.data.data;
}

export async function getAllStonePacketTransactions(filters?: {
  transactionType?: string;
  vendorId?: string;
  isBillable?: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<StonePacketTransaction[]> {
  const response = await api.get('/stones/packets/transactions', { params: filters });
  return response.data.data;
}

/** Unified `POST /stones/packets/transactions` (must include `transactionType`). */
export async function createStonePacketTransactionV2(
  data: any
): Promise<StonePacketTransaction | StonePacketTransaction[]> {
  const response = await api.post('/stones/packets/transactions', data);
  return response.data.data;
}

/** Convenience: multi-item PURCHASE invoice. */
export async function createStonePacketPurchase(data: {
  vendorId?: string;
  referenceNumber?: string;
  transactionDate?: string;
  notes?: string;
  items: any[];
}): Promise<StonePacketTransaction[]> {
  const response = await api.post('/stones/packets/transactions', {
    transactionType: 'PURCHASE',
    ...data,
  });
  return response.data.data;
}

export async function issueStonePacket(data: {
  packetId: string;
  quantity: number;
  unit?: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  notes?: string;
  transactionDate?: string;
}): Promise<StonePacketTransaction> {
  const response = await api.post('/stones/packets/transactions', {
    transactionType: 'ISSUE_TO_DEPARTMENT',
    ...data,
  });
  return response.data.data;
}

export async function transferStonePacket(data: {
  packetId: string;
  fromLocation?: string;
  toLocation: string;
  notes?: string;
  transactionDate?: string;
}): Promise<StonePacketTransaction> {
  const response = await api.post('/stones/packets/transactions', {
    transactionType: 'TRANSFER',
    ...data,
  });
  return response.data.data;
}

export async function adjustStonePacket(data: {
  packetId: string;
  deltaQuantity?: number;
  unit?: string;
  notes?: string;
  transactionDate?: string;
}): Promise<StonePacketTransaction> {
  const response = await api.post('/stones/packets/transactions', {
    transactionType: 'ADJUSTMENT',
    ...data,
  });
  return response.data.data;
}

export async function returnStonePacketFromDepartment(data: {
  packetId: string;
  quantity: number;
  unit?: string;
  orderId?: string;
  departmentId?: string;
  workerId?: string;
  notes?: string;
  transactionDate?: string;
}): Promise<StonePacketTransaction> {
  const response = await api.post('/stones/packets/transactions', {
    transactionType: 'RETURN_FROM_DEPARTMENT',
    ...data,
  });
  return response.data.data;
}

export async function updateStonePacketTransaction(
  id: string,
  data: any
): Promise<StonePacketTransaction> {
  const response = await api.patch(`/stones/packets/transactions/${id}`, data);
  return response.data.data;
}

export async function deleteStonePacketTransaction(id: string) {
  const response = await api.delete(`/stones/packets/transactions/${id}`);
  return response.data.data;
}

export async function settleStonePacketPayment(
  id: string,
  data: SettleStonePacketPaymentRequest
): Promise<StonePacketTransaction> {
  const response = await api.patch(`/stones/packets/transactions/${id}/payment`, data);
  return response.data.data;
}

export async function getStonePacketPayments(
  transactionId: string
): Promise<StonePacketPayment[]> {
  const response = await api.get(`/stones/packets/transactions/${transactionId}/payments`);
  return response.data.data;
}

export async function exportStonePacketTransactionsXlsx(filters?: {
  transactionType?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
  taxClass?: 'BILLABLE' | 'NON_BILLABLE';
}): Promise<Blob> {
  const response = await api.get('/stones/packets/transactions/export', {
    params: filters,
    responseType: 'blob',
  });
  return response.data as Blob;
}

export async function getLowStockStonePackets(): Promise<StonePacket[]> {
  const response = await api.get('/stones/packets/low-stock');
  return response.data.data;
}
