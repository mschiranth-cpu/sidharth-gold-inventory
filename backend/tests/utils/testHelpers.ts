/**
 * ============================================
 * TEST HELPERS
 * ============================================
 *
 * Utility functions for creating test data
 * and performing common test operations.
 */

import {
  PrismaClient,
  UserRole,
  DepartmentName,
  OrderStatus,
  DepartmentStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { app } from '../../src/index';
import { mockUsers, mockOrders } from './mockData';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: DepartmentName | null;
  password: string;
  token: string;
}

export interface TestOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdById: string;
}

// ============================================
// USER HELPERS
// ============================================

/**
 * Creates a test user in the database
 */
export async function createTestUser(
  overrides: Partial<typeof mockUsers.admin> = {},
  options: { role?: UserRole } = {}
): Promise<TestUser> {
  const userData: any = {
    ...mockUsers.admin,
    ...overrides,
    role: options.role || overrides.role || 'ADMIN',
    email:
      overrides.email || `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
  };

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role as UserRole,
      department: (userData.department as DepartmentName) || null,
      phone: userData.phone,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    },
  });

  const token = generateTestToken(user.id, user.role);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    password: userData.password,
    token,
  };
}

/**
 * Creates users for each role for testing role-based access
 */
export async function createTestUsersForAllRoles(): Promise<Record<string, TestUser>> {
  const admin = await createTestUser(mockUsers.admin, { role: 'ADMIN' });
  const officeStaff = await createTestUser(mockUsers.officeStaff, { role: 'OFFICE_STAFF' });
  const factoryManager = await createTestUser(mockUsers.factoryManager, {
    role: 'FACTORY_MANAGER',
  });
  const departmentWorker = await createTestUser(mockUsers.departmentWorker, {
    role: 'DEPARTMENT_WORKER',
  });

  return {
    admin,
    officeStaff,
    factoryManager,
    departmentWorker,
  };
}

/**
 * Generates a JWT token for testing
 */
export function generateTestToken(userId: string, role: UserRole): string {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret';
  return jwt.sign({ userId, role, type: 'access' }, secret, { expiresIn: '1h' });
}

/**
 * Generates an expired token for testing
 */
export function generateExpiredToken(userId: string, role: UserRole): string {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret';
  return jwt.sign(
    { userId, role, type: 'access' },
    secret,
    { expiresIn: '-1s' } // Already expired
  );
}

/**
 * Gets auth token by logging in
 */
export async function getAuthToken(email: string, password: string): Promise<string> {
  const response = await request(app).post('/api/auth/login').send({ email, password });

  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.body.message}`);
  }

  return response.body.data.accessToken;
}

// ============================================
// ORDER HELPERS
// ============================================

/**
 * Creates a test order in the database
 */
