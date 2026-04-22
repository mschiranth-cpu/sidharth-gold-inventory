/**
 * ============================================
 * GOLD RATE API SERVICE
 * ============================================
 * Integration with GoldPriceZ.com API
 */

import axios from 'axios';
import { PrismaClient, MetalType } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const GOLD_API_KEY = process.env.GOLD_API_KEY || '';
const GOLD_API_URL = 'https://goldpricez.com/api/rates';

interface GoldRateResponse {
  price_gram_24k: number;
  price_gram_22k: number;
  price_gram_18k: number;
  price_gram_14k: number;
  currency: string;
  timestamp: string;
}

export async function fetchGoldRatesFromAPI(): Promise<GoldRateResponse | null> {
  try {
    if (!GOLD_API_KEY) {
      logger.warn('Gold API key not configured');
      return null;
    }

    const response = await axios.get(`${GOLD_API_URL}/currency/inr/measure/gram`, {
      headers: {
        'X-API-KEY': GOLD_API_KEY,
      },
      timeout: 10000,
    });

    logger.info('Gold rates fetched from API', { data: response.data });
    return response.data;
  } catch (error: any) {
    logger.error('Failed to fetch gold rates from API', {
      error: error.message,
      status: error.response?.status,
    });
    return null;
  }
}

export async function updateGoldRatesInDatabase(systemUserId: string): Promise<void> {
  try {
    const rates = await fetchGoldRatesFromAPI();

    if (!rates) {
      logger.warn('No rates to update');
      return;
    }

    const effectiveDate = new Date();

    const ratesToCreate = [
      { purity: 24, rate: rates.price_gram_24k },
      { purity: 22, rate: rates.price_gram_22k },
      { purity: 18, rate: rates.price_gram_18k },
      { purity: 14, rate: rates.price_gram_14k },
    ];

    for (const { purity, rate } of ratesToCreate) {
      await prisma.metalRate.create({
        data: {
          metalType: MetalType.GOLD,
          purity,
          ratePerGram: rate,
          effectiveDate,
          source: 'GOLDPRICEZ_API',
          createdById: systemUserId,
        },
      });
    }

    logger.info('Gold rates updated in database', { count: ratesToCreate.length });
  } catch (error) {
    logger.error('Failed to update gold rates in database', { error });
  }
}

export async function getLatestGoldRates() {
  const rates = await prisma.metalRate.findMany({
    where: {
      metalType: MetalType.GOLD,
    },
    orderBy: {
      effectiveDate: 'desc',
    },
    distinct: ['purity'],
    take: 4,
  });

  return rates;
}

export async function getGoldRateHistory(purity: number, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await prisma.metalRate.findMany({
    where: {
      metalType: MetalType.GOLD,
      purity,
      effectiveDate: {
        gte: startDate,
      },
    },
    orderBy: {
      effectiveDate: 'asc',
    },
  });
}
