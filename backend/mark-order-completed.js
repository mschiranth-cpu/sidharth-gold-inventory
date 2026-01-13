const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function markOrderCompleted() {
  console.log('🔧 Marking order as COMPLETED...\n');

  // Find the order
  const order = await prisma.order.findFirst({
    where: { orderNumber: 'ORD-2026-00001-1K2' },
    include: {
      departmentTracking: {
        orderBy: { sequenceOrder: 'asc' },
      },
    },
  });

  if (!order) {
    console.log('❌ Order not found');
    return;
  }

  // Check if all departments are completed
  const allCompleted = order.departmentTracking.every((dt) => dt.status === 'COMPLETED');

  console.log('Order:', order.orderNumber);
  console.log('Current Status:', order.status);
  console.log('All Departments Completed:', allCompleted);

  if (!allCompleted) {
    console.log('\n❌ Cannot mark as completed - not all departments are done');
    order.departmentTracking.forEach((dt) => {
      const icon = dt.status === 'COMPLETED' ? '✅' : '❌';
      console.log(`  ${icon} ${dt.departmentName}: ${dt.status}`);
    });
    return;
  }

  // Update order status to COMPLETED
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  console.log('\n✅ Order marked as COMPLETED!');

  // Verify
  const updated = await prisma.order.findFirst({
    where: { id: order.id },
    select: { status: true, completedAt: true },
  });

  console.log('New Status:', updated.status);
  console.log('Completed At:', updated.completedAt);

  await prisma.$disconnect();
}

markOrderCompleted();
