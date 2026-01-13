const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkApiResponse() {
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

    // Extract files just like the backend does
    const files = [];

    // Add department photos and files
    if (order.departmentTracking && Array.isArray(order.departmentTracking)) {
      order.departmentTracking.forEach((dt) => {
        const deptName = dt.departmentName;

        // Add department photos
        if (dt.workData?.uploadedPhotos && Array.isArray(dt.workData.uploadedPhotos)) {
          dt.workData.uploadedPhotos.forEach((photo) => {
            if (photo && photo.url) {
              files.push({
                id: photo.id || `photo-${dt.id}-${files.length}`,
                url: photo.url.substring(0, 50) + '...', // Truncate for readability
                thumbnailUrl: photo.thumbnailUrl
                  ? photo.thumbnailUrl.substring(0, 50) + '...'
                  : null,
                filename: photo.name || photo.filename || 'Department Photo',
                fileType: 'image',
                category: 'department',
                uploadedBy: dt.assignedTo?.name || 'Worker',
                uploadedAt: dt.workData.workCompletedAt || dt.completedAt || dt.startedAt,
                departmentId: dt.departmentName,
                departmentName: deptName,
                size: photo.size || 0,
              });
            }
          });
        }

        // Add department files
        if (dt.workData?.uploadedFiles && Array.isArray(dt.workData.uploadedFiles)) {
          dt.workData.uploadedFiles.forEach((file) => {
            if (file && file.url) {
              const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
                file.name || file.filename || ''
              );
              files.push({
                id: file.id || `file-${dt.id}-${files.length}`,
                url: file.url.substring(0, 50) + '...', // Truncate for readability
                thumbnailUrl: file.thumbnailUrl ? file.thumbnailUrl.substring(0, 50) + '...' : null,
                filename: file.name || file.filename || 'Department File',
                fileType: isImage ? 'image' : 'document',
                category: 'department',
                uploadedBy: dt.assignedTo?.name || 'Worker',
                uploadedAt: dt.workData.workCompletedAt || dt.completedAt || dt.startedAt,
                departmentId: dt.departmentName,
                departmentName: deptName,
                size: file.size || 0,
              });
            }
          });
        }
      });
    }

    console.log('\n=== FILES ARRAY (as sent to frontend) ===');
    console.log(JSON.stringify(files, null, 2));
    console.log(`\nTotal files: ${files.length}`);
    console.log(`Files by category:`);
    const byCategory = files.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {});
    console.log(JSON.stringify(byCategory, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiResponse();
