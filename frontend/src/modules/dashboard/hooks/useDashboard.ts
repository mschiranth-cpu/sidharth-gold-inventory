/**
 * ============================================
 * DASHBOARD HOOKS
 * ============================================
 *
 * React Query hooks for fetching dashboard data.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardData,
  fetchDashboardMetrics,
  fetchDepartmentWorkload,
  fetchOrderStatusDistribution,
  fetchRecentActivity,
  fetchDailyTrends,
} from '../../../services/dashboard.service';
import type {
  DashboardData,
  DashboardMetrics,
  DepartmentWorkload,
  OrderStatusDistribution,
  RecentActivity,
  DailyOrderTrend,
} from '../../../types/dashboard.types';

// ============================================
// QUERY KEYS
// ============================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  departmentWorkload: () => [...dashboardKeys.all, 'departmentWorkload'] as const,
  orderStatus: () => [...dashboardKeys.all, 'orderStatus'] as const,
  recentActivity: (limit?: number) => [...dashboardKeys.all, 'recentActivity', limit] as const,
  dailyTrends: (days?: number) => [...dashboardKeys.all, 'dailyTrends', days] as const,
};

// ============================================
// HOOKS
// ============================================

/**
 * Fetch all dashboard data
 */
export const useDashboardData = (options?: { enabled?: boolean }) => {
  return useQuery<DashboardData, Error>({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboardData,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    enabled: options?.enabled !== false,
  });
};

/**
 * Fetch dashboard metrics only
 */
export const useDashboardMetrics = () => {
  return useQuery<DashboardMetrics, Error>({
    queryKey: dashboardKeys.metrics(),
    queryFn: fetchDashboardMetrics,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * Fetch department workload
 */
export const useDepartmentWorkload = () => {
  return useQuery<DepartmentWorkload[], Error>({
    queryKey: dashboardKeys.departmentWorkload(),
    queryFn: fetchDepartmentWorkload,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * Fetch order status distribution
 */
export const useOrderStatusDistribution = () => {
  return useQuery<OrderStatusDistribution[], Error>({
    queryKey: dashboardKeys.orderStatus(),
    queryFn: fetchOrderStatusDistribution,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * Fetch recent activity
 */
export const useRecentActivity = (limit: number = 10) => {
  return useQuery<RecentActivity[], Error>({
    queryKey: dashboardKeys.recentActivity(limit),
    queryFn: () => fetchRecentActivity(limit),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * Fetch daily trends
 */
export const useDailyTrends = (days: number = 7) => {
  return useQuery<DailyOrderTrend[], Error>({
    queryKey: dashboardKeys.dailyTrends(days),
    queryFn: () => fetchDailyTrends(days),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};
