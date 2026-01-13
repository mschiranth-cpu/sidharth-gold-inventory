const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetToZero() {
  try {
    const orderNumber = 'ORD-2026-00001-1K2';

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        departmentTracking: {
          where: { departmentName: 'CAD' },
          include: { workData: true },
        },
      },
    });

    const tracking = order.departmentTracking[0];
    const workData = tracking.workData;

    // Reset to empty state
    await prisma.departmentWorkData.update({
      where: { id: workData.id },
      data: {
        formData: {},
        uploadedPhotos: [],
        uploadedFiles: [],
        isComplete: false,
        isDraft: true,
        workCompletedAt: null,
        lastSavedAt: new Date(),
      },
    });

    console.log('✅ Reset work data to 0% progress');
    console.log('\nProgress breakdown:');
    console.log('- Form fields: 0/6');
    console.log('- Photos: 0/3');
    console.log('- Files: 0/1');
    console.log('\nExpected progress: 0% (0 out of 3 categories complete)');
    console.log('\nRefresh Factory Tracking page to see 0% progress!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetToZero();
