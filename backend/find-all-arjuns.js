const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAllArjuns() {
  try {
    const arjuns = await prisma.user.findMany({
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
        role: true,
      },
    });

    console.log(`Found ${arjuns.length} users with 'Arjun' in the name:`);
    console.log('');

    arjuns.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Department: ${user.department}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });

    // Now check notifications for each
    for (const user of arjuns) {
      const notifCount = await prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      });
      console.log(`Unread notifications for ${user.name}: ${notifCount}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAllArjuns();
