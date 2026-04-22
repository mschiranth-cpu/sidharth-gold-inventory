/**
 * ============================================
 * DIAMOND INVENTORY SERVICE
 * ============================================
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import {
  CreateDiamondLotRequest,
  CreateDiamondRequest,
  IssueDiamondRequest,
} from './diamond.types';

const prisma = new PrismaClient();

export async function getAllDiamonds(filters?: {
  shape?: string;
  color?: string;
  clarity?: string;
  status?: string;
}) {
  const where: any = {};
  if (filters?.shape) where.shape = filters.shape;
  if (filters?.color) where.color = filters.color;
  if (filters?.clarity) where.clarity = filters.clarity;
  if (filters?.status) where.status = filters.status;

  return await prisma.diamond.findMany({
    where,
    include: {
      lot: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDiamondById(diamondId: string) {
  return await prisma.diamond.findUnique({
    where: { id: diamondId },
    include: {
      lot: true,
      transactions: {
        include: {
          createdBy: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createDiamond(data: CreateDiamondRequest) {
  const totalPrice = data.pricePerCarat ? data.caratWeight * data.pricePerCarat : undefined;

  return await prisma.diamond.create({
    data: {
      stockNumber: data.stockNumber,
      caratWeight: data.caratWeight,
      color: data.color,
      clarity: data.clarity,
      cut: data.cut,
      shape: data.shape,
      measurements: data.measurements,
      depthPercent: data.depthPercent,
      tablePercent: data.tablePercent,
      polish: data.polish,
      symmetry: data.symmetry,
      fluorescence: data.fluorescence,
      certificationLab: data.certificationLab,
      certNumber: data.certNumber,
      certDate: data.certDate,
      certUrl: data.certUrl,
      pricePerCarat: data.pricePerCarat,
      totalPrice: totalPrice,
      lotId: data.lotId,
    },
  });
}

export async function issueDiamond(data: IssueDiamondRequest, createdById: string) {
  const diamond = await prisma.diamond.update({
    where: { id: data.diamondId },
    data: {
      status: 'ISSUED',
      issuedToOrderId: data.orderId,
      issuedAt: new Date(),
    },
  });

  await prisma.diamondTransaction.create({
    data: {
      diamondId: data.diamondId,
      transactionType: 'ISSUE',
      orderId: data.orderId,
      notes: data.notes,
      createdById: createdById,
    },
  });

  logger.info('Diamond issued', { diamondId: data.diamondId, orderId: data.orderId });
  return diamond;
}

export async function getAllDiamondLots() {
  return await prisma.diamondLot.findMany({
    include: {
      diamonds: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createDiamondLot(data: CreateDiamondLotRequest) {
  return await prisma.diamondLot.create({
    data,
  });
}
