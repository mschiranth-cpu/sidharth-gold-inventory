const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find Deepak
  const deepak = await prisma.user.findFirst({
    where: {
      name: { contains: 'Deepak' },
    },
  });

  if (!deepak) {
    console.log('Deepak not found!');
    return;
  }

  console.log('Creating test notification for Deepak Sharma...');

  // Get the order Deepak is working on
  const assignment = await prisma.departmentTracking.findFirst({
    where: {
      assignedToId: deepak.id,
    },
    include: {
      order: true,
    },
  });

  if (!assignment) {
    console.log('No assignment found for Deepak');
    return;
  }

  // Create a notification
  const notification = await prisma.notification.create({
    data: {
      userId: deepak.id,
      type: 'NEW_ASSIGNMENT',
      priority: 'IMPORTANT',
      title: '📦 New Assignment',
      message: `You have been assigned to work on order ${assignment.order.orderNumber} in the ${assignment.departmentName} department.`,
      orderId: assignment.orderId,
      actionUrl: `/orders/${assignment.orderId}/work`,
      actionLabel: 'Start Work',
      isRead: false,
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
        },
      },
    },
  });

  console.log('\n✅ Notification created successfully for Deepak!');
  console.log(JSON.stringify(notification, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
