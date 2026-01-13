/**
 * ============================================
 * MOCK DATA FOR TESTS
 * ============================================
 *
 * Contains all mock data used by MSW handlers for testing.
 */

import type { User, Order, OrderStatus } from '../../types';

// ============================================
// MOCK USERS
// ============================================

export const mockUsersData = {
  admin: {
    id: 'user-admin-001',
    email: 'admin@goldfactory.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
    departmentId: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  officeStaff: {
    id: 'user-office-001',
    email: 'office@goldfactory.com',
    firstName: 'Office',
    lastName: 'Staff',
    role: 'MANAGER' as const,
    departmentId: 'dept-001',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  worker: {
    id: 'user-worker-001',
    email: 'worker@goldfactory.com',
    firstName: 'Factory',
    lastName: 'Worker',
    role: 'WORKER' as const,
    departmentId: 'dept-002',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  viewer: {
    id: 'user-viewer-001',
    email: 'viewer@goldfactory.com',
    firstName: 'View',
    lastName: 'Only',
    role: 'VIEWER' as const,
    departmentId: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
};

// ============================================
// MOCK ORDERS
// ============================================

export const mockOrdersData = [
  {
    id: 'order-001',
    orderNumber: 'ORD-2024-001',
    customerId: 'customer-001',
    customerName: 'Rajesh Jewellers',
    userId: mockUsersData.admin.id,
    departmentId: 'dept-001',
    status: 'PENDING' as OrderStatus,
    totalWeight: 150.5,
    totalAmount: 750000,
    notes: 'Priority order',
    items: [
      {
        id: 'item-001',
        orderId: 'order-001',
        inventoryId: 'inv-001',
        quantity: 10,
        weightGrams: 15.05,
        pricePerGram: 5000,
        totalPrice: 75250,
      },
    ],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'order-002',
    orderNumber: 'ORD-2024-002',
    customerId: 'customer-002',
    customerName: 'Golden Touch',
    userId: mockUsersData.officeStaff.id,
    departmentId: 'dept-002',
    status: 'IN_PRODUCTION' as OrderStatus,
    totalWeight: 200.0,
    totalAmount: 1000000,
    notes: null,
    items: [
      {
        id: 'item-002',
        orderId: 'order-002',
        inventoryId: 'inv-002',
        quantity: 5,
        weightGrams: 40.0,
        pricePerGram: 5000,
        totalPrice: 200000,
      },
    ],
    createdAt: '2024-01-14T09:00:00.000Z',
    updatedAt: '2024-01-16T14:00:00.000Z',
  },
  {
    id: 'order-003',
    orderNumber: 'ORD-2024-003',
    customerId: 'customer-003',
    customerName: 'Diamond Palace',
    userId: mockUsersData.admin.id,
    departmentId: 'dept-001',
    status: 'COMPLETED' as OrderStatus,
    totalWeight: 75.25,
    totalAmount: 380000,
    notes: 'Rush delivery',
    items: [],
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2024-01-18T16:00:00.000Z',
  },
  {
    id: 'order-004',
    orderNumber: 'ORD-2024-004',
    customerId: 'customer-004',
    customerName: 'Royal Gems',
    userId: mockUsersData.worker.id,
    departmentId: 'dept-003',
    status: 'QUALITY_CHECK' as OrderStatus,
    totalWeight: 50.0,
    totalAmount: 250000,
    notes: null,
    items: [],
    createdAt: '2024-01-12T11:00:00.000Z',
    updatedAt: '2024-01-17T13:00:00.000Z',
  },
];

// ============================================
// MOCK DASHBOARD DATA
// ============================================

export const mockDashboardData = {
  metrics: {
    totalOrders: 156,
    pendingOrders: 25,
    inProgressOrders: 42,
    completedOrders: 89,
    totalRevenue: 15000000,
    averageOrderValue: 96153,
    activeWorkers: 12,
    departmentsActive: 5,
  },
  recentActivity: [
    {
      id: 'activity-001',
      type: 'ORDER_CREATED',
      message: 'New order ORD-2024-001 created',
      userId: mockUsersData.admin.id,
      userName: 'Admin User',
      createdAt: '2024-01-15T10:00:00.000Z',
    },
    {
      id: 'activity-002',
      type: 'ORDER_STATUS_CHANGED',
      message: 'Order ORD-2024-002 moved to IN_PRODUCTION',
      userId: mockUsersData.officeStaff.id,
      userName: 'Office Staff',
      createdAt: '2024-01-16T14:00:00.000Z',
    },
    {
      id: 'activity-003',
      type: 'ORDER_COMPLETED',
      message: 'Order ORD-2024-003 completed',
      userId: mockUsersData.worker.id,
      userName: 'Factory Worker',
      createdAt: '2024-01-18T16:00:00.000Z',
    },
  ],
  chartData: {
    ordersByMonth: [
      { month: 'Jan', count: 45 },
      { month: 'Feb', count: 52 },
      { month: 'Mar', count: 38 },
      { month: 'Apr', count: 65 },
      { month: 'May', count: 58 },
      { month: 'Jun', count: 72 },
    ],
    revenueByMonth: [
      { month: 'Jan', amount: 2250000 },
      { month: 'Feb', amount: 2600000 },
      { month: 'Mar', amount: 1900000 },
      { month: 'Apr', amount: 3250000 },
      { month: 'May', amount: 2900000 },
      { month: 'Jun', amount: 3600000 },
    ],
  },
};

// ============================================
// MOCK KANBAN ORDERS (Factory Tracking)
// ============================================

export const mockKanbanOrders = [
  {
    id: 'kanban-001',
    orderNumber: 'ORD-2024-001',
    customerName: 'Rajesh Jewellers',
    productType: 'NECKLACE',
    purity: '22K',
    currentDepartment: 'dept-melting',
    targetWeight: 150.5,
    currentWeight: 0,
    status: 'PENDING',
    priority: 'HIGH',
    dueDate: '2024-01-25T00:00:00.000Z',
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'kanban-002',
    orderNumber: 'ORD-2024-002',
    customerName: 'Golden Touch',
    productType: 'RING',
    purity: '18K',
    currentDepartment: 'dept-molding',
    targetWeight: 200.0,
    currentWeight: 198.5,
    status: 'IN_PROGRESS',
    priority: 'NORMAL',
    dueDate: '2024-01-28T00:00:00.000Z',
    createdAt: '2024-01-14T09:00:00.000Z',
  },
  {
    id: 'kanban-003',
    orderNumber: 'ORD-2024-003',
    customerName: 'Diamond Palace',
    productType: 'BRACELET',
    purity: '24K',
    currentDepartment: 'dept-polishing',
    targetWeight: 75.25,
    currentWeight: 75.0,
    status: 'QUALITY_CHECK',
    priority: 'NORMAL',
    dueDate: '2024-01-20T00:00:00.000Z',
    createdAt: '2024-01-10T08:00:00.000Z',
  },
];

// ============================================
// MOCK SUBMISSIONS
// ============================================

export const mockSubmissions = [
  {
    id: 'submission-001',
    orderId: 'order-001',
    orderNumber: 'ORD-2024-001',
    submittedBy: mockUsersData.worker.id,
    submittedByName: 'Factory Worker',
    finalWeight: 150.2,
    targetWeight: 150.5,
    variance: -0.3,
    status: 'PENDING',
    notes: 'Minor weight difference due to polishing',
    submittedAt: '2024-01-17T15:00:00.000Z',
    approvedAt: null,
    approvedBy: null,
  },
  {
    id: 'submission-002',
    orderId: 'order-002',
    orderNumber: 'ORD-2024-002',
    submittedBy: mockUsersData.worker.id,
    submittedByName: 'Factory Worker',
    finalWeight: 200.0,
    targetWeight: 200.0,
    variance: 0,
    status: 'APPROVED',
    notes: null,
    submittedAt: '2024-01-16T12:00:00.000Z',
    approvedAt: '2024-01-16T14:00:00.000Z',
    approvedBy: mockUsersData.officeStaff.id,
  },
];

// ============================================
// MOCK API RESPONSES (for special cases)
// ============================================

export const mockApiResponses = {
  success: {
    success: true,
    message: 'Operation completed successfully',
    timestamp: new Date().toISOString(),
  },
  error: {
    success: false,
    message: 'An error occurred',
    timestamp: new Date().toISOString(),
  },
  unauthorized: {
    success: false,
    message: 'Unauthorized',
    timestamp: new Date().toISOString(),
  },
  notFound: {
    success: false,
    message: 'Resource not found',
    timestamp: new Date().toISOString(),
  },
  validationError: {
    success: false,
    message: 'Validation failed',
    errors: [
      { field: 'email', message: 'Email is required' },
      { field: 'password', message: 'Password must be at least 8 characters' },
    ],
    timestamp: new Date().toISOString(),
  },
};
