const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeAllWork() {
  try {
    const orderNumber = 'ORD-2026-00001-1K2';

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        departmentTracking: {
          where: { departmentName: 'CAD' },
          include: { workData: true },
        },
      },
    });

    const tracking = order.departmentTracking[0];
    const workData = tracking.workData;

    // All form fields (6/6)
    const formData = {
      designSoftware: 'Rhino 3D',
      designTime: '4',
      modelComplexity: 'medium',
      stoneCount: '12',
      fileFormat: '.3dm',
      designNotes: 'Complex design with intricate details',
    };

    // All photos (3/3)
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
        name: 'reference_comparison_1',
        originalName: 'reference.jpg',
        url: '/uploads/reference.jpg',
        category: 'reference_comparison',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'photo-3',
        name: 'angle_view_1',
        originalName: 'angle1.jpg',
        url: '/uploads/angle1.jpg',
        category: 'angle_views',
        uploadedAt: new Date().toISOString(),
      },
    ];

    // All files (1/1)
    const uploadedFiles = [
      {
        id: 'file-1',
        name: 'design_file',
        originalName: 'design.3dm',
        url: '/uploads/design.3dm',
        category: 'cad_file',
        mimeType: 'application/octet-stream',
        size: 2048000,
        uploadedAt: new Date().toISOString(),
      },
    ];

    await prisma.departmentWorkData.update({
      where: { id: workData.id },
      data: {
        formData,
        uploadedPhotos,
        uploadedFiles,
        isComplete: true,
        isDraft: false,
        workCompletedAt: new Date(),
        lastSavedAt: new Date(),
      },
    });

    console.log('✅ Completed ALL work requirements!');
    console.log('\nProgress breakdown:');
    console.log('- Form fields: 6/6 ✅ COMPLETE');
    console.log('- Photos: 3/3 ✅ COMPLETE');
    console.log('- Files: 1/1 ✅ COMPLETE');
    console.log('\nExpected progress: 100% (3 out of 3 categories complete)');
    console.log('\nRefresh Factory Tracking page to see 100% progress!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeAllWork();
