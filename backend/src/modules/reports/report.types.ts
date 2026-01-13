/**
 * ============================================
 * REPORT TYPES
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
  startDate: Date;
  endDate: Date;
}

export interface ReportFilters extends DateRangeFilter {
  departmentId?: string;
  workerId?: string;
  status?: string;
}

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
  efficiencyScore: number; // 0-100
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

export interface PendingOrderItem {
  orderId: string;
  orderNumber: string;
  customerName: string;
  dueDate: Date;
  currentDepartment: string;
  daysInDepartment: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
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
  criticalOrders: number; // Due within 24 hours
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
  dueDate: Date;
  daysOverdue: number;
  escalationLevel: EscalationLevel;
  currentDepartment: string;
  assignedWorker: string | null;
  estimatedCompletion: Date | null;
  totalWeight: number;
}

export interface OverdueOrdersReport {
  data: OverdueOrderItem[];
  totalOverdue: number;
  byEscalation: Record<EscalationLevel, number>;
  dateRange: ReportFilters;
}

// ============================================
// WORKER PERFORMANCE REPORT
// ============================================

export interface WorkerPerformanceData {
  workerId: string;
  workerName: string;
  department: string;
  ordersCompleted: number;
  averageTimeHours: number; // hours
  efficiencyScore: number; // 0-100
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
