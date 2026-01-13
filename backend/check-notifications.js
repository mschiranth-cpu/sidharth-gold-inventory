const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find Deepak
  const deepak = await prisma.user.findFirst({
    where: {
      name: { contains: 'Deepak' },
    },
  });

  console.log('Deepak user:', deepak);

  if (deepak) {
    // Check notifications for Deepak
    const notifications = await prisma.notification.findMany({
      where: {
        userId: deepak.id,
      },
      include: {
        order: true,
      },
    });

    console.log('\nNotifications for Deepak:', notifications.length);
    notifications.forEach((notif) => {
      console.log('- ', notif.title, '|', notif.type, '|', notif.isRead ? 'READ' : 'UNREAD');
    });

    // Check department tracking for Deepak
    const assignments = await prisma.departmentTracking.findMany({
      where: {
        assignedToId: deepak.id,
      },
      include: {
        order: true,
      },
    });

    console.log('\nAssignments for Deepak:', assignments.length);
    assignments.forEach((assignment) => {
      console.log(
        '- Order:',
        assignment.order.orderNumber,
        '| Dept:',
        assignment.departmentName,
        '| Status:',
        assignment.status
      );
    });
  }

  await prisma.$disconnect();
}

main();
