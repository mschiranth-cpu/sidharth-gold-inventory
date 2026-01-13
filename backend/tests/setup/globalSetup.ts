/**
 * ============================================
 * GLOBAL TEST SETUP
 * ============================================
 * 
 * Runs once before all test suites.
 * Sets up the test database and environment.
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();

export default async function globalSetup() {
  console.log('\n🔧 Setting up test environment...\n');

  // Ensure we're using the test database
  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl || !dbUrl.includes('test')) {
    console.warn('⚠️ Warning: DATABASE_URL may not be pointing to a test database!');
    console.warn('  Make sure to use a separate test database to avoid data loss.\n');
  }

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Run migrations (in a real setup, you'd run: npx prisma migrate deploy)
    // For now, we just ensure the connection works
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database ready for testing\n');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
