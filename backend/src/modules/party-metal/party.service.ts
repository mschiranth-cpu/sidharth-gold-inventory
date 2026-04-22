/**
 * ============================================
 * PARTY METAL INVENTORY SERVICE
 * ============================================
 */

import { PrismaClient, MetalType } from '@prisma/client';
import { logger } from '../../utils/logger';
import { CreatePartyRequest, CreatePartyMetalTransactionRequest } from './party.types';

const prisma = new PrismaClient();

function calculatePureWeight(grossWeight: number, purity: number): number {
  return (grossWeight * purity) / 24;
}

export async function getAllParties(filters?: { type?: string; search?: string }) {
  const where: any = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return await prisma.party.findMany({
    where,
    include: {
      metalAccounts: true,
      transactions: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getPartyById(partyId: string) {
  return await prisma.party.findUnique({
    where: { id: partyId },
    include: {
      metalAccounts: true,
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

export async function createParty(data: CreatePartyRequest) {
  return await prisma.party.create({
    data: {
      name: data.name,
      type: data.type,
      phone: data.phone,
      email: data.email,
      address: data.address,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
    },
  });
}

export async function updateParty(partyId: string, data: Partial<CreatePartyRequest>) {
  return await prisma.party.update({
    where: { id: partyId },
    data,
  });
}

export async function createPartyMetalTransaction(
  data: CreatePartyMetalTransactionRequest,
  createdById: string
) {
  const pureWeight = data.testedPurity
    ? calculatePureWeight(data.grossWeight, data.testedPurity)
    : calculatePureWeight(data.grossWeight, data.declaredPurity);

  const transaction = await prisma.partyMetalTransaction.create({
    data: {
      partyId: data.partyId,
      transactionType: data.transactionType,
      metalType: data.metalType,
      grossWeight: data.grossWeight,
      testedPurity: data.testedPurity,
      declaredPurity: data.declaredPurity,
      pureWeight: pureWeight,
      orderId: data.orderId,
      voucherNumber: data.voucherNumber,
      notes: data.notes,
      createdById: createdById,
    },
    include: {
      party: true,
      createdBy: {
        select: { name: true },
      },
    },
  });

  const purityToUse = data.testedPurity || data.declaredPurity;
  const account = await prisma.partyMetalAccount.findUnique({
    where: {
      partyId_metalType_purity: {
        partyId: data.partyId,
        metalType: data.metalType,
        purity: purityToUse,
      },
    },
  });

  const weightChange = data.transactionType === 'RECEIVED' ? data.grossWeight : -data.grossWeight;

  if (account) {
    await prisma.partyMetalAccount.update({
      where: { id: account.id },
      data: {
        grossBalance: account.grossBalance + weightChange,
        pureBalance:
          account.pureBalance + pureWeight * (data.transactionType === 'RECEIVED' ? 1 : -1),
      },
    });
  } else if (data.transactionType === 'RECEIVED') {
    await prisma.partyMetalAccount.create({
      data: {
        partyId: data.partyId,
        metalType: data.metalType,
        purity: purityToUse,
        grossBalance: data.grossWeight,
        pureBalance: pureWeight,
      },
    });
  }

  logger.info('Party metal transaction created', { transactionId: transaction.id });
  return transaction;
}

export async function getPartyMetalTransactions(partyId: string) {
  return await prisma.partyMetalTransaction.findMany({
    where: { partyId },
    include: {
      createdBy: {
        select: { name: true },
      },
      order: {
        select: {
          orderNumber: true,
          customerName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPartyMetalAccounts(partyId: string) {
  return await prisma.partyMetalAccount.findMany({
    where: { partyId },
    orderBy: [{ metalType: 'asc' }, { purity: 'desc' }],
  });
}
