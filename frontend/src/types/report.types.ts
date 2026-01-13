/**
 * ============================================
 * REPORT TYPES - FRONTEND
 * ============================================
 *
 * TypeScript interfaces for report data.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

// ============================================
// COMMON TYPES
// ============================================

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface ReportFilters extends DateRangeFilter {
  departmentId?: string;
  workerId?: string;
  status?: string;
}

export type ReportType =
  | 'daily-production'
  | 'department-efficiency'
  | 'pending-orders'
  | 'overdue-orders'
  | 'worker-performance';

// ============================================
// DAILY PRODUCTION REPORT
// ============================================

export interface DailyProductionData {
  date: string;
  completed: number;
  started: number;
  total: number;
}

export interface DailyProductionReport {
  data: DailyProductionData[];
  totalCompleted: number;
  totalStarted: number;
  averagePerDay: number;
  dateRange: DateRangeFilter;
}

// ============================================
// DEPARTMENT EFFICIENCY REPORT
// ============================================

export interface DepartmentEfficiencyData {
  departmentId: string;
  departmentName: string;
  averageTimeHours: number;
  ordersCompleted: number;
  ordersInProgress: number;
  totalOrders: number;
  efficiencyScore: number;
}

export interface DepartmentEfficiencyReport {
  data: DepartmentEfficiencyData[];
  overallAverageTime: number;
  fastestDepartment: string;
  slowestDepartment: string;
  dateRange: DateRangeFilter;
}

// ============================================
// PENDING ORDERS REPORT
// ============================================

export type OrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface PendingOrderItem {
  orderId: string;
  orderNumber: string;
  customerName: string;
  dueDate: string;
  currentDepartment: string;
  daysInDepartment: number;
  priority: OrderPriority;
  totalWeight: number;
}

export interface PendingOrdersByDepartment {
  departmentId: string;
  departmentName: string;
  orders: PendingOrderItem[];
  totalOrders: number;
  totalWeight: number;
}

export interface PendingOrdersReport {
  data: PendingOrdersByDepartment[];
  totalPendingOrders: number;
  criticalOrders: number;
  dateRange: DateRangeFilter;
}

// ============================================
// OVERDUE ORDERS REPORT
// ============================================

export type EscalationLevel = 'WARNING' | 'CRITICAL' | 'SEVERE' | 'EMERGENCY';

export interface OverdueOrderItem {
  orderId: string;
  orderNumber: string;
  customerName: string;
  dueDate: string;
  daysOverdue: number;
  escalationLevel: EscalationLevel;
  currentDepartment: string;
  assignedWorker: string | null;
  estimatedCompletion: string | null;
  totalWeight: number;
}

export interface OverdueOrdersReport {
  data: OverdueOrderItem[];
  totalOverdue: number;
  byEscalation: {
    warning: number;
    critical: number;
    severe: number;
    emergency: number;
  };
  averageDaysOverdue: number;
  dateRange: DateRangeFilter;
}

// ============================================
// WORKER PERFORMANCE REPORT
// ============================================

export interface WorkerPerformanceData {
  workerId: string;
  workerName: string;
  department: string;
  ordersCompleted: number;
  averageTimeHours: number;
  efficiencyScore: number;
  totalTimeHours: number;
}

export interface WorkerPerformanceReport {
  data: WorkerPerformanceData[];
  topPerformer: string;
  averageEfficiency: number;
  totalOrdersCompleted: number;
  dateRange: DateRangeFilter;
}

// ============================================
// SUMMARY REPORT
// ============================================

export interface ReportSummary {
  totalOrders: number;
  ordersInFactory: number;
  completedOrders: number;
  overdueOrders: number;
  recentlyCompleted: number;
  departmentSummary: {
    department: string;
    active: number;
    completed: number;
  }[];
}

// ============================================
// ESCALATION LEVEL CONFIG
// ============================================

export const ESCALATION_CONFIG: Record<
  EscalationLevel,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  WARNING: {
    label: 'Warning',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: 'alert-circle',
  },
  CRITICAL: {
    label: 'Critical',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'alert-triangle',
  },
  SEVERE: {
    label: 'Severe',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'x-circle',
  },
  EMERGENCY: {
    label: 'Emergency',
    color: 'text-red-800',
    bgColor: 'bg-red-200',
    icon: 'flame',
  },
};

export const PRIORITY_CONFIG: Record<
  OrderPriority,
  { label: string; color: string; bgColor: string }
> = {
  LOW: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  HIGH: { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  URGENT: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-100' },
};
