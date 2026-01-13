/**
 * ============================================
 * GLOBAL TEST TEARDOWN
 * ============================================
 * 
 * Runs once after all test suites complete.
 * Cleans up the test database and resources.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test environment...\n');

  try {
    await prisma.$connect();

    // Clean up all test data in reverse order of dependencies
    // Using transaction for atomic cleanup
    await prisma.$transaction([
      prisma.finalSubmission.deleteMany(),
      prisma.departmentTracking.deleteMany(),
      prisma.stone.deleteMany(),
      prisma.orderDetails.deleteMany(),
      prisma.order.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('⚠️ Error during cleanup (may be expected if tables are empty):', error);
  } finally {
    await prisma.$disconnect();
    console.log('✅ Database connection closed\n');
  }
}
