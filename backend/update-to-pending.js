const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateToPendingAssignment() {
  try {
    // Find the order
    const order = await prisma.order.findFirst({
      where: { orderNumber: 'ORD-2026-00001-1K2' },
      include: { departmentTracking: true },
    });

    if (!order) {
      console.log('Order not found');
      return;
    }

    // Find PRINT department tracking
    const printTracking = order.departmentTracking.find((dt) => dt.departmentName === 'PRINT');

    if (!printTracking) {
      console.log('PRINT tracking not found');
      return;
    }

    console.log('Before update:');
    console.log('  Status:', printTracking.status);
    console.log('  AssignedToId:', printTracking.assignedToId);

    // Update to PENDING_ASSIGNMENT
    await prisma.departmentTracking.update({
      where: { id: printTracking.id },
      data: {
        status: 'PENDING_ASSIGNMENT',
        assignedToId: null,
      },
    });

    console.log('\n✅ Updated PRINT tracking to PENDING_ASSIGNMENT');
    console.log('\nNow refresh the Factory Tracking page to see the yellow badge!');
    console.log('Workers can click "Take This Work" or Admin can "Assign Worker"');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateToPendingAssignment();
