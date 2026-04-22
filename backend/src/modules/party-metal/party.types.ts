/**
 * ============================================
 * PARTY METAL INVENTORY TYPES
 * ============================================
 */

import { MetalType } from '@prisma/client';

export interface CreatePartyRequest {
  name: string;
  type: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
}

export interface CreatePartyMetalTransactionRequest {
  partyId: string;
  transactionType: string;
  metalType: MetalType;
  grossWeight: number;
  declaredPurity: number;
  testedPurity?: number;
  orderId?: string;
  voucherNumber: string;
  notes?: string;
}

export interface PartyMetalBalance {
  partyId: string;
  partyName: string;
  metalType: MetalType;
  purity: number;
  grossBalance: number;
  pureBalance: number;
}
