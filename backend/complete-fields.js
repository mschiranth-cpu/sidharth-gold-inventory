const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeAllFields() {
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

    // Complete ALL required form fields (6/6)
    const formData = {
      designSoftware: 'Rhino 3D',
      designTime: '4',
      modelComplexity: 'medium',
      stoneCount: '12',
      fileFormat: '.3dm',
      designNotes: 'Complex design with intricate details',
    };

    await prisma.departmentWorkData.update({
      where: { id: workData.id },
      data: {
        formData,
        lastSavedAt: new Date(),
      },
    });

    console.log('✅ Completed all form fields (6/6)');
    console.log('\nProgress breakdown:');
    console.log('- Form fields: 6/6 ✅ COMPLETE');
    console.log('- Photos: 2/3 (incomplete)');
    console.log('- Files: 0/1 (incomplete)');
    console.log('\nExpected progress: 33% (1 out of 3 categories complete)');
    console.log('\nRefresh Factory Tracking page!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeAllFields();
