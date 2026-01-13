const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupPrintDepartment() {
  try {
    const order = await prisma.order.findFirst({
      where: { orderNumber: 'ORD-2026-00001-1K2' },
      include: { departmentTracking: true },
    });

    if (!order) {
      console.log('Order not found');
      return;
    }

    console.log('Order:', order.orderNumber);
    console.log('Current Department:', order.currentDepartment);

    // Check if PRINT tracking exists
    const printTracking = order.departmentTracking.find((dt) => dt.departmentName === 'PRINT');

    if (printTracking) {
      console.log('\nPRINT tracking exists, updating to PENDING_ASSIGNMENT...');
      await prisma.departmentTracking.update({
        where: { id: printTracking.id },
        data: {
          status: 'PENDING_ASSIGNMENT',
          assignedToId: null,
        },
      });
    } else {
      console.log('\nPRINT tracking does not exist, creating...');
      await prisma.departmentTracking.create({
        data: {
          orderId: order.id,
          departmentName: 'PRINT',
          sequenceOrder: 2,
          status: 'PENDING_ASSIGNMENT',
          assignedToId: null,
        },
      });
    }

    // Update order's current department to PRINT
    await prisma.order.update({
      where: { id: order.id },
      data: { currentDepartment: 'PRINT' },
    });

    console.log('\n✅ Done! Order now in PRINT department with PENDING_ASSIGNMENT status');
    console.log('Refresh Factory Tracking to see the yellow badge!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupPrintDepartment();
