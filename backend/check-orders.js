const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    // Check all orders
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        currentDepartment: true,
      },
      take: 10,
    });

    console.log('All Orders:');
    console.log(JSON.stringify(allOrders, null, 2));

    // Check IN_FACTORY orders
    const inFactoryOrders = await prisma.order.findMany({
      where: { status: 'IN_FACTORY' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        currentDepartment: true,
      },
    });

    console.log('\n\nIN_FACTORY Orders:');
    console.log(JSON.stringify(inFactoryOrders, null, 2));

    // Check department tracking for PENDING_ASSIGNMENT
    const pendingTracking = await prisma.departmentTracking.findMany({
      where: { status: 'PENDING_ASSIGNMENT' },
      select: {
        id: true,
        orderId: true,
        departmentName: true,
        status: true,
        order: {
          select: {
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    console.log('\n\nPENDING_ASSIGNMENT Tracking:');
    console.log(JSON.stringify(pendingTracking, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
