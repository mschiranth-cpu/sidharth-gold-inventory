/**
 * Seed script to populate all 10 modules with test data
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for all modules...\n');

  // 1. Create Feature Modules
  console.log('📝 Creating Feature Modules...');
  const features = await Promise.all([
    prisma.featureModule.upsert({
      where: { name: 'client_portal' },
      update: {},
      create: {
        name: 'client_portal',
        displayName: 'Client Portal',
        description: 'Client registration, login, and order management',
        icon: 'users',
        isGlobal: true,
      },
    }),
    prisma.featureModule.upsert({
      where: { name: 'metal_inventory' },
      update: {},
      create: {
        name: 'metal_inventory',
        displayName: 'Metal Inventory',
        description: 'Gold, silver, and platinum inventory management',
        icon: 'package',
        isGlobal: true,
      },
    }),
    prisma.featureModule.upsert({
      where: { name: 'diamond_inventory' },
      update: {},
      create: {
        name: 'diamond_inventory',
        displayName: 'Diamond Inventory',
        description: 'Diamond inventory with 4C grading',
        icon: 'gem',
        isGlobal: true,
      },
    }),
    prisma.featureModule.upsert({
      where: { name: 'stone_inventory' },
      update: {},
      create: {
        name: 'stone_inventory',
        displayName: 'Stone Inventory',
        description: 'Real stones and stone packets management',
        icon: 'circle',
        isGlobal: true,
      },
    }),
    prisma.featureModule.upsert({
      where: { name: 'party_metal' },
      update: {},
      create: {
        name: 'party_metal',
        displayName: 'Party Metal',
        description: 'Party metal accounts and transactions',
        icon: 'briefcase',
        isGlobal: true,
      },
    }),
    prisma.featureModule.upsert({
      where: { name: 'factory_inventory' },
      update: {},
      create: {
        name: 'factory_inventory',
        displayName: 'Factory Inventory',
        description: 'Tools, equipment, and consumables',
        icon: 'tool',
        isGlobal: true,
      },
    }),
    prisma.featureModule.upsert({
      where: { name: 'attendance' },
      update: {},
      create: {
        name: 'attendance',
        displayName: 'Attendance System',
        description: 'Employee attendance and leave management',
        icon: 'calendar',
        isGlobal: true,
      },
    }),
    prisma.featureModule.upsert({
      where: { name: 'payroll' },
      update: {},
      create: {
        name: 'payroll',
        displayName: 'Payroll Management',
        description: 'Salary structure and payroll processing',
        icon: 'dollar-sign',
        isGlobal: true,
      },
    }),
    prisma.featureModule.upsert({
      where: { name: 'advanced_reporting' },
      update: {},
      create: {
        name: 'advanced_reporting',
        displayName: 'Advanced Reporting',
        description: 'Custom reports and analytics',
        icon: 'bar-chart',
        isGlobal: false,
      },
    }),
    prisma.featureModule.upsert({
      where: { name: 'quality_control' },
      update: {},
      create: {
        name: 'quality_control',
        displayName: 'Quality Control',
        description: 'Quality inspection and grading',
        icon: 'check-circle',
        isGlobal: false,
      },
    }),
  ]);
  console.log(`✅ Created ${features.length} feature modules\n`);

  // 2. Create Feature Permissions for all roles
  console.log('📝 Creating Feature Permissions...');
  const roles = ['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER', 'CLIENT'];
  let permissionCount = 0;

  for (const feature of features) {
    for (const role of roles) {
      const isEnabled =
        role === 'ADMIN' ||
        (role === 'OFFICE_STAFF' && !feature.name.includes('payroll')) ||
        (role === 'FACTORY_MANAGER' &&
          ['attendance', 'factory_inventory', 'quality_control'].includes(feature.name)) ||
        (role === 'CLIENT' && feature.name === 'client_portal');

      await prisma.featurePermission.upsert({
        where: {
          featureId_role: {
            featureId: feature.id,
            role: role as any,
          },
        },
        update: {},
        create: {
          featureId: feature.id,
          role: role as any,
          isEnabled,
          canRead: isEnabled,
          canWrite: role === 'ADMIN' || (role === 'OFFICE_STAFF' && isEnabled),
          canDelete: role === 'ADMIN',
        },
      });
      permissionCount++;
    }
  }
  console.log(`✅ Created ${permissionCount} feature permissions\n`);

  // 3. Create Metal Rates
  console.log('📝 Creating Metal Rates...');
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (adminUser) {
    await prisma.metalRate.createMany({
      data: [
        {
          metalType: 'GOLD',
          purity: 100,
          ratePerGram: 7200,
          effectiveDate: new Date(),
          source: 'MCX',
          createdById: adminUser.id,
        },
        {
          metalType: 'GOLD',
          purity: 91.67,
          ratePerGram: 6600,
          effectiveDate: new Date(),
          source: 'MCX',
          createdById: adminUser.id,
        },
        {
          metalType: 'GOLD',
          purity: 75,
          ratePerGram: 5400,
          effectiveDate: new Date(),
          source: 'MCX',
          createdById: adminUser.id,
        },
        {
          metalType: 'SILVER',
          purity: 100,
          ratePerGram: 90,
          effectiveDate: new Date(),
          source: 'MCX',
          createdById: adminUser.id,
        },
        {
          metalType: 'SILVER',
          purity: 92.5,
          ratePerGram: 83,
          effectiveDate: new Date(),
          source: 'MCX',
          createdById: adminUser.id,
        },
      ],
      skipDuplicates: true,
    });
    console.log('✅ Created 5 metal rates\n');
  }

  // 4. Create Sample Parties
  console.log('📝 Creating Sample Parties...');
  await prisma.party.createMany({
    data: [
      {
        name: 'Ramesh Karigar',
        type: 'KARIGAR',
        phone: '+91 9876543210',
        address: 'Shop 15, Zaveri Bazaar, Mumbai',
        gstNumber: '27AABCR1234F1Z5',
        panNumber: 'AABCR1234F',
      },
      {
        name: 'Suresh Gold Suppliers',
        type: 'SUPPLIER',
        phone: '+91 9876543211',
        address: 'Gold Market, Surat',
        gstNumber: '24AABCS5678G1Z6',
        panNumber: 'AABCS5678G',
      },
      {
        name: 'Priya Jewellers',
        type: 'CUSTOMER',
        phone: '+91 9876543212',
        address: 'MG Road, Bangalore',
        gstNumber: '29AABCP9012H1Z7',
        panNumber: 'AABCP9012H',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created 3 parties\n');

  // 5. Create Factory Item Categories
  console.log('📝 Creating Factory Item Categories...');
  const categories = await Promise.all([
    prisma.factoryItemCategory.upsert({
      where: { name: 'Tools & Equipment' },
      update: {},
      create: {
        name: 'Tools & Equipment',
        description: 'Jewellery making tools and equipment',
      },
    }),
    prisma.factoryItemCategory.upsert({
      where: { name: 'Consumables' },
      update: {},
      create: {
        name: 'Consumables',
        description: 'Consumable materials and supplies',
      },
    }),
    prisma.factoryItemCategory.upsert({
      where: { name: 'Safety Equipment' },
      update: {},
      create: {
        name: 'Safety Equipment',
        description: 'Safety gear and protective equipment',
      },
    }),
  ]);
  console.log(`✅ Created ${categories.length} factory item categories\n`);

  // 6. Create Sample Factory Items
  console.log('📝 Creating Sample Factory Items...');
  await prisma.factoryItem.createMany({
    data: [
      {
        itemCode: 'TOOL-001',
        name: 'Jewelers Torch',
        categoryId: categories[0].id,
        unit: 'PIECES',
        currentStock: 5,
        minStock: 2,
        maxStock: 10,
        isEquipment: true,
        location: 'Tool Room A',
      },
      {
        itemCode: 'CONS-001',
        name: 'Polishing Compound',
        categoryId: categories[1].id,
        unit: 'KG',
        currentStock: 10,
        minStock: 5,
        maxStock: 20,
        isEquipment: false,
        location: 'Storage Room',
      },
      {
        itemCode: 'SAFE-001',
        name: 'Safety Goggles',
        categoryId: categories[2].id,
        unit: 'PIECES',
        currentStock: 20,
        minStock: 10,
        maxStock: 30,
        isEquipment: false,
        location: 'Safety Equipment Room',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created 3 factory items\n');

  console.log('✅ Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - ${features.length} Feature Modules`);
  console.log(`   - ${permissionCount} Feature Permissions`);
  console.log('   - 5 Metal Rates');
  console.log('   - 3 Parties');
  console.log('   - 3 Factory Categories');
  console.log('   - 3 Factory Items');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
