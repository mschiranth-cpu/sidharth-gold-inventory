const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // Get order with PRINT department
  const order = await prisma.order.findFirst({
    where: { currentDepartment: 'PRINT' },
    include: {
      departmentTracking: {
        where: { departmentName: 'PRINT' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          workData: true,
        },
      },
    },
  });

  if (!order) {
    console.log('❌ No order found in PRINT department');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Order:', order.orderNumber);
  console.log('✅ Current Department:', order.currentDepartment);
  console.log('\n📋 PRINT Tracking:');
  const tracking = order.departmentTracking[0];
  if (tracking) {
    console.log('   Status:', tracking.status);
    console.log('   Assigned To:', tracking.assignedTo?.name || 'Unassigned');
    console.log('   Assigned Email:', tracking.assignedTo?.email || 'N/A');
    console.log('   Work Data:', tracking.workData ? 'EXISTS' : 'NONE');
    console.log('   Tracking ID:', tracking.id);
  } else {
    console.log('   ❌ No PRINT tracking found!');
  }

  // Get Dinesh's user info
  const dinesh = await prisma.user.findFirst({
    where: { email: 'dinesh@example.com' },
  });
  console.log('\n👤 Dinesh User:');
  console.log('   ID:', dinesh?.id);
  console.log('   Department:', dinesh?.department);
  console.log('   Role:', dinesh?.role);

  // Check if Dinesh is assigned
  if (tracking?.assignedTo?.email === 'dinesh@example.com') {
    console.log('\n✅ Dinesh IS assigned to this PRINT task');
  } else {
    console.log('\n⚠️ Dinesh is NOT assigned - need to assign him');

    if (dinesh && tracking) {
      // Assign Dinesh to PRINT
      await prisma.departmentTracking.update({
        where: { id: tracking.id },
        data: { assignedToId: dinesh.id },
      });
      console.log('✅ Assigned Dinesh to PRINT department');
    }
  }

  await prisma.$disconnect();
}

test().catch(console.error);
