const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // Find all users named Dinesh
  const users = await prisma.user.findMany({
    where: { name: { contains: 'Dinesh' } },
    select: { id: true, name: true, email: true, role: true, department: true },
  });
  console.log('Users named Dinesh:');
  users.forEach((u) => {
    console.log('  -', u.name, '|', u.email, '|', u.role, '|', u.department || 'N/A');
  });

  // Find CAD worker (Nisha) for reference
  const nisha = await prisma.user.findFirst({
    where: { department: 'CAD', role: 'DEPARTMENT_WORKER' },
    select: { name: true, email: true, role: true, department: true },
  });
  console.log('\nCAD Worker (reference):', nisha?.name, '|', nisha?.email);

  // Find all PRINT workers
  const printWorkers = await prisma.user.findMany({
    where: { department: 'PRINT', role: 'DEPARTMENT_WORKER' },
    select: { name: true, email: true, role: true, department: true },
  });
  console.log('\nPRINT Workers:');
  printWorkers.forEach((w) => {
    console.log('  -', w.name, '|', w.email);
  });

  await prisma.$disconnect();
}
test();
