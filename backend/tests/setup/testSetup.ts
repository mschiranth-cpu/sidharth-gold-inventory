/**
 * ============================================
 * TEST SETUP - RUNS BEFORE EACH TEST FILE
 * ============================================
 * 
 * Configures the test environment for each test suite.
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Create prisma client for tests
export const prisma = new PrismaClient();

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console methods to reduce noise (optional)
// Uncomment to silence logs during tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

beforeAll(async () => {
  // Connect to database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

// Export prisma for use in tests
export default prisma;
