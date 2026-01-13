/**
 * ============================================
 * DASHBOARD TYPES
 * ============================================
 *
 * TypeScript types for dashboard data and components.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

// ============================================
// METRIC TYPES
// ============================================

export interface DashboardMetrics {
  totalOrders: number;
  ordersInProgress: number;
  completedToday: number;
  overdueOrders: number;
  totalGoldInProcess: number; // in grams
  totalSilverInProcess: number; // in grams
  totalPlatinumInProcess: number; // in grams
  pendingSubmissions: number;
}

export interface MetricChange {
  value: number;
  percentage: number;
  isPositive: boolean;
}

export interface MetricCardData {
  title: string;
  value: number | string;
  change?: MetricChange;
  icon: React.ComponentType<{ className?: string }>;
  color: 'gold' | 'blue' | 'green' | 'red' | 'purple';
}

// ============================================
// CHART TYPES
// ============================================

export interface DepartmentWorkload {
  departmentId: string;
  departmentName: string;
  activeItems: number;
  pendingItems: number;
  completedToday: number;
  totalWeight: number; // in grams
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
  color: string;
}

export interface DailyOrderTrend {
  date: string;
  created: number;
  completed: number;
}

// ============================================
// ACTIVITY TYPES
// ============================================

export type ActivityType =
  | 'order_created'
  | 'order_completed'
  | 'department_transfer'
  | 'submission_received'
  | 'weight_recorded'
  | 'alert';

export interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
  };
  metadata?: Record<string, unknown>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface DashboardData {
  metrics: DashboardMetrics;
  departmentWorkload: DepartmentWorkload[];
  orderStatusDistribution: OrderStatusDistribution[];
  recentActivity: RecentActivity[];
  dailyTrends: DailyOrderTrend[];
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}
