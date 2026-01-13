const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFinalStatus() {
  const order = await prisma.order.findFirst({
    where: { orderNumber: 'ORD-2026-00001-1K2' },
    select: {
      status: true,
      currentDepartment: true,
      departmentTracking: {
        select: {
          departmentName: true,
          status: true,
        },
        orderBy: { sequenceOrder: 'asc' },
      },
    },
  });

  console.log('=== ORDER FINAL STATUS ===\n');
  console.log('Order Status:', order.status);
  console.log('Current Department:', order.currentDepartment);

  const allCompleted = order.departmentTracking.every((dt) => dt.status === 'COMPLETED');
  console.log('All Depts Completed?:', allCompleted);

  console.log('\nDepartment Status:');
  order.departmentTracking.forEach((dt) => {
    const icon = dt.status === 'COMPLETED' ? '✅' : '❌';
    console.log(`  ${icon} ${dt.departmentName}: ${dt.status}`);
  });

  await prisma.$disconnect();
}

checkFinalStatus();
