/**
 * ============================================
 * REPORT SERVICE
 * ============================================
 *
 * Service for generating report data using
 * the existing schema models.
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

import { PrismaClient, DepartmentName, DepartmentStatus, OrderStatus } from '@prisma/client';
import type {
  ReportFilters,
  DailyProductionReport,
  DailyProductionData,
  DepartmentEfficiencyReport,
  DepartmentEfficiencyData,
  PendingOrdersReport,
  PendingOrdersByDepartment,
  PendingOrderItem,
  OverdueOrdersReport,
  OverdueOrderItem,
  EscalationLevel,
  WorkerPerformanceReport,
  WorkerPerformanceData,
  ReportSummary,
} from './report.types';

const prisma = new PrismaClient();

// Department names for iteration
const ALL_DEPARTMENTS: DepartmentName[] = [
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

const DEPARTMENT_LABELS: Record<DepartmentName, string> = {
  CAD: 'CAD Design',
  PRINT: '3D Print',
  CASTING: 'Casting',
  FILLING: 'Filling',
  MEENA: 'Meena Work',
  POLISH_1: 'Polish 1',
  SETTING: 'Stone Setting',
  POLISH_2: 'Polish 2',
  ADDITIONAL: 'Additional',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getEscalationLevel(daysOverdue: number): EscalationLevel {
  if (daysOverdue <= 2) return 'WARNING';
  if (daysOverdue <= 5) return 'CRITICAL';
  if (daysOverdue <= 10) return 'SEVERE';
  return 'EMERGENCY';
}

function calculateEfficiencyScore(
  averageTime: number,
  benchmarkTime: number,
  onTimeRate: number
): number {
  // Score based on time efficiency (60%) and on-time delivery (40%)
  const timeScore =
    benchmarkTime > 0
      ? Math.max(0, 100 - ((averageTime - benchmarkTime) / benchmarkTime) * 50)
      : 100;
  const deliveryScore = onTimeRate;
  return Math.round(timeScore * 0.6 + deliveryScore * 0.4);
}

// ============================================
// DAILY PRODUCTION REPORT
// ============================================

export async function getDailyProductionReport(
  filters: ReportFilters
): Promise<DailyProductionReport> {
  const { startDate, endDate, status } = filters;

  // Get orders in date range
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(status && { status: status as OrderStatus }),
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      completedAt: true,
    },
  });

  // Group by date
  const dateMap = new Map<string, DailyProductionData>();

  // Initialize all dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dateMap.set(dateKey, {
      date: dateKey,
      completed: 0,
      started: 0,
      total: 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Count orders
  orders.forEach((order) => {
    const createdDate = order.createdAt.toISOString().split('T')[0];
    if (dateMap.has(createdDate)) {
      const data = dateMap.get(createdDate)!;
      data.started++;
      data.total++;
    }

    if (order.completedAt) {
      const completedDate = order.completedAt.toISOString().split('T')[0];
      if (dateMap.has(completedDate)) {
        const data = dateMap.get(completedDate)!;
        data.completed++;
      }
    }
  });

  const data = Array.from(dateMap.values());
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
  const totalStarted = data.reduce((sum, d) => sum + d.started, 0);

  return {
    data,
    totalCompleted,
    totalStarted,
    averagePerDay: data.length > 0 ? Math.round((totalCompleted / data.length) * 10) / 10 : 0,
    dateRange: { startDate, endDate },
  };
}

// ============================================
// DEPARTMENT EFFICIENCY REPORT
// ============================================

export async function getDepartmentEfficiencyReport(
  filters: ReportFilters
): Promise<DepartmentEfficiencyReport> {
  const { startDate, endDate, departmentId } = filters;

  // Filter departments if specific one requested
  const departmentsToQuery = departmentId
    ? ALL_DEPARTMENTS.filter((d) => d === departmentId)
    : ALL_DEPARTMENTS;

  // Get department tracking data
  const trackingData = await prisma.departmentTracking.findMany({
    where: {
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
      departmentName: {
        in: departmentsToQuery,
      },
    },
  });

  // Calculate efficiency per department
  const departmentStats = new Map<
    DepartmentName,
    {
      totalTime: number;
      completed: number;
      inProgress: number;
      total: number;
      onTime: number;
    }
  >();

  // Initialize department stats
  departmentsToQuery.forEach((dept) => {
    departmentStats.set(dept, {
      totalTime: 0,
      completed: 0,
      inProgress: 0,
      total: 0,
      onTime: 0,
    });
  });

  // Process tracking data
  trackingData.forEach((tracking) => {
    const stats = departmentStats.get(tracking.departmentName);
    if (!stats) return;

    stats.total++;

    if (tracking.status === 'COMPLETED' && tracking.completedAt && tracking.startedAt) {
      const timeInHours =
        (tracking.completedAt.getTime() - tracking.startedAt.getTime()) / (1000 * 60 * 60);
      stats.totalTime += timeInHours;
      stats.completed++;

      // Check if completed within estimated time
      if (tracking.estimatedHours && timeInHours <= tracking.estimatedHours) {
        stats.onTime++;
      } else if (!tracking.estimatedHours) {
        // If no estimate, assume on time
        stats.onTime++;
      }
    } else if (tracking.status === 'IN_PROGRESS') {
      stats.inProgress++;
    }
  });

  // Calculate benchmark (average time across all departments)
  let totalAvgTime = 0;
  let deptCount = 0;
  departmentStats.forEach((stats) => {
    if (stats.completed > 0) {
      totalAvgTime += stats.totalTime / stats.completed;
      deptCount++;
    }
  });
  const benchmarkTime = deptCount > 0 ? totalAvgTime / deptCount : 24;

  // Build report data
  const data: DepartmentEfficiencyData[] = departmentsToQuery.map((dept) => {
    const stats = departmentStats.get(dept)!;
    const avgTime = stats.completed > 0 ? stats.totalTime / stats.completed : 0;
    const onTimeRate = stats.completed > 0 ? (stats.onTime / stats.completed) * 100 : 0;

    return {
      departmentId: dept,
      departmentName: DEPARTMENT_LABELS[dept],
      averageTimeHours: Math.round(avgTime * 10) / 10,
      ordersCompleted: stats.completed,
      ordersInProgress: stats.inProgress,
      totalOrders: stats.total,
      efficiencyScore: calculateEfficiencyScore(avgTime, benchmarkTime, onTimeRate),
    };
  });

  // Sort by efficiency score
  data.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  const overallAverageTime =
    data.length > 0 ? data.reduce((sum, d) => sum + d.averageTimeHours, 0) / data.length : 0;

  return {
    data,
    overallAverageTime: Math.round(overallAverageTime * 10) / 10,
    fastestDepartment: data[0]?.departmentName || 'N/A',
    slowestDepartment: data[data.length - 1]?.departmentName || 'N/A',
    dateRange: { startDate, endDate },
  };
}

// ============================================
// PENDING ORDERS REPORT
// ============================================

export async function getPendingOrdersReport(filters: ReportFilters): Promise<PendingOrdersReport> {
  const { departmentId } = filters;

  // Get orders that are in factory (not draft, not completed)
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'IN_FACTORY',
    },
    include: {
      orderDetails: true,
      departmentTracking: {
        where: {
          status: 'IN_PROGRESS',
          ...(departmentId && { departmentName: departmentId as DepartmentName }),
        },
      },
    },
  });

  // Group by department
  const departmentMap = new Map<string, PendingOrdersByDepartment>();

  pendingOrders.forEach((order) => {
    const currentTracking = order.departmentTracking[0];
    if (!currentTracking) return;

    const deptName = currentTracking.departmentName;
    const deptLabel = DEPARTMENT_LABELS[deptName];

    if (!departmentMap.has(deptName)) {
      departmentMap.set(deptName, {
        departmentId: deptName,
        departmentName: deptLabel,
        orders: [],
        totalOrders: 0,
        totalWeight: 0,
      });
    }

    const deptData = departmentMap.get(deptName)!;
    const totalWeight = order.orderDetails?.goldWeightInitial || 0;
    const daysInDept = currentTracking.startedAt
      ? Math.floor((Date.now() - currentTracking.startedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Map priority int to label
    const priorityLabels: Record<number, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
      0: 'LOW',
      1: 'MEDIUM',
      2: 'HIGH',
      3: 'URGENT',
    };

    const pendingItem: PendingOrderItem = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      dueDate: order.orderDetails?.dueDate || new Date(),
      currentDepartment: deptLabel,
      daysInDepartment: daysInDept,
      priority: priorityLabels[order.priority] || 'LOW',
      totalWeight,
    };

    deptData.orders.push(pendingItem);
    deptData.totalOrders++;
    deptData.totalWeight += totalWeight;
  });

  // Sort orders within each department by due date
  departmentMap.forEach((dept) => {
    dept.orders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  });

  const data = Array.from(departmentMap.values());
  const totalPendingOrders = data.reduce((sum, d) => sum + d.totalOrders, 0);

  // Count critical orders (due within 24 hours)
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const criticalOrders = data.reduce((sum, dept) => {
    return sum + dept.orders.filter((o) => new Date(o.dueDate) <= tomorrow).length;
  }, 0);

  return {
    data,
    totalPendingOrders,
    criticalOrders,
    dateRange: filters,
  };
}

// ============================================
// OVERDUE ORDERS REPORT
// ============================================

export async function getOverdueOrdersReport(filters: ReportFilters): Promise<OverdueOrdersReport> {
  const { departmentId, workerId } = filters;
  const now = new Date();

  // Get orders that are overdue (in factory with past due date)
  const overdueOrders = await prisma.order.findMany({
    where: {
      status: 'IN_FACTORY',
      orderDetails: {
        dueDate: {
          lt: now,
        },
      },
    },
    include: {
      orderDetails: true,
      departmentTracking: {
        where: {
          status: 'IN_PROGRESS',
          ...(departmentId && { departmentName: departmentId as DepartmentName }),
          ...(workerId && { assignedToId: workerId }),
        },
        include: {
          assignedTo: true,
        },
      },
    },
  });

  // Build overdue items
  const data: OverdueOrderItem[] = overdueOrders
    .filter((order) => order.departmentTracking.length > 0 || (!departmentId && !workerId))
    .map((order) => {
      const currentTracking = order.departmentTracking[0];
      const dueDate = order.orderDetails?.dueDate || new Date();
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalWeight = order.orderDetails?.goldWeightInitial || 0;

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        dueDate: dueDate,
        daysOverdue,
        escalationLevel: getEscalationLevel(daysOverdue),
        currentDepartment: currentTracking
          ? DEPARTMENT_LABELS[currentTracking.departmentName]
          : 'Not Assigned',
        assignedWorker: currentTracking?.assignedTo?.name || null,
        estimatedCompletion: null,
        totalWeight,
      };
    });

  // Sort by days overdue (most urgent first)
  data.sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Group by escalation level
  const byEscalation: Record<EscalationLevel, number> = {
    WARNING: 0,
    CRITICAL: 0,
    SEVERE: 0,
    EMERGENCY: 0,
  };
  data.forEach((item) => {
    byEscalation[item.escalationLevel]++;
  });

  return {
    data,
    totalOverdue: data.length,
    byEscalation,
    dateRange: filters,
  };
}

// ============================================
// WORKER PERFORMANCE REPORT
// ============================================

export async function getWorkerPerformanceReport(
  filters: ReportFilters
): Promise<WorkerPerformanceReport> {
  const { startDate, endDate, departmentId, workerId } = filters;

  // Get all workers (department workers)
  const workers = await prisma.user.findMany({
    where: {
      role: 'DEPARTMENT_WORKER',
      isActive: true,
      ...(workerId && { id: workerId }),
      ...(departmentId && { department: departmentId as DepartmentName }),
    },
    select: {
      id: true,
      name: true,
      department: true,
    },
  });

  // Get completed department tracking for each worker
  const trackingData = await prisma.departmentTracking.findMany({
    where: {
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'COMPLETED',
      assignedToId: {
        in: workers.map((w) => w.id),
      },
    },
  });

  // Calculate performance per worker
  const workerStats = new Map<
    string,
    {
      ordersCompleted: number;
      totalTime: number;
      avgTime: number;
      efficiency: number;
    }
  >();

  // Initialize worker stats
  workers.forEach((worker) => {
    workerStats.set(worker.id, {
      ordersCompleted: 0,
      totalTime: 0,
      avgTime: 0,
      efficiency: 0,
    });
  });

  // Process tracking data
  trackingData.forEach((tracking) => {
    if (!tracking.assignedToId) return;

    const stats = workerStats.get(tracking.assignedToId);
    if (!stats) return;

    stats.ordersCompleted++;

    if (tracking.completedAt && tracking.startedAt) {
      const timeInHours =
        (tracking.completedAt.getTime() - tracking.startedAt.getTime()) / (1000 * 60 * 60);
      stats.totalTime += timeInHours;
    }
  });

  // Calculate averages and build report data
  const data: WorkerPerformanceData[] = workers.map((worker) => {
    const stats = workerStats.get(worker.id)!;
    const avgTime = stats.ordersCompleted > 0 ? stats.totalTime / stats.ordersCompleted : 0;

    // Calculate efficiency based on average time (benchmark: 24 hours)
    const efficiency = avgTime > 0 ? Math.min(100, Math.round((24 / avgTime) * 100)) : 0;

    return {
      workerId: worker.id,
      workerName: worker.name,
      department: worker.department ? DEPARTMENT_LABELS[worker.department] : 'Unassigned',
      ordersCompleted: stats.ordersCompleted,
      averageTimeHours: Math.round(avgTime * 10) / 10,
      efficiencyScore: efficiency,
      totalTimeHours: Math.round(stats.totalTime * 10) / 10,
    };
  });

  // Sort by orders completed (most productive first)
  data.sort((a, b) => b.ordersCompleted - a.ordersCompleted);

  const totalOrdersCompleted = data.reduce((sum, d) => sum + d.ordersCompleted, 0);
  const averageEfficiency =
    data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.efficiencyScore, 0) / data.length)
      : 0;

  return {
    data,
    totalOrdersCompleted,
    averageEfficiency,
    topPerformer: data[0]?.workerName || 'N/A',
    dateRange: { startDate, endDate },
  };
}

// ============================================
// REPORT SUMMARY
// ============================================

export async function getReportSummary(): Promise<ReportSummary> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get order counts
  const [totalOrders, ordersInFactory, completedOrders, overdueCount] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'IN_FACTORY' } }),
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    prisma.order.count({
      where: {
        status: 'IN_FACTORY',
        orderDetails: {
          dueDate: { lt: now },
        },
      },
    }),
  ]);

  // Get completed in last 30 days
  const recentlyCompleted = await prisma.order.count({
    where: {
      status: 'COMPLETED',
      completedAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  // Get department stats
  const departmentStats = await prisma.departmentTracking.groupBy({
    by: ['departmentName', 'status'],
    _count: { id: true },
  });

  const departmentCounts: Record<string, { active: number; completed: number }> = {};
  departmentStats.forEach((stat) => {
    if (!departmentCounts[stat.departmentName]) {
      departmentCounts[stat.departmentName] = { active: 0, completed: 0 };
    }
    if (stat.status === 'IN_PROGRESS') {
      departmentCounts[stat.departmentName].active = stat._count.id;
    } else if (stat.status === 'COMPLETED') {
      departmentCounts[stat.departmentName].completed = stat._count.id;
    }
  });

  return {
    totalOrders,
    ordersInFactory,
    completedOrders,
    overdueOrders: overdueCount,
    recentlyCompleted,
    departmentSummary: Object.entries(departmentCounts).map(([dept, counts]) => ({
      department: DEPARTMENT_LABELS[dept as DepartmentName] || dept,
      active: counts.active,
      completed: counts.completed,
    })),
  };
}

// Export all functions
export default {
  getDailyProductionReport,
  getDepartmentEfficiencyReport,
  getPendingOrdersReport,
  getOverdueOrdersReport,
  getWorkerPerformanceReport,
  getReportSummary,
};
