/**
 * ============================================
 * MSW HANDLERS
 * ============================================
 *
 * Mock Service Worker request handlers for API mocking.
 * Intercepts HTTP requests and returns mock responses.
 */

import { http, HttpResponse, delay } from 'msw';
import {
  mockUsersData,
  mockOrdersData,
  mockDashboardData,
  mockKanbanOrders,
  mockSubmissions,
  mockApiResponses,
} from './mockData';

const API_BASE = '/api';

// ============================================
// AUTH HANDLERS
// ============================================

export const authHandlers = [
  // Login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    await delay(100);

    const body = (await request.json()) as { email: string; password: string };

    // Check credentials
    if (body.email === 'admin@goldfactory.com' && body.password === 'Password@123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUsersData.admin,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
        },
        message: 'Login successful',
        timestamp: new Date().toISOString(),
      });
    }

    if (body.email === 'office@goldfactory.com' && body.password === 'Password@123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUsersData.officeStaff,
          accessToken: 'mock-access-token-office',
          refreshToken: 'mock-refresh-token-office',
          expiresIn: 3600,
        },
        message: 'Login successful',
        timestamp: new Date().toISOString(),
      });
    }

    return HttpResponse.json(
      {
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }),

  // Logout
  http.post(`${API_BASE}/auth/logout`, async () => {
    await delay(50);
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get current user
  http.get(`${API_BASE}/auth/me`, async ({ request }) => {
    await delay(50);

    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: mockUsersData.admin,
      timestamp: new Date().toISOString(),
    });
  }),

  // Refresh token
  http.post(`${API_BASE}/auth/refresh-token`, async () => {
    await delay(50);
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-mock-access-token',
        expiresIn: 3600,
      },
      timestamp: new Date().toISOString(),
    });
  }),
];

// ============================================
// ORDERS HANDLERS
// ============================================

export const ordersHandlers = [
  // List orders
  http.get(`${API_BASE}/orders`, async ({ request }) => {
    await delay(100);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let filteredOrders = [...mockOrdersData];

    // Filter by status
    if (status) {
      filteredOrders = filteredOrders.filter((o) => o.status === status);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = filteredOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchLower) ||
          o.customerName.toLowerCase().includes(searchLower)
      );
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        total: filteredOrders.length,
        page,
        limit,
        totalPages: Math.ceil(filteredOrders.length / limit),
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get single order
  http.get(`${API_BASE}/orders/:id`, async ({ params }) => {
    await delay(50);

    const { id } = params;
    const order = mockOrdersData.find((o) => o.id === id);

    if (!order) {
      return HttpResponse.json(
        { success: false, message: 'Order not found', timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create order
  http.post(`${API_BASE}/orders`, async ({ request }) => {
    await delay(150);

    const body = (await request.json()) as Record<string, unknown>;

    const newOrder = {
      id: `order-${Date.now()}`,
      orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    };

    return HttpResponse.json(
      {
        success: true,
        data: newOrder,
        message: 'Order created successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // Update order
  http.put(`${API_BASE}/orders/:id`, async ({ params, request }) => {
    await delay(100);

    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;
    const order = mockOrdersData.find((o) => o.id === id);

    if (!order) {
      return HttpResponse.json(
        { success: false, message: 'Order not found', timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { ...order, ...body, updatedAt: new Date().toISOString() },
      message: 'Order updated successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete order
  http.delete(`${API_BASE}/orders/:id`, async ({ params }) => {
    await delay(100);

    const { id } = params;
    const order = mockOrdersData.find((o) => o.id === id);

    if (!order) {
      return HttpResponse.json(
        { success: false, message: 'Order not found', timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Order deleted successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // Order stats
  http.get(`${API_BASE}/orders/stats`, async () => {
    await delay(50);
    return HttpResponse.json({
      success: true,
      data: {
        totalOrders: 156,
        byStatus: {
          DRAFT: 12,
          PENDING: 25,
          IN_PROGRESS: 42,
          QUALITY_CHECK: 15,
          COMPLETED: 52,
          DELIVERED: 10,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }),
];

// ============================================
// DASHBOARD HANDLERS
// ============================================

export const dashboardHandlers = [
  http.get(`${API_BASE}/dashboard`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      data: mockDashboardData,
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE}/dashboard/metrics`, async () => {
    await delay(50);
    return HttpResponse.json({
      success: true,
      data: mockDashboardData.metrics,
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE}/dashboard/activity`, async () => {
    await delay(50);
    return HttpResponse.json({
      success: true,
      data: mockDashboardData.recentActivity,
      timestamp: new Date().toISOString(),
    });
  }),
];

// ============================================
// FACTORY/KANBAN HANDLERS
// ============================================

export const factoryHandlers = [
  http.get(`${API_BASE}/factory/tracking`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      data: mockKanbanOrders,
      timestamp: new Date().toISOString(),
    });
  }),

  http.put(`${API_BASE}/factory/orders/:id/department`, async ({ params, request }) => {
    await delay(100);

    const { id } = params;
    const body = (await request.json()) as { departmentId: string };
    const order = mockKanbanOrders.find((o) => o.id === id);

    if (!order) {
      return HttpResponse.json(
        { success: false, message: 'Order not found', timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { ...order, currentDepartment: body.departmentId },
      message: 'Order moved successfully',
      timestamp: new Date().toISOString(),
    });
  }),
];

// ============================================
// SUBMISSIONS HANDLERS
// ============================================

export const submissionsHandlers = [
  http.get(`${API_BASE}/submissions`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      data: mockSubmissions,
      pagination: {
        total: mockSubmissions.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE}/orders/:orderId/submit`, async ({ params, request }) => {
    await delay(100);

    const { orderId } = params;
    const body = (await request.json()) as { finalWeight: number };

    return HttpResponse.json(
      {
        success: true,
        data: {
          id: `submission-${Date.now()}`,
          orderId,
          ...body,
          status: 'PENDING',
          submittedAt: new Date().toISOString(),
        },
        message: 'Submission created successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.put(`${API_BASE}/submissions/:id/approval`, async ({ params, request }) => {
    await delay(100);

    const { id } = params;
    const body = (await request.json()) as { status: string };

    return HttpResponse.json({
      success: true,
      data: {
        id,
        status: body.status,
        approvedAt: new Date().toISOString(),
      },
      message: `Submission ${body.status.toLowerCase()}`,
      timestamp: new Date().toISOString(),
    });
  }),
];

// ============================================
// USERS HANDLERS
// ============================================

export const usersHandlers = [
  http.get(`${API_BASE}/users`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      data: Object.values(mockUsersData),
      pagination: {
        total: Object.keys(mockUsersData).length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE}/users/:id`, async ({ params }) => {
    await delay(50);

    const { id } = params;
    const user = Object.values(mockUsersData).find((u) => u.id === id);

    if (!user) {
      return HttpResponse.json(
        { success: false, message: 'User not found', timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  }),
];

// ============================================
// ERROR HANDLERS (for testing error states)
// ============================================

export const errorHandlers = {
  networkError: http.get(`${API_BASE}/orders`, () => {
    return HttpResponse.error();
  }),

  serverError: http.get(`${API_BASE}/orders`, () => {
    return HttpResponse.json(
      { success: false, message: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }),

  unauthorized: http.get(`${API_BASE}/orders`, () => {
    return HttpResponse.json(
      { success: false, message: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }),
};

// ============================================
// COMBINE ALL HANDLERS
// ============================================

export const handlers = [
  ...authHandlers,
  ...ordersHandlers,
  ...dashboardHandlers,
  ...factoryHandlers,
  ...submissionsHandlers,
  ...usersHandlers,
];
