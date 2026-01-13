const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkArjunRaoDetails() {
  try {
    const arjunRao = await prisma.user.findUnique({
      where: {
        email: 'arjun.rao@goldfactory.com',
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
    });

    console.log('Arjun Rao:', arjunRao);
    console.log('');

    // Get his notification
    const notifications = await prisma.notification.findMany({
      where: {
        userId: arjunRao.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Total notifications: ${notifications.length}`);
    notifications.forEach((notif, index) => {
      console.log(`\n${index + 1}. ${notif.title}`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Type: ${notif.type}`);
      console.log(`   Order ID: ${notif.orderId}`);
      console.log(`   Read: ${notif.isRead}`);
      console.log(`   Created: ${notif.createdAt}`);
    });

    // Check his department assignments
    console.log('\n---Department Assignments---');
    const assignments = await prisma.departmentTracking.findMany({
      where: {
        assignedToId: arjunRao.id,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            currentDepartment: true,
          },
        },
      },
    });

    console.log(`Total assignments: ${assignments.length}`);
    assignments.forEach((assign, index) => {
      console.log(`\n${index + 1}. Order: ${assign.order.orderNumber}`);
      console.log(`   Department: ${assign.departmentName}`);
      console.log(`   Status: ${assign.status}`);
      console.log(`   Current Dept: ${assign.order.currentDepartment}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArjunRaoDetails();
