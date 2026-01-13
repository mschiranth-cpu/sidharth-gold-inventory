const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find Deepak's assignment
  const assignment = await prisma.departmentTracking.findFirst({
    where: {
      assignedTo: {
        name: { contains: 'Deepak' },
      },
    },
    include: {
      order: true,
      assignedTo: true,
    },
  });

  if (!assignment) {
    console.log('No assignment found for Deepak');
    return;
  }

  console.log('Found assignment:', {
    order: assignment.order.orderNumber,
    department: assignment.departmentName,
    worker: assignment.assignedTo?.name,
    status: assignment.status,
  });

  // Unassign the worker
  await prisma.departmentTracking.update({
    where: {
      id: assignment.id,
    },
    data: {
      assignedToId: null,
      status: 'PENDING_ASSIGNMENT',
    },
  });

  console.log('\n✅ Deepak unassigned successfully!');
  console.log('Order is now PENDING_ASSIGNMENT in FILLING department');

  // Also delete the notification we created for testing
  const deletedCount = await prisma.notification.deleteMany({
    where: {
      userId: assignment.assignedToId,
    },
  });

  console.log(`\n🗑️ Deleted ${deletedCount.count} test notification(s)`);

  await prisma.$disconnect();
}

main().catch(console.error);
