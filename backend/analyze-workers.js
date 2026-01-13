const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeWorkers() {
  try {
    // Get all active workers
    const workers = await prisma.user.findMany({
      where: {
        role: 'DEPARTMENT_WORKER',
        isActive: true,
      },
      select: {
        name: true,
        department: true,
      },
      orderBy: { department: 'asc' },
    });

    console.log('=== ALL ACTIVE WORKERS ===\n');

    // Group by department
    const byDept = {};
    workers.forEach((w) => {
      const dept = w.department || 'NO_DEPARTMENT';
      if (!byDept[dept]) byDept[dept] = [];
      byDept[dept].push(w.name);
    });

    // All 9 departments
    const allDepts = [
      'CAD',
      'PRINT',
      'CASTING',
      'FILLING',
      'MEENA',
      'POLISH_1',
      'SETTING',
      'POLISH_2',
      'ADDITIONAL',
    ];

    allDepts.forEach((dept) => {
      const workerList = byDept[dept] || [];
      const status = workerList.length > 0 ? '✅' : '❌';
      console.log(
        `${status} ${dept}: ${workerList.length > 0 ? workerList.join(', ') : 'NO WORKERS'}`
      );
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Total Workers: ${workers.length}`);
    console.log(
      `Departments with workers: ${Object.keys(byDept).filter((d) => d !== 'NO_DEPARTMENT').length}`
    );
    console.log(
      `Departments without workers: ${
        allDepts.filter((d) => !byDept[d] || byDept[d].length === 0).join(', ') || 'None'
      }`
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeWorkers();
