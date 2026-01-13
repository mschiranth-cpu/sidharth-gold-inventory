/**
 * ============================================
 * API MOCKS FOR E2E TESTS
 * ============================================
 *
 * Mock API responses for Playwright e2e tests.
 * These allow tests to run without a real backend.
 */

import { Page, Route } from '@playwright/test';

// ============================================
// MOCK DATA
// ============================================

export const mockUsers = {
  admin: {
    id: '1',
    email: 'admin@goldfactory.com',
    name: 'Admin User',
    role: 'ADMIN',
    department: null,
    phone: '+91 9876543210',
    avatar: null,
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  officeStaff: {
    id: '2',
    email: 'office@goldfactory.com',
    name: 'Office Staff',
    role: 'OFFICE_STAFF',
    department: null,
    phone: '+91 9876543211',
    avatar: null,
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  factoryManager: {
    id: '3',
    email: 'factory@goldfactory.com',
    name: 'Factory Manager',
    role: 'FACTORY_MANAGER',
    department: 'Production',
    phone: '+91 9876543212',
    avatar: null,
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  worker: {
    id: '4',
    email: 'worker@goldfactory.com',
    name: 'Worker User',
    role: 'DEPARTMENT_WORKER',
    department: 'Melting',
    phone: '+91 9876543213',
    avatar: null,
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
  },
};

const mockToken = 'mock-jwt-token-for-e2e-tests';

export const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2026-0001',
    customerName: 'Test Customer 1',
    mobileNumber: '9876543210',
    email: 'test1@example.com',
    priority: 'HIGH',
    status: 'PENDING',
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    actualDeliveryDate: null,
    jewelryType: 'Ring',
    goldType: '22K',
    grossWeight: 15.5,
    netWeight: 14.2,
    stoneWeight: 1.3,
    wastagePercent: 3,
    makingCharges: 5000,
    quantity: 2,
    specialInstructions: 'Handle with care',
    currentDepartment: 'DESIGN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    orderNumber: 'ORD-2026-0002',
    customerName: 'Test Customer 2',
    mobileNumber: '9876543211',
    email: 'test2@example.com',
    priority: 'NORMAL',
    status: 'IN_PROGRESS',
    expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    actualDeliveryDate: null,
    jewelryType: 'Necklace',
    goldType: '18K',
    grossWeight: 45.0,
    netWeight: 42.5,
    stoneWeight: 2.5,
    wastagePercent: 2.5,
    makingCharges: 15000,
    quantity: 1,
    specialInstructions: null,
    currentDepartment: 'MELTING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    orderNumber: 'ORD-2026-0003',
    customerName: 'Test Customer 3',
    mobileNumber: '9876543212',
    email: null,
    priority: 'URGENT',
    status: 'COMPLETED',
    expectedDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    actualDeliveryDate: new Date().toISOString(),
    jewelryType: 'Bracelet',
    goldType: '24K',
    grossWeight: 25.0,
    netWeight: 25.0,
    stoneWeight: 0,
    wastagePercent: 2,
    makingCharges: 8000,
    quantity: 1,
    specialInstructions: 'VIP Customer',
    currentDepartment: 'QUALITY_CHECK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockDashboardMetrics = {
  totalOrders: 248,
  pendingOrders: 67,
  inProgressOrders: 89,
  completedOrders: 12,
  overdueOrders: 5,
  totalRevenue: 1500000,
  averageCompletionTime: 4.5,
  percentageChange: {
    totalOrders: 12,
    pendingOrders: -5,
    inProgressOrders: 8,
    completedOrders: 15,
  },
};

export const mockDepartments = [
  { id: '1', name: 'Design', code: 'DESIGN', orderCount: 5 },
  { id: '2', name: 'Melting', code: 'MELTING', orderCount: 8 },
  { id: '3', name: 'Casting', code: 'CASTING', orderCount: 3 },
  { id: '4', name: 'Filing', code: 'FILING', orderCount: 4 },
  { id: '5', name: 'Setting', code: 'SETTING', orderCount: 6 },
  { id: '6', name: 'Polish', code: 'POLISH', orderCount: 2 },
  { id: '7', name: 'Quality Check', code: 'QUALITY_CHECK', orderCount: 7 },
];

export const mockActivities = [
  {
    id: '1',
    action: 'ORDER_CREATED',
    description: 'New order created',
    user: mockUsers.officeStaff,
    orderId: '1',
    orderNumber: 'ORD-2026-0001',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    action: 'STATUS_CHANGED',
    description: 'Order moved to Design',
    user: mockUsers.factoryManager,
    orderId: '1',
    orderNumber: 'ORD-2026-0001',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    action: 'ORDER_COMPLETED',
    description: 'Order completed',
    user: mockUsers.worker,
    orderId: '3',
    orderNumber: 'ORD-2026-0003',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// API MOCK SETUP
// ============================================

// Use WeakMap to track logged-in user per page (prevents memory leaks)
const pageUserMap = new WeakMap<Page, typeof mockUsers.admin>();

export async function setupApiMocks(
  page: Page,
  initialUser?: typeof mockUsers.admin
): Promise<void> {
  // Set initial user if provided
  if (initialUser) {
    pageUserMap.set(page, initialUser);
  }

  // Match all API calls
  await page.route('**/api/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Auth - Login
    if (url.includes('/api/auth/login') && method === 'POST') {
      const postData = route.request().postDataJSON();

      let user = null;
      if (postData?.email === 'admin@goldfactory.com' && postData?.password === 'Admin@123') {
        user = mockUsers.admin;
      } else if (
        postData?.email === 'office@goldfactory.com' &&
        postData?.password === 'Office@123'
      ) {
        user = mockUsers.officeStaff;
      } else if (
        postData?.email === 'factory@goldfactory.com' &&
        postData?.password === 'Factory@123'
      ) {
        user = mockUsers.factoryManager;
      } else if (
        postData?.email === 'worker@goldfactory.com' &&
        postData?.password === 'Worker@123'
      ) {
        user = mockUsers.worker;
      }

      if (user) {
        // Store the logged-in user for this page
        pageUserMap.set(page, user);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user,
              accessToken: 'mock-jwt-token-for-e2e-tests',
              refreshToken: 'mock-refresh-token-for-e2e-tests',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid credentials',
            message: 'Invalid email or password',
          }),
        });
      }
      return;
    }

    // Auth - Me (current user)
    if (url.includes('/api/auth/me') && method === 'GET') {
      // Return the current logged-in user for this page or admin as default
      const userToReturn = pageUserMap.get(page) || mockUsers.admin;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: userToReturn,
        }),
      });
      return;
    }

    // Auth - Logout
    if (url.includes('/api/auth/logout')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    // Orders - List
    if (url.includes('/api/orders') && method === 'GET' && !url.match(/\/orders\/ORD-/)) {
      const urlObj = new URL(url);
      const search = urlObj.searchParams.get('search') || '';
      const status = urlObj.searchParams.get('status');
      const priority = urlObj.searchParams.get('priority');

      let filteredOrders = [...mockOrders];

      if (search) {
        filteredOrders = filteredOrders.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            o.customerName.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (status) {
        filteredOrders = filteredOrders.filter((o) => o.status === status);
      }
      if (priority) {
        filteredOrders = filteredOrders.filter((o) => o.priority === priority);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: filteredOrders,
          pagination: {
            page: 1,
            limit: 10,
            total: filteredOrders.length,
            totalPages: 1,
          },
        }),
      });
      return;
    }

    // Orders - Create
    if (url.includes('/api/orders') && method === 'POST') {
      const postData = route.request().postDataJSON();
      const newOrder = {
        id: String(mockOrders.length + 1),
        orderNumber: `ORD-2026-${String(mockOrders.length + 1).padStart(4, '0')}`,
        ...postData,
        status: 'PENDING',
        currentDepartment: 'DESIGN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockOrders.push(newOrder);

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: newOrder,
        }),
      });
      return;
    }

    // Orders - Single order
    if (url.match(/\/api\/orders\/ORD-/)) {
      const orderNumber = url.split('/orders/')[1]?.split('?')[0];
      const order = mockOrders.find((o) => o.orderNumber === orderNumber);

      if (method === 'GET') {
        if (order) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: order,
            }),
          });
        } else {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Order not found',
            }),
          });
        }
        return;
      }

      if (method === 'PUT' || method === 'PATCH') {
        const postData = route.request().postDataJSON();
        Object.assign(order || {}, postData, { updatedAt: new Date().toISOString() });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: order,
          }),
        });
        return;
      }

      if (method === 'DELETE') {
        const index = mockOrders.findIndex((o) => o.orderNumber === orderNumber);
        if (index > -1) {
          mockOrders.splice(index, 1);
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
        return;
      }
    }

    // Dashboard
    if (url.includes('/api/dashboard')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockDashboardMetrics,
        }),
      });
      return;
    }

    // Departments
    if (url.includes('/api/departments')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockDepartments,
        }),
      });
      return;
    }

    // Factory tracking / Kanban
    if (url.includes('/api/factory')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockOrders,
        }),
      });
      return;
    }

    // Activity feed
    if (url.includes('/api/activities')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockActivities,
        }),
      });
      return;
    }

    // Users
    if (url.includes('/api/users')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: Object.values(mockUsers),
        }),
      });
      return;
    }

    // Notifications
    if (url.includes('/api/notifications')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
      return;
    }

    // Workers for department
    if (url.includes('/api/workers')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [mockUsers.worker],
        }),
      });
      return;
    }

    // Upload / files
    if (url.includes('/api/upload')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            url: 'https://example.com/uploaded-file.jpg',
            filename: 'uploaded-file.jpg',
          },
        }),
      });
      return;
    }

    // Default fallback for unhandled API routes
    console.log(`Unhandled API route: ${method} ${url}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    });
  });
}
