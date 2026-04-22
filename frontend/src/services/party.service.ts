/**
 * ============================================
 * PARTY METAL INVENTORY SERVICE
 * ============================================
 */

import api from './api';

export interface Party {
  id: string;
  name: string;
  type: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  createdAt: string;
  updatedAt: string;
  metalAccounts?: PartyMetalAccount[];
  transactions?: PartyMetalTransaction[];
}

export interface PartyMetalAccount {
  id: string;
  partyId: string;
  metalType: string;
  purity: number;
  grossBalance: number;
  pureBalance: number;
  updatedAt: string;
}

export interface PartyMetalTransaction {
  id: string;
  partyId: string;
  transactionType: string;
  metalType: string;
  grossWeight: number;
  testedPurity?: number;
  declaredPurity: number;
  pureWeight: number;
  voucherNumber: string;
  notes?: string;
  createdAt: string;
  createdBy?: {
    name: string;
  };
}

export async function getAllParties(filters?: {
  type?: string;
  search?: string;
}): Promise<Party[]> {
  const response = await api.get('/parties', { params: filters });
  return response.data.data;
}

export async function getPartyById(partyId: string): Promise<Party> {
  const response = await api.get(`/parties/${partyId}`);
  return response.data.data;
}

export async function createParty(data: any) {
  const response = await api.post('/parties', data);
  return response.data.data;
}

export async function updateParty(partyId: string, data: any) {
  const response = await api.put(`/parties/${partyId}`, data);
  return response.data.data;
}

export async function createPartyMetalTransaction(data: any) {
  const response = await api.post('/parties/transactions', data);
  return response.data.data;
}

export async function getPartyMetalTransactions(partyId: string): Promise<PartyMetalTransaction[]> {
  const response = await api.get(`/parties/${partyId}/transactions`);
  return response.data.data;
}

export async function getPartyMetalAccounts(partyId: string): Promise<PartyMetalAccount[]> {
  const response = await api.get(`/parties/${partyId}/accounts`);
  return response.data.data;
}
