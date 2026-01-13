import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearData() {
  console.log('Deleting all data except users...\n');

  // Delete in correct order due to foreign key constraints
  const departmentTracking = await prisma.departmentTracking.deleteMany();
  console.log(`✅ Deleted ${departmentTracking.count} DepartmentTracking records`);

  const stones = await prisma.stone.deleteMany();
  console.log(`✅ Deleted ${stones.count} Stones`);

  const orderDetails = await prisma.orderDetails.deleteMany();
  console.log(`✅ Deleted ${orderDetails.count} OrderDetails`);

  const finalSubmissions = await prisma.finalSubmission.deleteMany();
  console.log(`✅ Deleted ${finalSubmissions.count} FinalSubmissions`);

  const notifications = await prisma.notification.deleteMany();
  console.log(`✅ Deleted ${notifications.count} Notifications`);

  const auditLogs = await prisma.auditLog.deleteMany();
  console.log(`✅ Deleted ${auditLogs.count} AuditLogs`);

  const orders = await prisma.order.deleteMany();
  console.log(`✅ Deleted ${orders.count} Orders`);

  console.log('\n✅ All data cleared! Users preserved.');

  const userCount = await prisma.user.count();
  console.log(`\nUsers remaining: ${userCount}`);

  await prisma.$disconnect();
}

clearData().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
