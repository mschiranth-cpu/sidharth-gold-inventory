/**
 * ============================================
 * DATABASE CONFIGURATION
 * ============================================
 *
 * Prisma client instance for database operations
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
