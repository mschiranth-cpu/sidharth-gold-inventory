import {
  PrismaClient,
  Prisma,
  UserRole,
  DepartmentName,
  OrderStatus,
  DepartmentStatus,
  StoneType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// HELPER FUNCTIONS
// ============================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function generateOrderNumber(index: number): string {
  const year = new Date().getFullYear();
  const paddedIndex = String(index).padStart(5, '0');
  return `ORD-${year}-${paddedIndex}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// REALISTIC INDIAN DATA
// ============================================

const indianFirstNames = {
  male: [
    'Rajesh',
    'Sunil',
    'Anil',
    'Vijay',
    'Sanjay',
    'Rakesh',
    'Manoj',
    'Deepak',
    'Amit',
    'Rohit',
    'Nikhil',
    'Pradeep',
    'Ramesh',
    'Suresh',
    'Mahesh',
    'Ganesh',
    'Arjun',
    'Karan',
    'Vikram',
    'Harsh',
    'Ravi',
    'Ashok',
    'Dinesh',
    'Ajay',
    'Vishal',
    'Sachin',
    'Gaurav',
    'Pranav',
    'Siddharth',
    'Aarav',
  ],
  female: [
    'Priya',
    'Sunita',
    'Anita',
    'Rekha',
    'Meena',
    'Kavita',
    'Neha',
    'Pooja',
    'Anjali',
    'Deepika',
    'Shreya',
    'Ritu',
    'Seema',
    'Geeta',
    'Suman',
    'Asha',
    'Nisha',
    'Divya',
    'Swati',
    'Komal',
    'Manisha',
    'Sonali',
    'Preeti',
    'Shweta',
  ],
};

const indianLastNames = [
  'Sharma',
  'Verma',
  'Gupta',
  'Singh',
  'Kumar',
  'Patel',
  'Shah',
  'Mehta',
  'Jain',
  'Agarwal',
  'Bansal',
  'Mittal',
  'Kapoor',
  'Malhotra',
  'Khanna',
  'Chopra',
  'Reddy',
  'Rao',
  'Nair',
  'Pillai',
  'Iyer',
  'Menon',
  'Desai',
  'Trivedi',
  'Pandey',
  'Mishra',
  'Tiwari',
  'Dubey',
  'Srivastava',
  'Saxena',
];

const customerNames = [
  'Suresh Jewellers',
  'Laxmi Gold House',
  'Shree Balaji Jewellers',
  'Rajeshwari Ornaments',
  'Tanishq Partner Store',
  'Kalyan Gold Works',
  'Joyalukkas Supplier',
  'Malabar Gold Partner',
  'PC Jeweller Associate',
  'Senco Gold Works',
  'Tribhovandas Bhimji',
  'PNG Jewellers',
  'Waman Hari Pethe',
  'Chandukaka Saraf',
  'Mehrasons Jewellers',
  'Hazoorilal Jewellers',
  'Motisons Jewellers',
  'Amrapali Jewels',
  'Gehna Jewellers',
  'Quresh Jewellers',
  'Jewels by Rakesh',
  'Bhima Jewellers',
  'NAC Jewellers',
  'GRT Jewellers',
  'Khazana Jewellery',
  'Nakshatra Diamonds',
  'Orra Jewellery',
  'Caratlane Partner',
  'Melorra Works',
  'BlueStone Associate',
];

const jewelryTypes = [
  'Kundan Necklace Set',
  'Temple Jewellery Set',
  'Polki Choker',
  'Antique Gold Haar',
  'Bridal Maang Tikka',
  'Heavy Bangles Set',
  'Jhumka Earrings',
  'Chandbali Earrings',
  'Cocktail Ring',
  'Engagement Ring',
  'Wedding Bangles',
  'Mangalsutra',
  'Baby Kada',
  'Nose Ring (Nath)',
  'Anklet (Payal)',
  'Toe Rings Set',
  'Armlet (Bajuband)',
  'Kamar Band (Waist Belt)',
  'Vanki (Arm Ring)',
  'Thali Chain',
  'Rani Haar',
  'Satlada Necklace',
  'Guttapusalu Set',
  'Lakshmi Haar',
  'Mango Mala',
  'Temple Pendant',
  'Peacock Pendant',
  'Ganesh Pendant',
  'Chain with Pendant',
  'Diamond Tennis Bracelet',
];

const goldColors = ['Yellow Gold', 'Rose Gold', 'White Gold', 'Two-Tone', 'Tri-Color'];
const purities = [24, 22, 18, 14];
const sizes = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '6',
  '7',
  '8',
  '9',
  '10',
  '16 inches',
  '18 inches',
  '20 inches',
  '22 inches',
  '2.4',
  '2.6',
  '2.8',
  '2.10',
];

const stoneColors = ['White', 'Pink', 'Blue', 'Green', 'Red', 'Yellow', 'Colorless', 'Multi'];
const stoneCuts = [
  'Brilliant',
  'Princess',
  'Cushion',
  'Oval',
  'Marquise',
  'Pear',
  'Emerald',
  'Rose',
];
const stoneShapes = ['Round', 'Square', 'Oval', 'Heart', 'Triangle', 'Baguette', 'Trillion'];
const stoneSettings = ['Prong', 'Bezel', 'Channel', 'Pave', 'Flush', 'Tension', 'Invisible'];

const departments: DepartmentName[] = [
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

// ============================================
// USER GENERATION
// ============================================

interface UserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: DepartmentName | null;
  phone: string;
  isActive: boolean;
}

function generateIndianName(): { firstName: string; lastName: string; gender: 'male' | 'female' } {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const firstName = randomElement(indianFirstNames[gender]);
  const lastName = randomElement(indianLastNames);
  return { firstName, lastName, gender };
}

function generatePhone(): string {
  const prefixes = [
    '98',
    '99',
    '70',
    '80',
    '90',
    '73',
    '74',
    '75',
    '76',
    '77',
    '78',
    '79',
    '81',
    '82',
    '83',
    '84',
    '85',
    '86',
    '87',
    '88',
    '89',
  ];
  return `+91 ${randomElement(prefixes)}${String(Math.floor(Math.random() * 100000000)).padStart(
    8,
    '0'
  )}`;
}

async function generateUsers(): Promise<UserData[]> {
  const users: UserData[] = [];
  const hashedPassword = await hashPassword('Password@123');
  let emailCounter = 1;

  // Owner Account - Sidharth P Jain (Full system access)
  users.push({
    name: 'Sidharth P Jain',
    email: 'ativa.web.it@gmail.com',
    password: hashedPassword,
    role: 'ADMIN',
    department: null, // Owner - not assigned to any production department
    phone: '+91 9964599000',
    isActive: true,
  });

  // Other Admin Users
  const otherAdmins = [
    { first: 'Rajiv', last: 'Kapoor' },
    { first: 'Meera', last: 'Sharma' },
  ];

  for (const admin of otherAdmins) {
    users.push({
      name: `${admin.first} ${admin.last}`,
      email: `${admin.first.toLowerCase()}.${admin.last.toLowerCase()}@goldfactory.com`,
      password: hashedPassword,
      role: 'ADMIN',
      department: null,
      phone: generatePhone(),
      isActive: true,
    });
  }

  // 5 Office Staff Users
  for (let i = 0; i < 5; i++) {
    const { firstName, lastName } = generateIndianName();
    users.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@goldfactory.com`,
      password: hashedPassword,
      role: 'OFFICE_STAFF',
      department: null,
      phone: generatePhone(),
      isActive: true,
    });
  }

  // 3 Factory Managers
  const managerNames = [
    { first: 'Harish', last: 'Patel' },
    { first: 'Suresh', last: 'Mehta' },
    { first: 'Dinesh', last: 'Shah' },
  ];

  for (const manager of managerNames) {
    users.push({
      name: `${manager.first} ${manager.last}`,
      email: `${manager.first.toLowerCase()}.${manager.last.toLowerCase()}@goldfactory.com`,
      password: hashedPassword,
      role: 'FACTORY_MANAGER',
      department: null,
      phone: generatePhone(),
      isActive: true,
    });
  }

  // 10 Department Workers (distributed across departments)
  const workerDepartments: DepartmentName[] = [
    'CAD',
    'CAD',
    'PRINT',
    'CASTING',
    'CASTING',
    'FILLING',
    'MEENA',
    'POLISH_1',
    'SETTING',
    'POLISH_2',
  ];

  for (let i = 0; i < 10; i++) {
    const { firstName, lastName } = generateIndianName();
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@goldfactory.com`;

    // Handle duplicate emails
    if (users.some((u) => u.email === email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${emailCounter++}@goldfactory.com`;
    }

    users.push({
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      role: 'DEPARTMENT_WORKER',
      department: workerDepartments[i]!,
      phone: generatePhone(),
      isActive: i % 5 === 0 ? false : true, // Make every 5th worker inactive
    });
  }

  return users;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.finalSubmission.deleteMany();
  await prisma.departmentTracking.deleteMany();
  await prisma.stone.deleteMany();
  await prisma.orderDetails.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Create Users
  console.log('👤 Creating users...');
  const userData = await generateUsers();
  const createdUsers = await Promise.all(
    userData.map((user) => prisma.user.create({ data: user }))
  );

  const admins = createdUsers.filter((u) => u.role === 'ADMIN');
  const officeStaff = createdUsers.filter((u) => u.role === 'OFFICE_STAFF');
  const managers = createdUsers.filter((u) => u.role === 'FACTORY_MANAGER');
  const workers = createdUsers.filter((u) => u.role === 'DEPARTMENT_WORKER');

  console.log(`   ✅ Created ${admins.length} admins`);
  console.log(`   ✅ Created ${officeStaff.length} office staff`);
  console.log(`   ✅ Created ${managers.length} factory managers`);
  console.log(`   ✅ Created ${workers.length} department workers\n`);

  // Create Orders
  console.log('📦 Creating orders...');
  const orders = [];
  const orderCreators = [...officeStaff, ...admins];

  for (let i = 1; i <= 20; i++) {
    const creator = randomElement(orderCreators);
    const daysAgo = randomInt(0, 60);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    // Determine order status based on age
    let status: OrderStatus;
    if (daysAgo < 7) {
      status = 'DRAFT';
    } else if (daysAgo < 30) {
      status = 'IN_FACTORY';
    } else {
      status = randomElement(['IN_FACTORY', 'COMPLETED'] as OrderStatus[]);
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(i),
        customerName: randomElement(customerNames),
        customerPhone: generatePhone(),
        customerEmail: `customer${i}@example.com`,
        productPhotoUrl: `https://images.unsplash.com/photo-${1600000000000 + i}?w=400`,
        status,
        priority: randomInt(0, 5),
        createdById: creator.id,
        createdAt,
        updatedAt: createdAt,
      },
    });

    orders.push(order);
  }
  console.log(`   ✅ Created ${orders.length} orders\n`);

  // Create Order Details
  console.log('📋 Creating order details...');
  for (const order of orders) {
    const enteredBy = randomElement(orderCreators);
    const dueDate = new Date(order.createdAt);
    dueDate.setDate(dueDate.getDate() + randomInt(14, 45));

    const jewelryType = randomElement(jewelryTypes);

    await prisma.orderDetails.create({
      data: {
        orderId: order.id,
        goldWeightInitial: randomFloat(10, 150),
        purity: randomElement(purities),
        goldColor: randomElement(goldColors),
        size: randomElement(sizes),
        quantity: randomInt(1, 4),
        productType: jewelryType,
        dueDate,
        additionalDescription: `${jewelryType} - Custom design as per customer specifications. Premium finish required.`,
        specialInstructions:
          Math.random() > 0.5
            ? 'Handle with extra care. Customer is VIP. Priority processing required.'
            : null,
        referenceImages: [
          `https://images.unsplash.com/photo-${
            1600000000000 + Math.floor(Math.random() * 1000)
          }?w=400`,
          `https://images.unsplash.com/photo-${
            1600000001000 + Math.floor(Math.random() * 1000)
          }?w=400`,
        ],
        enteredById: enteredBy.id,
        createdAt: order.createdAt,
        updatedAt: order.createdAt,
      },
    });
  }
  console.log(`   ✅ Created order details for all orders\n`);

  // Create Stones
  console.log('💎 Creating stones...');
  let stoneCount = 0;
  for (const order of orders) {
    const numStones = randomInt(0, 4);

    for (let i = 0; i < numStones; i++) {
      await prisma.stone.create({
        data: {
          orderId: order.id,
          stoneType: randomElement(Object.values(StoneType)),
          stoneName: Math.random() > 0.5 ? `Stone-${order.orderNumber}-${i + 1}` : null,
          weight: randomFloat(0.1, 5),
          quantity: randomInt(1, 20),
          color: randomElement(stoneColors),
          clarity:
            Math.random() > 0.5
              ? randomElement(['VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'])
              : null,
          cut: randomElement(stoneCuts),
          shape: randomElement(stoneShapes),
          setting: randomElement(stoneSettings),
          notes: Math.random() > 0.7 ? 'Natural certified stones. Handle with care.' : null,
          createdAt: order.createdAt,
          updatedAt: order.createdAt,
        },
      });
      stoneCount++;
    }
  }
  console.log(`   ✅ Created ${stoneCount} stones\n`);

  // Create Department Tracking
  console.log('🏭 Creating department tracking...');
  let trackingCount = 0;

  for (const order of orders) {
    if (order.status === 'DRAFT') continue;

    // Get order details for gold weight
    const orderDetails = await prisma.orderDetails.findUnique({
      where: { orderId: order.id },
    });

    if (!orderDetails) continue;

    let currentGoldWeight = orderDetails.goldWeightInitial;
    const numDepartments =
      order.status === 'COMPLETED' ? departments.length : randomInt(1, departments.length - 1);

    for (let i = 0; i < numDepartments; i++) {
      const dept = departments[i]!;
      const worker = workers.find((w) => w.department === dept) || randomElement(workers);

      // Determine status
      let deptStatus: DepartmentStatus;
      let startedAt: Date | null = null;
      let completedAt: Date | null = null;

      if (i < numDepartments - 1 || order.status === 'COMPLETED') {
        deptStatus = 'COMPLETED';
        startedAt = new Date(order.createdAt);
        startedAt.setHours(startedAt.getHours() + i * 24);
        completedAt = new Date(startedAt);
        completedAt.setHours(completedAt.getHours() + randomInt(4, 48));
      } else if (i === numDepartments - 1) {
        deptStatus = randomElement(['IN_PROGRESS', 'ON_HOLD'] as DepartmentStatus[]);
        startedAt = new Date(order.createdAt);
        startedAt.setHours(startedAt.getHours() + i * 24);
      } else {
        deptStatus = 'NOT_STARTED';
      }

      // Simulate gold weight changes
      const goldLoss = randomFloat(0, 0.5);
      const goldWeightOut = deptStatus === 'COMPLETED' ? currentGoldWeight - goldLoss : null;

      await prisma.departmentTracking.create({
        data: {
          orderId: order.id,
          departmentName: dept,
          sequenceOrder: i + 1,
          status: deptStatus,
          assignedToId: worker.id,
          goldWeightIn: currentGoldWeight,
          goldWeightOut,
          goldLoss: goldWeightOut ? goldLoss : null,
          estimatedHours: randomFloat(2, 24),
          startedAt,
          completedAt,
          notes:
            deptStatus === 'COMPLETED'
              ? `${dept} work completed successfully. Quality check passed.`
              : deptStatus === 'IN_PROGRESS'
              ? `Currently working on ${dept} process.`
              : deptStatus === 'ON_HOLD'
              ? 'Waiting for customer confirmation on design change.'
              : null,
          photos:
            deptStatus !== 'NOT_STARTED'
              ? [
                  `https://images.unsplash.com/photo-${
                    1600000000000 + Math.floor(Math.random() * 1000)
                  }?w=400`,
                ]
              : [],
          issues: Math.random() > 0.9 ? 'Minor adjustment required. Resolved.' : null,
          createdAt: order.createdAt,
          updatedAt: completedAt || startedAt || order.createdAt,
        },
      });

      if (goldWeightOut) {
        currentGoldWeight = goldWeightOut;
      }

      trackingCount++;
    }
  }
  console.log(`   ✅ Created ${trackingCount} department tracking records\n`);

  // Create Final Submissions for completed orders
  console.log('✅ Creating final submissions...');
  let submissionCount = 0;

  for (const order of orders) {
    if (order.status !== 'COMPLETED') continue;

    const orderDetails = await prisma.orderDetails.findUnique({
      where: { orderId: order.id },
    });

    if (!orderDetails) continue;

    const submitter = randomElement([...managers, ...admins]);
    const finalGoldWeight = orderDetails.goldWeightInitial - randomFloat(0.5, 3);

    // Get total stone weight
    const stones = await prisma.stone.findMany({
      where: { orderId: order.id },
    });
    const totalStoneWeight = stones.reduce((sum, s) => sum + s.weight * s.quantity, 0);

    const submittedAt = new Date(order.createdAt);
    submittedAt.setDate(submittedAt.getDate() + randomInt(15, 40));

    await prisma.finalSubmission.create({
      data: {
        orderId: order.id,
        finalGoldWeight,
        finalStoneWeight: totalStoneWeight,
        finalPurity: orderDetails.purity,
        numberOfPieces: orderDetails.quantity,
        totalWeight: finalGoldWeight + totalStoneWeight,
        qualityGrade: randomElement(['A+', 'A', 'A', 'A', 'B+', 'B']),
        qualityNotes: 'Quality inspection passed. All specifications met. Ready for delivery.',
        completionPhotos: [
          `https://images.unsplash.com/photo-${
            1600000000000 + Math.floor(Math.random() * 1000)
          }?w=800`,
          `https://images.unsplash.com/photo-${
            1600000001000 + Math.floor(Math.random() * 1000)
          }?w=800`,
          `https://images.unsplash.com/photo-${
            1600000002000 + Math.floor(Math.random() * 1000)
          }?w=800`,
        ],
        certificateUrl:
          Math.random() > 0.5
            ? `https://certificates.goldfactory.com/${order.orderNumber}.pdf`
            : null,
        submittedById: submitter.id,
        submittedAt,
        customerApproved: Math.random() > 0.3,
        approvalDate:
          Math.random() > 0.3
            ? new Date(submittedAt.getTime() + randomInt(1, 5) * 24 * 60 * 60 * 1000)
            : null,
        approvalNotes: Math.random() > 0.5 ? 'Customer satisfied with the final product.' : null,
        createdAt: submittedAt,
        updatedAt: submittedAt,
      },
    });

    submissionCount++;
  }
  console.log(`   ✅ Created ${submissionCount} final submissions\n`);

  // Create sample notifications
  console.log('🔔 Creating sample notifications...');
  const notifications = [];

  for (const worker of workers.slice(0, 5)) {
    notifications.push({
      userId: worker.id,
      title: 'New Order Assigned',
      message: 'A new order has been assigned to your department. Please check the details.',
      type: 'ORDER_ASSIGNED',
      relatedId: randomElement(orders).id,
      isRead: Math.random() > 0.5,
    });
  }

  for (const staff of officeStaff.slice(0, 3)) {
    notifications.push({
      userId: staff.id,
      title: 'Order Due Soon',
      message: 'Order deadline is approaching. Please follow up with the factory.',
      type: 'DUE_DATE_REMINDER',
      relatedId: randomElement(orders).id,
      isRead: false,
    });
  }

  await prisma.notification.createMany({ data: notifications });
  console.log(`   ✅ Created ${notifications.length} notifications\n`);

  // Create sample audit logs
  console.log('📝 Creating sample audit logs...');
  const auditLogs = [];

  for (let i = 0; i < 30; i++) {
    const user = randomElement(createdUsers);
    const order = randomElement(orders);

    auditLogs.push({
      entityType: randomElement(['Order', 'OrderDetails', 'DepartmentTracking']),
      entityId: order.id,
      action: randomElement(['CREATE', 'UPDATE']),
      userId: user.id,
      oldValues: Prisma.JsonNull,
      newValues: { status: 'Updated via system' },
      ipAddress: `192.168.1.${randomInt(1, 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
    });
  }

  await prisma.auditLog.createMany({ data: auditLogs });
  console.log(`   ✅ Created ${auditLogs.length} audit log entries\n`);

  // Summary
  console.log('═'.repeat(50));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('═'.repeat(50));
  console.log('\n📊 Summary:');
  console.log(`   👤 Users: ${createdUsers.length}`);
  console.log(`      - Admins: ${admins.length}`);
  console.log(`      - Office Staff: ${officeStaff.length}`);
  console.log(`      - Factory Managers: ${managers.length}`);
  console.log(`      - Department Workers: ${workers.length}`);
  console.log(`   📦 Orders: ${orders.length}`);
  console.log(`   💎 Stones: ${stoneCount}`);
  console.log(`   🏭 Department Tracking: ${trackingCount}`);
  console.log(`   ✅ Final Submissions: ${submissionCount}`);
  console.log(`   🔔 Notifications: ${notifications.length}`);
  console.log(`   📝 Audit Logs: ${auditLogs.length}`);
  console.log('\n🔐 Default password for all users: Password@123');
  console.log('\n👤 Admin accounts:');
  for (const admin of admins) {
    console.log(`   - ${admin.email}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
