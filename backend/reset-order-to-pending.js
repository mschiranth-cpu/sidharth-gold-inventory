const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetOrderToPending() {
  try {
    const orderNumber = 'ORD-2026-00001-1K2';

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        departmentTracking: {
          where: { departmentName: 'CAD' },
        },
      },
    });

    if (!order) {
      console.log('Order not found:', orderNumber);
      return;
    }

    console.log('Found order:', order.orderNumber);
    console.log('Current tracking:', order.departmentTracking[0]?.status);

    // Update the CAD department tracking back to PENDING_ASSIGNMENT
    if (order.departmentTracking[0]) {
      await prisma.departmentTracking.update({
        where: { id: order.departmentTracking[0].id },
        data: {
          status: 'PENDING_ASSIGNMENT',
          assignedToId: null,
          startedAt: null,
        },
      });

      console.log('✅ Reset CAD tracking to PENDING_ASSIGNMENT');
      console.log('✅ Removed assigned worker');
      console.log('\nYou can now test the assignment flow again!');
    } else {
      console.log('No CAD tracking found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetOrderToPending();
