/**
 * ============================================
 * DASHBOARD SERVICE
 * ============================================
 *
 * API functions for fetching dashboard data.
 * Uses existing /orders/stats and other endpoints.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { apiGet } from './api';
import type {
  DashboardData,
  DashboardMetrics,
  DepartmentWorkload,
  OrderStatusDistribution,
  RecentActivity,
  DailyOrderTrend,
} from '../types/dashboard.types';
import { DEPARTMENTS, DEPARTMENT_LABELS } from '../types/user.types';
import type { DepartmentName as _DepartmentName } from '../types/user.types';

// ============================================
// API ENDPOINTS
// ============================================

const ENDPOINTS = {
  orderStats: '/orders/stats',
  orders: '/orders',
  submissions: '/submissions',
  notifications: '/notifications',
};

// ============================================
// API RESPONSE TYPES
// ============================================

interface OrderStatsResponse {
  success: boolean;
  data: {
    total: number;
    byStatus: Record<string, number>;
    overdueCount: number;
    dueTodayCount: number;
  };
}

interface OrdersResponse {
  success: boolean;
  data: Array<{
    id: string;
    orderNumber: string;
    currentDepartment: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface SubmissionsResponse {
  success: boolean;
  data: {
    submissions: Array<any>;
    stats: {
      pendingApprovals: number;
      approvedToday: number;
      totalSubmissions: number;
    };
  };
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch all dashboard data by combining multiple endpoints
 */
export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    // Fetch data from multiple endpoints in parallel
    const [statsRes, ordersRes, submissionsRes] = await Promise.all([
      apiGet<OrderStatsResponse>(ENDPOINTS.orderStats),
      apiGet<OrdersResponse>(
        `${ENDPOINTS.orders}?page=1&limit=100&sortBy=createdAt&sortOrder=desc`
      ),
      apiGet<SubmissionsResponse>(`${ENDPOINTS.submissions}?page=1&limit=50`),
    ]);

    const stats = (statsRes as any)?.data || statsRes;
    const orders = (ordersRes as any)?.data || [];

    // Calculate metrics from real data
    const metrics: DashboardMetrics = {
      totalOrders: stats.total || 0,
      ordersInProgress: stats.byStatus?.IN_FACTORY || 0,
      completedToday: stats.byStatus?.COMPLETED || 0,
      overdueOrders: stats.overdueCount || 0,
      totalGoldInProcess: 0, // Not available without factory module
      totalSilverInProcess: 0,
      totalPlatinumInProcess: 0,
      pendingSubmissions: (submissionsRes as any)?.data?.stats?.pendingApprovals || 0,
    };

    // Calculate department workload from orders
    const departmentWorkload: DepartmentWorkload[] = DEPARTMENTS.map((dept, index) => {
      const deptOrders = orders.filter((o: any) => o.currentDepartment === dept);
      return {
        departmentId: String(index + 1),
        departmentName: DEPARTMENT_LABELS[dept],
        activeItems: deptOrders.length,
        pendingItems: 0,
        completedToday: 0,
        totalWeight: 0,
      };
    });

    // Order status distribution
    const orderStatusDistribution: OrderStatusDistribution[] = [
      { status: 'Pending Assignment', count: stats.byStatus?.DRAFT || 0, color: '#F59E0B' },
      { status: 'In Factory', count: stats.byStatus?.IN_FACTORY || 0, color: '#60A5FA' },
      { status: 'Completed', count: stats.byStatus?.COMPLETED || 0, color: '#34D399' },
    ];

    // Recent activity from orders (simplified)
    const recentActivity: RecentActivity[] = orders
      .slice(0, 6)
      .map((order: any, index: number) => ({
        id: order.id || String(index),
        type: 'order_created' as const,
        title: `Order ${order.orderNumber}`,
        description: `Status: ${order.status}`,
        timestamp: order.updatedAt || order.createdAt,
      }));

    // Daily trends (placeholder - would need aggregation endpoint)
    const dailyTrends: DailyOrderTrend[] = [];

    return {
      metrics,
      departmentWorkload,
      orderStatusDistribution,
      recentActivity,
      dailyTrends,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    // Re-throw error so React Query can handle it properly
    throw error;
  }
};

/**
 * Fetch dashboard metrics only
 */
export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const data = await fetchDashboardData();
  return data.metrics;
};

/**
 * Fetch department workload data
 */
export const fetchDepartmentWorkload = async (): Promise<DepartmentWorkload[]> => {
  const data = await fetchDashboardData();
  return data.departmentWorkload;
};

/**
 * Fetch order status distribution
 */
export const fetchOrderStatusDistribution = async (): Promise<OrderStatusDistribution[]> => {
  const data = await fetchDashboardData();
  return data.orderStatusDistribution;
};

/**
 * Fetch recent activity
 */
export const fetchRecentActivity = async (_limit: number = 10): Promise<RecentActivity[]> => {
  const data = await fetchDashboardData();
  return data.recentActivity;
};

/**
 * Fetch daily order trends
 */
export const fetchDailyTrends = async (_days: number = 7): Promise<DailyOrderTrend[]> => {
  const data = await fetchDashboardData();
  return data.dailyTrends;
};
