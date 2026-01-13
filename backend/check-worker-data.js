const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkerData() {
  try {
    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderNumber: 'ORD-2026-00001-1K2' },
      select: { id: true, orderNumber: true },
    });

    if (!order) {
      console.error('Order not found');
      return;
    }

    console.log('Order:', order.orderNumber);

    // Find tracking with workData
    const tracking = await prisma.departmentTracking.findFirst({
      where: {
        orderId: order.id,
        departmentName: 'CAD',
      },
      include: {
        workData: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!tracking) {
      console.error('No tracking found');
      return;
    }

    console.log('\n=== Department Tracking ===');
    console.log('ID:', tracking.id);
    console.log('Status:', tracking.status);
    console.log('Assigned To:', tracking.assignedTo?.name || 'Unassigned');
    console.log('Started At:', tracking.startedAt);

    console.log('\n=== Work Data ===');
    if (tracking.workData) {
      console.log('Work Data ID:', tracking.workData.id);
      console.log('Is Complete:', tracking.workData.isComplete);
      console.log('Is Draft:', tracking.workData.isDraft);
      console.log('Last Saved:', tracking.workData.lastSavedAt);
      console.log('Work Started:', tracking.workData.workStartedAt);
      console.log('Work Completed:', tracking.workData.workCompletedAt);
    } else {
      console.log('No work data found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkerData();
