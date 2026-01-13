const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulatePartialWork() {
  try {
    const orderNumber = 'ORD-2026-00001-1K2';

    // Find the order and tracking
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        departmentTracking: {
          where: { departmentName: 'CAD' },
          include: { workData: true },
        },
      },
    });

    if (!order || !order.departmentTracking[0]) {
      console.error('Order or tracking not found');
      return;
    }

    const tracking = order.departmentTracking[0];

    // Simulate filling some form fields (3 out of 6 = 50% of fields category)
    const formData = {
      designSoftware: 'Rhino 3D',
      designTime: '4',
      modelComplexity: 'medium',
      // Missing: stoneCount, fileFormat, designNotes
    };

    // Simulate uploading 2 photos (2 out of 3 = 66% of photos category)
    const uploadedPhotos = [
      {
        id: 'photo-1',
        name: 'design_preview_1',
        originalName: 'preview.jpg',
        url: '/uploads/preview.jpg',
        category: 'design_preview',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'photo-2',
        name: 'angle_view_1',
        originalName: 'angle1.jpg',
        url: '/uploads/angle1.jpg',
        category: 'angle_views',
        uploadedAt: new Date().toISOString(),
      },
    ];

    // No files yet (0 out of 1)
    const uploadedFiles = [];

    if (tracking.workData) {
      // Update existing workData
      await prisma.departmentWorkData.update({
        where: { id: tracking.workData.id },
        data: {
          formData,
          uploadedPhotos,
          uploadedFiles,
          isComplete: false,
          isDraft: true,
          lastSavedAt: new Date(),
        },
      });
      console.log('✅ Updated work data with partial progress');
    } else {
      // Create new workData
      await prisma.departmentWorkData.create({
        data: {
          departmentTrackingId: tracking.id,
          formData,
          uploadedPhotos,
          uploadedFiles,
          isComplete: false,
          isDraft: true,
          lastSavedAt: new Date(),
        },
      });
      console.log('✅ Created work data with partial progress');
    }

    console.log('\nProgress breakdown:');
    console.log('- Form fields: 3/6 filled (needs all 6 for category completion)');
    console.log('- Photos: 2/3 uploaded (needs all 3 for category completion)');
    console.log('- Files: 0/1 uploaded (needs 1 for category completion)');
    console.log('\nExpected progress: 0% (0 out of 3 categories complete)');
    console.log('\nRefresh Factory Tracking page to see updated progress!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulatePartialWork();
