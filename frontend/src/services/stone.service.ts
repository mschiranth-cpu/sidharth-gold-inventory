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

export async function createRealStone(data: any) {
  const response = await api.post('/stones/real', data);
  return response.data.data;
}

export async function getAllStonePackets(filters?: any): Promise<StonePacket[]> {
  const response = await api.get('/stones/packets', { params: filters });
  return response.data.data;
}

export async function createStonePacket(data: any) {
  const response = await api.post('/stones/packets', data);
  return response.data.data;
}

export async function createStonePacketTransaction(data: any) {
  const response = await api.post('/stones/packets/transactions', data);
  return response.data.data;
}
