const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const dinesh = await prisma.user.findFirst({
    where: { name: { contains: 'Dinesh' }, role: 'DEPARTMENT_WORKER' },
  });
  console.log('Dinesh ID:', dinesh.id);
  console.log('Dinesh Dept:', dinesh.department);

  const tracking = await prisma.departmentTracking.findFirst({
    where: { departmentName: 'PRINT' },
    include: {
      order: { select: { id: true, orderNumber: true, status: true, currentDepartment: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  console.log('\nPRINT Tracking:');
  console.log('  Order:', tracking?.order?.orderNumber);
  console.log('  Order ID:', tracking?.order?.id);
  console.log('  Order Status:', tracking?.order?.status);
  console.log('  Order currentDepartment:', tracking?.order?.currentDepartment);
  console.log('  Tracking Status:', tracking?.status);
  console.log('  Assigned To:', tracking?.assignedTo?.name);
  console.log('  Assigned To ID:', tracking?.assignedToId);
  console.log('  Dinesh matches:', tracking?.assignedToId === dinesh.id);

  // Check if Dinesh is properly assigned
  if (tracking?.assignedToId !== dinesh.id) {
    console.log('\n⚠️ FIXING: Assigning Dinesh to PRINT tracking...');
    await prisma.departmentTracking.update({
      where: { id: tracking.id },
      data: { assignedToId: dinesh.id },
    });
    console.log('✅ Dinesh assigned to PRINT!');
  }

  await prisma.$disconnect();
}
test();
