/**
 * ============================================
 * DIAMOND INVENTORY SERVICE
 * ============================================
 */

import api from './api';

export interface Diamond {
  id: string;
  stockNumber: string;
  caratWeight: number;
  color: string;
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
