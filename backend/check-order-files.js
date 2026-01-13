const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrderFiles() {
  try {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: 'ORD-2026-00001-1K2',
      },
      include: {
        orderDetails: true,
        departmentTracking: {
          include: {
            workData: true,
          },
          orderBy: {
            sequenceOrder: 'asc',
          },
        },
      },
    });

    if (!order) {
      console.log('Order not found');
      return;
    }

    console.log(`Order: ${order.orderNumber}`);
    console.log(`Current Department: ${order.currentDepartment}`);
    console.log('');

    console.log('=== Department Tracking ===');
    order.departmentTracking.forEach((dept) => {
      console.log(`\n${dept.departmentName} (${dept.status})`);

      if (dept.workData) {
        console.log('  Work Data:');
        console.log(`    Uploaded Files: ${JSON.stringify(dept.workData.uploadedFiles, null, 2)}`);
        console.log(
          `    Uploaded Photos: ${JSON.stringify(dept.workData.uploadedPhotos, null, 2)}`
        );
        console.log(`    Form Data: ${JSON.stringify(dept.workData.formData, null, 2)}`);
      } else {
        console.log('  No work data');
      }
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrderFiles();
