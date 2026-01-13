/**
 * Test script to verify images are stored and retrieved correctly
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing image storage in database...\n');

  // Get all orders with their details
  const ordersWithDetails = await prisma.order.findMany({
    take: 5,
    include: {
      orderDetails: true,
    },
  });

  console.log(`Found ${ordersWithDetails.length} orders\n`);

  for (const order of ordersWithDetails) {
    console.log(`Order: ${order.orderNumber}`);
    console.log(`  productPhotoUrl length: ${order.productPhotoUrl?.length || 0}`);
    console.log(
      `  productPhotoUrl preview: ${
        order.productPhotoUrl ? order.productPhotoUrl.substring(0, 80) + '...' : 'NULL'
      }`
    );

    if (order.orderDetails) {
      const images = order.orderDetails.referenceImages;
      console.log(`  referenceImages count: ${images.length}`);
      if (images.length > 0) {
        images.forEach((img, idx) => {
          console.log(`    [${idx}] length: ${img.length}, preview: ${img.substring(0, 60)}...`);
        });
      }
    } else {
      console.log('  orderDetails: NULL');
    }
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
