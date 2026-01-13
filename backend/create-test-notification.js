const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find Rohit
  const rohit = await prisma.user.findFirst({
    where: {
      name: { contains: 'Rohit' },
    },
  });

  if (!rohit) {
    console.log('Rohit not found!');
    return;
  }

  console.log('Creating test notification for Rohit...');

  // Get the order Rohit is working on
  const assignment = await prisma.departmentTracking.findFirst({
    where: {
      assignedToId: rohit.id,
    },
    include: {
      order: true,
    },
  });

  if (!assignment) {
    console.log('No assignment found for Rohit');
    return;
  }

  // Create a notification
  const notification = await prisma.notification.create({
    data: {
      userId: rohit.id,
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

  console.log('\n✅ Notification created successfully!');
  console.log(JSON.stringify(notification, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
