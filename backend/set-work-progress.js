const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setWorkProgress(percentage) {
  try {
    const orderNumber = 'ORD-2026-00001-1K2';

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        departmentTracking: {
          where: {
            departmentName: 'CAD',
          },
          include: {
            workData: true,
          },
        },
      },
    });

    if (!order) {
      console.error('Order not found');
      return;
    }

    const tracking = order.departmentTracking[0];
    if (!tracking) {
      console.error('No CAD tracking found');
      return;
    }

    console.log(`Found order: ${orderNumber}`);
    console.log(`Current tracking status: ${tracking.status}`);

    // Create or update workData
    if (tracking.workData) {
      // Update existing workData
      const isComplete = percentage >= 100;
      await prisma.departmentWorkData.update({
        where: { id: tracking.workData.id },
        data: {
          isComplete,
          isDraft: !isComplete,
          lastSavedAt: new Date(),
        },
      });
      console.log(`✅ Updated work progress: ${percentage}% (isComplete: ${isComplete})`);
    } else {
      // Create new workData
      const isComplete = percentage >= 100;
      await prisma.departmentWorkData.create({
        data: {
          departmentTrackingId: tracking.id,
          formData: {},
          uploadedFiles: [],
          uploadedPhotos: [],
          isComplete,
          isDraft: !isComplete,
          lastSavedAt: new Date(),
        },
      });
      console.log(`✅ Created work data with ${percentage}% progress (isComplete: ${isComplete})`);
    }

    // If progress > 0, update tracking status to IN_PROGRESS (if not already)
    if (percentage > 0 && tracking.status === 'NOT_STARTED') {
      await prisma.departmentTracking.update({
        where: { id: tracking.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });
      console.log('✅ Updated tracking status to IN_PROGRESS');
    }

    console.log('\nTest the UI now! Progress bar should show:', percentage, '%');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get percentage from command line argument or default to 50
const percentage = parseInt(process.argv[2]) || 50;

console.log(`Setting work progress to ${percentage}%...\n`);
setWorkProgress(percentage);
