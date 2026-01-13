const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // List all PRINT department workers
  const workers = await prisma.user.findMany({
    where: { department: 'PRINT', role: 'DEPARTMENT_WORKER' },
    select: { id: true, name: true, email: true, department: true },
  });
  console.log('PRINT Workers:', JSON.stringify(workers, null, 2));

  // Get Dinesh Nair
  const dinesh = await prisma.user.findFirst({
    where: { name: { contains: 'Dinesh' } },
    select: { id: true, name: true, email: true, department: true, role: true },
  });
  console.log('\nDinesh:', JSON.stringify(dinesh, null, 2));

  await prisma.$disconnect();
}
test();
