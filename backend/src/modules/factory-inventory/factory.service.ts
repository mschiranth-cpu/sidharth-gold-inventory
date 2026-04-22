/**
 * ============================================
 * FACTORY INVENTORY SERVICE
 * ============================================
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export async function getAllCategories() {
  return await prisma.factoryItemCategory.findMany({
    include: {
      parent: true,
      children: true,
      items: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(data: {
  name: string;
  description?: string;
  parentId?: string;
}) {
  return await prisma.factoryItemCategory.create({
    data,
  });
}

export async function getAllFactoryItems(filters?: { categoryId?: string; isEquipment?: boolean }) {
  const where: any = {};
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.isEquipment !== undefined) where.isEquipment = filters.isEquipment;

  return await prisma.factoryItem.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getFactoryItemById(itemId: string) {
  return await prisma.factoryItem.findUnique({
    where: { id: itemId },
    include: {
      category: true,
      transactions: {
        include: {
          createdBy: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      maintenanceLogs: {
        include: {
          createdBy: {
            select: { name: true },
          },
        },
        orderBy: { performedAt: 'desc' },
      },
    },
  });
}

export async function createFactoryItem(data: any) {
  return await prisma.factoryItem.create({
    data,
    include: {
      category: true,
    },
  });
}

export async function updateFactoryItem(itemId: string, data: any) {
  return await prisma.factoryItem.update({
    where: { id: itemId },
    data,
  });
}

export async function createFactoryItemTransaction(data: any, createdById: string) {
  const transaction = await prisma.factoryItemTransaction.create({
    data: {
      ...data,
      createdById,
    },
  });

  const item = await prisma.factoryItem.findUnique({ where: { id: data.itemId } });
  if (item) {
    const qtyChange = data.transactionType === 'PURCHASE' ? data.quantity : -data.quantity;
    await prisma.factoryItem.update({
      where: { id: data.itemId },
      data: {
        currentStock: item.currentStock + qtyChange,
      },
    });
  }

  return transaction;
}

export async function createEquipmentMaintenance(data: any, createdById: string) {
  return await prisma.equipmentMaintenance.create({
    data: {
      ...data,
      createdById,
    },
    include: {
      equipment: true,
      createdBy: {
        select: { name: true },
      },
    },
  });
}

export async function getEquipmentMaintenance(equipmentId?: string) {
  const where: any = {};
  if (equipmentId) where.equipmentId = equipmentId;

  return await prisma.equipmentMaintenance.findMany({
    where,
    include: {
      equipment: {
        select: {
          name: true,
          itemCode: true,
        },
      },
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { performedAt: 'desc' },
  });
}
