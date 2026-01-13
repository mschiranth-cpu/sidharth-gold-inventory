const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkArjunNotifications() {
  try {
    // Find Arjun
    const arjun = await prisma.user.findFirst({
      where: {
        name: {
          contains: 'Arjun',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
    });

    if (!arjun) {
      console.log('❌ Arjun not found');
      return;
    }

    console.log('✅ Found Arjun:', arjun);
    console.log('');

    // Get Arjun's notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: arjun.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    console.log(`📬 Total notifications for Arjun: ${notifications.length}`);
    console.log('');

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: arjun.id,
        isRead: false,
      },
    });

    console.log(`🔔 Unread notifications: ${unreadCount}`);
    console.log('');

    // Show all notifications
    if (notifications.length > 0) {
      console.log('Recent notifications:');
      notifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. ${notif.title}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Priority: ${notif.priority}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Read: ${notif.isRead ? '✅' : '❌'}`);
        console.log(`   Order ID: ${notif.orderId || 'N/A'}`);
        console.log(`   Created: ${notif.createdAt}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArjunNotifications();
