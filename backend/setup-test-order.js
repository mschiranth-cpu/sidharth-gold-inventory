const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTestOrder() {
  try {
    const orderNumber = 'ORD-2026-00001-1K2';

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        orderDetails: true,
      },
    });

    if (!order) {
      console.log('Order not found:', orderNumber);
      return;
    }

    console.log('Found order:', order.orderNumber, 'Status:', order.status);

    // Update order to IN_FACTORY status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'IN_FACTORY',
        currentDepartment: 'CAD',
      },
    });

    console.log('Updated order status to IN_FACTORY, currentDepartment: CAD');

    // Check if department tracking exists
    const existingTracking = await prisma.departmentTracking.findFirst({
      where: {
        orderId: order.id,
        departmentName: 'CAD',
      },
    });

    if (!existingTracking) {
      // Create department tracking with PENDING_ASSIGNMENT status
      await prisma.departmentTracking.create({
        data: {
          orderId: order.id,
          departmentName: 'CAD',
          sequenceOrder: 1,
          status: 'PENDING_ASSIGNMENT',
          assignedToId: null,
          startedAt: null,
          completedAt: null,
        },
      });

      console.log('Created department tracking for CAD with PENDING_ASSIGNMENT status');
    } else {
      // Update existing tracking to PENDING_ASSIGNMENT
      await prisma.departmentTracking.update({
        where: { id: existingTracking.id },
        data: {
          status: 'PENDING_ASSIGNMENT',
          assignedToId: null,
        },
      });

      console.log('Updated existing CAD tracking to PENDING_ASSIGNMENT status');
    }

    // Verify the changes
    const updatedOrder = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        departmentTracking: {
          where: {
            departmentName: 'CAD',
          },
        },
      },
    });

    console.log('\nFinal state:');
    console.log('Order status:', updatedOrder.status);
    console.log('Current department:', updatedOrder.currentDepartment);
    console.log('CAD tracking status:', updatedOrder.departmentTracking[0]?.status);
    console.log('\n✅ Test order is ready!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestOrder();
