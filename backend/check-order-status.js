const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder() {
  const order = await prisma.order.findFirst({
    where: { orderNumber: 'ORD-2026-00001-1K2' },
    include: {
      departmentTracking: {
        orderBy: { sequenceOrder: 'asc' },
        include: { assignedTo: { select: { name: true } } },
      },
    },
  });

  if (!order) {
    console.log('Order not found');
    return;
  }

  console.log('Order:', order.orderNumber);
  console.log('Current Department:', order.currentDepartment);
  console.log('\nDepartment Tracking:');
  console.log('-------------------');
  order.departmentTracking.forEach((dt) => {
    console.log(
      `${dt.sequenceOrder}. ${dt.departmentName} - ${dt.status} - ${
        dt.assignedTo?.name || 'Unassigned'
      }`
    );
  });

  await prisma.$disconnect();
}

checkOrder();
