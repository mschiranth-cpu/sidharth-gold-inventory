/**
 * ============================================
 * DIAMOND INVENTORY TYPES
 * ============================================
 */

import { DiamondShape, DiamondClarity, DiamondColor, DiamondCut } from '@prisma/client';

export interface CreateDiamondLotRequest {
  lotNumber: string;
  description?: string;
  totalPieces: number;
  totalCarats: number;
  avgPricePerCarat?: number;
  supplierId?: string;
  purchaseDate?: Date;
}

export interface CreateDiamondRequest {
  stockNumber: string;
  caratWeight: number;
  color: DiamondColor;
  clarity: DiamondClarity;
  cut?: DiamondCut;
  shape: DiamondShape;
  measurements?: string;
  depthPercent?: number;
  tablePercent?: number;
  polish?: string;
  symmetry?: string;
  fluorescence?: string;
  certificationLab?: string;
  certNumber?: string;
  certDate?: Date;
  certUrl?: string;
  pricePerCarat?: number;
  lotId?: string;
}

export interface IssueDiamondRequest {
  diamondId: string;
  orderId: string;
  notes?: string;
}
