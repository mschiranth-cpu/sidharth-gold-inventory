const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPolish1Status() {
  try {
    // Find Vishal Pillai
    const vishal = await prisma.user.findFirst({
      where: {
        name: 'Vishal Pillai',
      },
    });

    console.log('Vishal Pillai:', vishal);
    console.log('');

    // Check order status
    const order = await prisma.order.findFirst({
      where: { orderNumber: 'ORD-2026-00001-1K2' },
      include: {
        departmentTracking: {
          where: {
            departmentName: 'POLISH_1',
          },
          include: {
            assignedTo: true,
          },
        },
      },
    });

    console.log('Order:', order.orderNumber);
    console.log('Current Department:', order.currentDepartment);
    console.log('Status:', order.status);
    console.log('');
    console.log('POLISH_1 Department Tracking:');
    console.log(JSON.stringify(order.departmentTracking, null, 2));

    // Check Vishal's notifications
    if (vishal) {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: vishal.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log(`\n---Vishal's Notifications---`);
      console.log(`Total: ${notifications.length}\n`);

      notifications.forEach((notif, index) => {
        const icon =
          notif.priority === 'CRITICAL'
            ? '🔴'
            : notif.priority === 'IMPORTANT'
            ? '🟡'
            : notif.priority === 'INFO'
            ? '🔵'
            : '🟢';
        console.log(`${index + 1}. ${icon} ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Read: ${notif.isRead}`);
        console.log(`   Created: ${notif.createdAt}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPolish1Status();
