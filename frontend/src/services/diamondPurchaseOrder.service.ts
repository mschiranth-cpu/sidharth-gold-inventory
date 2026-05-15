import api from './api';

export type DiamondPoStatus =
  | 'DRAFT'
  | 'PLACED'
  | 'PARTIALLY_RECEIVED'
  | 'FULLY_RECEIVED'
  | 'CANCELLED';

export interface DiamondPoLine {
  id?: string;
  poId?: string;
  sieveSizeId: number;
  shape?: string | null;
  color?: string | null;
  clarity?: string | null;
  expectedPieces?: number | null;
  expectedCarats: number;
  expectedRate?: number | null;
  expectedTotal?: number | null;
  notes?: string | null;
  sieveSize?: {
    id: number;
    code: string;
    sizeLabel: string | null;
    piecesPerCaratAvg: number | null;
    kind: 'MESH' | 'SINGLE';
  } | null;
  /** Variance fields only present on detail GET. */
  receivedCarats?: number;
  receivedPieces?: number;
  varianceCarats?: number;
  variancePieces?: number;
}

export interface DiamondPurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  status: DiamondPoStatus;
  placedAt: string | null;
  expectedDeliveryDate: string | null;
  dueDate: string | null;
  notes: string | null;
  createdById: string;
  cancelledAt: string | null;
  cancelledById: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    name: string;
    uniqueCode: string;
    paymentDueDays?: number | null;
  } | null;
  createdBy?: { id: string; name: string } | null;
  lines: DiamondPoLine[];
  /** Detail GET only. */
  totalExpectedCarats?: number;
  totalReceivedCarats?: number;
  totalExpectedValue?: number;
}

export interface CreateDiamondPoInput {
  vendorId: string;
  status?: 'DRAFT' | 'PLACED';
  expectedDeliveryDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  lines: Array<{
    sieveSizeId: number;
    shape?: string | null;
    color?: string | null;
    clarity?: string | null;
    expectedPieces?: number | null;
    expectedCarats: number;
    expectedRate?: number | null;
    expectedTotal?: number | null;
    notes?: string | null;
  }>;
}

export interface UpdateDiamondPoInput {
  expectedDeliveryDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  lines?: CreateDiamondPoInput['lines'];
}

export interface ReceiveAgainstPoInput {
  referenceNumber?: string;
  notes?: string | null;
  isBillable?: boolean;
  paymentMode?: string;
  paymentStatus?: string;
  amountPaid?: number;
  cashAmount?: number;
  neftAmount?: number;
  neftUtr?: string;
  neftBank?: string;
  neftDate?: string;
  lines: Array<{
    poLineId: string;
    shape: string;
    color: string;
    colorBand?: string;
    clarity: string;
    caratWeight: number;
    pieces: number;
    pricePerCarat: number;
    stockNumber?: string;
    notes?: string;
  }>;
}

export async function createDiamondPo(
  input: CreateDiamondPoInput
): Promise<DiamondPurchaseOrder> {
  const r = await api.post('/diamond-purchase-orders', input);
  return r.data.data;
}

export async function listDiamondPos(opts?: {
  vendorId?: string;
  status?: DiamondPoStatus;
}): Promise<DiamondPurchaseOrder[]> {
  const params: Record<string, string> = {};
  if (opts?.vendorId) params.vendorId = opts.vendorId;
  if (opts?.status) params.status = opts.status;
  const r = await api.get('/diamond-purchase-orders', { params });
  return r.data.data;
}

export async function getDiamondPo(id: string): Promise<DiamondPurchaseOrder> {
  const r = await api.get(`/diamond-purchase-orders/${id}`);
  return r.data.data;
}

export async function updateDiamondPo(
  id: string,
  input: UpdateDiamondPoInput
): Promise<DiamondPurchaseOrder> {
  const r = await api.put(`/diamond-purchase-orders/${id}`, input);
  return r.data.data;
}

export async function placeDiamondPo(
  id: string
): Promise<DiamondPurchaseOrder> {
  const r = await api.post(`/diamond-purchase-orders/${id}/place`);
  return r.data.data;
}

export async function cancelDiamondPo(
  id: string,
  reason?: string,
  force = false
): Promise<DiamondPurchaseOrder> {
  const r = await api.post(
    `/diamond-purchase-orders/${id}/cancel${force ? '?force=true' : ''}`,
    { reason }
  );
  return r.data.data;
}

export async function receiveAgainstPo(
  id: string,
  input: ReceiveAgainstPoInput
): Promise<DiamondPurchaseOrder> {
  const r = await api.post(`/diamond-purchase-orders/${id}/receive`, input);
  return r.data.data;
}

export const DIAMOND_PO_STATUS_LABEL: Record<DiamondPoStatus, string> = {
  DRAFT: 'Draft',
  PLACED: 'Placed',
  PARTIALLY_RECEIVED: 'Partial',
  FULLY_RECEIVED: 'Fully Received',
  CANCELLED: 'Cancelled',
};

export const DIAMOND_PO_STATUS_CLS: Record<DiamondPoStatus, string> = {
  DRAFT: 'bg-onyx-100 text-onyx-700 border-onyx-200',
  PLACED: 'bg-azure-50 text-azure-700 border-azure-200',
  PARTIALLY_RECEIVED: 'bg-amber-50 text-amber-700 border-amber-200',
  FULLY_RECEIVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};
