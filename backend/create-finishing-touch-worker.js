/**
 * Create a new worker for the Finishing Touch (ADDITIONAL) department
 * This worker will handle the final stage of the jewelry workflow
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createFinishingTouchWorker() {
  try {
    console.log('🔧 Creating Finishing Touch Worker...\n');

    // Check if a worker already exists for ADDITIONAL department
    const existingWorker = await prisma.user.findFirst({
      where: {
        department: 'ADDITIONAL',
        role: 'DEPARTMENT_WORKER',
        isActive: true,
      },
    });

    if (existingWorker) {
      console.log('✅ A worker already exists for Finishing Touch department:');
      console.log(`   Name: ${existingWorker.name}`);
      console.log(`   Email: ${existingWorker.email}`);
      console.log('\n No new worker created.');
      return existingWorker;
    }

    // Create password hash
    const password = 'worker123'; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new worker
    const newWorker = await prisma.user.create({
      data: {
        name: 'Priya Menon',
        email: 'priya.menon@goldfactory.com',
        phone: '9876543210',
        password: hashedPassword,
        role: 'DEPARTMENT_WORKER',
        department: 'ADDITIONAL',
        isActive: true,
      },
    });

    console.log('✅ Successfully created Finishing Touch worker!\n');
    console.log('   Worker Details:');
    console.log('   ─────────────────────────────────────');
    console.log(`   Name:       ${newWorker.name}`);
    console.log(`   Email:      ${newWorker.email}`);
    console.log(`   Phone:      ${newWorker.phone}`);
    console.log(`   Role:       ${newWorker.role}`);
    console.log(`   Department: ADDITIONAL (Finishing Touch)`);
    console.log(`   Password:   ${password}`);
    console.log('   ─────────────────────────────────────\n');

    // Verify worker distribution
    console.log('📊 Updated Worker Distribution:\n');

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

    for (const dept of allDepts) {
      const workers = await prisma.user.findMany({
        where: {
          department: dept,
          role: 'DEPARTMENT_WORKER',
          isActive: true,
        },
        select: { name: true },
      });

      const status = workers.length > 0 ? '✅' : '❌';
      const names = workers.map((w) => w.name).join(', ') || 'NO WORKERS';
      console.log(`   ${status} ${dept}: ${names}`);
    }

    console.log('\n🎉 All 9 departments now have workers!');
    console.log('   The order can now be assigned to the Finishing Touch department.\n');

    return newWorker;
  } catch (error) {
    console.error('❌ Error creating worker:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createFinishingTouchWorker();
