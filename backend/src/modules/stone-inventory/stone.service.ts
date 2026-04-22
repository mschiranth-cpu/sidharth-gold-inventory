/**
 * ============================================
 * REAL STONE & STONE INVENTORY SERVICE
 * ============================================
 */

import { PrismaClient, RealStoneType, SyntheticStoneType } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

// Real Stone functions
export async function getAllRealStones(filters?: { stoneType?: RealStoneType; status?: string }) {
  const where: any = {};
  if (filters?.stoneType) where.stoneType = filters.stoneType;
  if (filters?.status) where.status = filters.status;

  return await prisma.realStone.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createRealStone(data: any) {
  const totalPrice = data.pricePerCarat ? data.caratWeight * data.pricePerCarat : undefined;

  return await prisma.realStone.create({
    data: {
      ...data,
      totalPrice,
    },
  });
}

// Stone Packet functions
export async function getAllStonePackets(filters?: {
  stoneType?: SyntheticStoneType;
  size?: string;
}) {
  const where: any = {};
  if (filters?.stoneType) where.stoneType = filters.stoneType;
  if (filters?.size) where.size = filters.size;

  return await prisma.stonePacket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createStonePacket(data: any) {
  return await prisma.stonePacket.create({
    data: {
      ...data,
      currentPieces: data.totalPieces,
      currentWeight: data.totalWeight,
    },
  });
}

export async function createStonePacketTransaction(data: any, createdById: string) {
  const transaction = await prisma.stonePacketTransaction.create({
    data: {
      ...data,
      createdById,
    },
  });

  const packet = await prisma.stonePacket.findUnique({ where: { id: data.packetId } });
  if (packet) {
    const weightChange = data.transactionType === 'PURCHASE' ? data.quantity : -data.quantity;
    await prisma.stonePacket.update({
      where: { id: data.packetId },
      data: {
        currentWeight: packet.currentWeight + weightChange,
      },
    });
  }

  return transaction;
}