export async function createTestOrder(
  createdById: string,
  overrides: Partial<typeof mockOrders.validOrder> = {}
): Promise<TestOrder> {
  const orderData = { ...mockOrders.validOrder, ...overrides };

  // Generate unique order number
  const orderNumber = `ORD-TEST-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)
    .toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      priority: orderData.priority || 5,
      status: 'DRAFT',
      createdById,
      orderDetails: {
        create: {
          goldWeightInitial: orderData.orderDetails.goldWeightInitial,
          purity: orderData.orderDetails.purity,
          goldColor: orderData.orderDetails.goldColor,
          size: orderData.orderDetails.size,
          quantity: orderData.orderDetails.quantity,
          productType: orderData.orderDetails.productType,
          dueDate: orderData.orderDetails.dueDate ? new Date(orderData.orderDetails.dueDate) : null,
          additionalDescription: orderData.orderDetails.additionalDescription,
          specialInstructions: orderData.orderDetails.specialInstructions,
          enteredById: createdById,
        },
      },
    },
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdById: order.createdById,
  };
}

/**
 * Creates an order that's ready for factory (IN_FACTORY status with departments)
 */
export async function createOrderInFactory(
  createdById: string,
  assignedToId?: string
): Promise<TestOrder> {
  const order = await createTestOrder(createdById);

  // Update status to IN_FACTORY
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'IN_FACTORY' },
  });

  // Create department tracking for CAD (first department)
  if (assignedToId) {
    await prisma.departmentTracking.create({
      data: {
        order: { connect: { id: order.id } },
        departmentName: 'CAD',
        sequenceOrder: 1,
        status: 'IN_PROGRESS',
        assignedTo: { connect: { id: assignedToId } },
        startedAt: new Date(),
      },
    });
  }

  return { ...order, status: 'IN_FACTORY' };
}

/**
 * Creates an order with all departments completed (ready for submission)
 */
export async function createCompletedDepartmentsOrder(
  createdById: string,
  assignedToId?: string
): Promise<TestOrder> {
  const workerId = assignedToId || createdById;
  const order = await createOrderInFactory(createdById, workerId);

  // Complete all departments
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

  // Delete existing CAD tracking
  await prisma.departmentTracking.deleteMany({
    where: { orderId: order.id },
  });

  // Create completed tracking for all departments
  let seq = 1;
  for (const dept of departments) {
    await prisma.departmentTracking.create({
      data: {
        order: { connect: { id: order.id } },
        departmentName: dept,
        sequenceOrder: seq++,
        status: 'COMPLETED',
        assignedTo: { connect: { id: workerId } },
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completedAt: new Date(),
        goldWeightOut: 25.0,
        notes: `${dept} completed`,
      },
    });
  }

  return order;
}

// ============================================
// DEPARTMENT HELPERS
// ============================================

/**
 * Creates department tracking for an order
 */
export async function createDepartmentTracking(
  orderId: string,
  departmentName: DepartmentName | string,
  goldWeightIn: number = 25.0,
  assignedToId?: string,
  status: DepartmentStatus = 'NOT_STARTED'
) {
  return prisma.departmentTracking.create({
    data: {
      order: { connect: { id: orderId } },
      departmentName: departmentName as DepartmentName,
      sequenceOrder: 1,
      status,
      assignedTo: assignedToId ? { connect: { id: assignedToId } } : undefined,
      goldWeightIn,
      startedAt: status !== 'NOT_STARTED' ? new Date() : null,
    },
  });
}

// ============================================
// CLEANUP HELPERS
// ============================================

/**
 * Cleans up all test data created during tests
 */
export async function cleanupTestData() {
  await prisma.$transaction([
    prisma.finalSubmission.deleteMany(),
    prisma.departmentTracking.deleteMany(),
    prisma.stone.deleteMany(),
    prisma.orderDetails.deleteMany(),
    prisma.order.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/**
 * Cleans up specific test user
 */
export async function deleteTestUser(userId: string) {
  try {
    // Delete related data first
    await prisma.departmentTracking.deleteMany({ where: { assignedToId: userId } });
    await prisma.finalSubmission.deleteMany({ where: { submittedById: userId } });
    await prisma.orderDetails.deleteMany({ where: { enteredById: userId } });

    // Delete orders created by user
    const orders = await prisma.order.findMany({ where: { createdById: userId } });
    for (const order of orders) {
      await prisma.departmentTracking.deleteMany({ where: { orderId: order.id } });
      await prisma.stone.deleteMany({ where: { orderId: order.id } });
      await prisma.orderDetails.deleteMany({ where: { orderId: order.id } });
      await prisma.finalSubmission.deleteMany({ where: { orderId: order.id } });
    }
    await prisma.order.deleteMany({ where: { createdById: userId } });

    // Delete user
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    console.error('Error deleting test user:', error);
  }
}

/**
 * Cleans up specific test order
 */
export async function deleteTestOrder(orderId: string) {
  try {
    await prisma.$transaction([
      prisma.finalSubmission.deleteMany({ where: { orderId } }),
      prisma.departmentTracking.deleteMany({ where: { orderId } }),
      prisma.stone.deleteMany({ where: { orderId } }),
      prisma.orderDetails.deleteMany({ where: { orderId } }),
      prisma.order.delete({ where: { id: orderId } }),
    ]);
  } catch (error) {
    console.error('Error deleting test order:', error);
  }
}

// ============================================
// REQUEST HELPERS
// ============================================

/**
 * Makes an authenticated GET request
 */
export function authGet(url: string, token: string) {
  return request(app).get(url).set('Authorization', `Bearer ${token}`);
}

/**
 * Makes an authenticated POST request
 */
export function authPost(url: string, token: string, body: any = {}) {
  return request(app).post(url).set('Authorization', `Bearer ${token}`).send(body);
}

/**
 * Makes an authenticated PUT request
 */
export function authPut(url: string, token: string, body: any = {}) {
  return request(app).put(url).set('Authorization', `Bearer ${token}`).send(body);
}

/**
 * Makes an authenticated PATCH request
 */
export function authPatch(url: string, token: string, body: any = {}) {
  return request(app).patch(url).set('Authorization', `Bearer ${token}`).send(body);
}

/**
 * Makes an authenticated DELETE request
 */
export function authDelete(url: string, token: string) {
  return request(app).delete(url).set('Authorization', `Bearer ${token}`);
}

// ============================================
// ASSERTION HELPERS
// ============================================

/**
 * Validates API response structure
 */
export function expectApiResponse(response: any, statusCode: number = 200) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success');
  expect(response.body).toHaveProperty('timestamp');
}

/**
 * Validates success response
 */
export function expectSuccessResponse(response: any, statusCode: number = 200) {
  expectApiResponse(response, statusCode);
  expect(response.body.success).toBe(true);
  expect(response.body).toHaveProperty('data');
}

/**
 * Validates error response
 */
export function expectErrorResponse(response: any, statusCode: number) {
  expectApiResponse(response, statusCode);
  expect(response.body.success).toBe(false);
  // API returns error message in either response.body.message or response.body.error.message
  const hasMessage = response.body.message || response.body.error?.message;
  expect(hasMessage).toBeTruthy();
}

/**
 * Validates paginated response
 */
export function expectPaginatedResponse(response: any) {
  expectSuccessResponse(response);
  expect(response.body).toHaveProperty('pagination');
  expect(response.body.pagination).toHaveProperty('total');
  expect(response.body.pagination).toHaveProperty('page');
  expect(response.body.pagination).toHaveProperty('limit');
  expect(response.body.pagination).toHaveProperty('totalPages');
  expect(Array.isArray(response.body.data)).toBe(true);
}

export { prisma };
