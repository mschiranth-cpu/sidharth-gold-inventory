/**
 * Create FinalSubmission for completed order
 * Run: node create-final-submission.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the completed order
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: 'ORD-2026-00001-1K2',
    },
    include: {
      orderDetails: true,
      finalSubmission: true,
    },
  });

  if (!order) {
    console.log('❌ Order not found');
    return;
  }

  console.log('Order:', order.orderNumber, 'Status:', order.status);

  if (order.finalSubmission) {
    console.log('✅ FinalSubmission already exists:', order.finalSubmission.id);
    return;
  }

  // Find the Finishing Touch worker (Priya Menon)
  const finishingWorker = await prisma.user.findFirst({
    where: {
      department: 'ADDITIONAL',
      role: 'DEPARTMENT_WORKER',
    },
  });

  if (!finishingWorker) {
    console.log('❌ No Finishing Touch worker found');
    return;
  }

  console.log('Using worker:', finishingWorker.name);

  // Create FinalSubmission
  const submission = await prisma.finalSubmission.create({
    data: {
      orderId: order.id,
      finalGoldWeight: order.orderDetails?.goldWeightInitial || 0,
      finalStoneWeight: order.orderDetails?.stoneWeight || 0,
      finalPurity: order.orderDetails?.goldPurity || 22,
      numberOfPieces: order.orderDetails?.quantity || 1,
      totalWeight:
        (order.orderDetails?.goldWeightInitial || 0) + (order.orderDetails?.stoneWeight || 0),
      submittedById: finishingWorker.id,
      submittedAt: order.completedAt || new Date(),
      completionPhotos: [],
      qualityNotes: 'Auto-submitted upon completion of all departments',
    },
  });

  console.log('✅ FinalSubmission created:', submission.id);
  console.log('   Final Gold Weight:', submission.finalGoldWeight, 'g');
  console.log('   Final Purity:', submission.finalPurity, 'K');
  console.log('   Submitted At:', submission.submittedAt);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
