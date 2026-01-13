// Quick script to list all files by department
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listFilesByDepartment() {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: 'ORD-2026-00001-1K2' },
      include: {
        departmentTracking: {
          include: {
            assignedTo: true,
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

    console.log('\n=== PHOTOS BY DEPARTMENT ===\n');
    order.departmentTracking.forEach((dt) => {
      const photos = dt.workData?.uploadedPhotos || [];
      if (photos.length > 0) {
        console.log(`${dt.departmentName}: ${photos.length} photos`);
        photos.forEach((photo, index) => {
          console.log(`  ${index + 1}. ${photo.name || photo.filename}`);
        });
      }
    });

    console.log('\n=== FILES (DOCUMENTS) BY DEPARTMENT ===\n');
    order.departmentTracking.forEach((dt) => {
      const files = dt.workData?.uploadedFiles || [];
      if (files.length > 0) {
        console.log(`${dt.departmentName}: ${files.length} files`);
        files.forEach((file, index) => {
          console.log(
            `  ${index + 1}. ${file.name || file.filename} (${file.fileType || 'unknown'})`
          );
        });
      }
    });

    console.log('\n=== ALL DEPARTMENTS STATUS ===\n');
    order.departmentTracking.forEach((dt) => {
      const photos = dt.workData?.uploadedPhotos || [];
      const files = dt.workData?.uploadedFiles || [];
      console.log(`${dt.departmentName} (${dt.status}):`);
      console.log(`  Photos: ${photos.length}`);
      console.log(`  Files: ${files.length}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listFilesByDepartment();
