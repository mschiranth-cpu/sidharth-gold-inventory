/**
 * Dashboard types — mirrors backend/src/modules/dashboard/dashboard.types.ts.
 */

export type DashboardRange = 'today' | '7d' | '30d' | 'custom';

export interface DashboardKpis {
  totalOrders: number;
  ordersInProgress: number;
  completedInRange: number;
  overdueOrders: number;
  dueTodayCount: number;
  avgProductionDays: number;
  efficiencyPct: number;
  pendingSubmissions: number;
}

export interface MetalsInProcess {
  gold: number;
  silver: number;
  platinum: number;
}

export interface InventoryLowStockItem {
  type: 'METAL' | 'DIAMOND' | 'STONE_PACKET';
  id: string;
  label: string;
  quantity: number;
  threshold: number;
}

export interface InventorySnapshot {
  metalStockGrams: number;
  diamondPieces: number;
  stonePackets: number;
  realStonePieces: number;
  lowStockItems: InventoryLowStockItem[];
}

export interface VendorOutstandingRow {
  vendorId: string;
  uniqueCode: string;
  name: string;
  totalBillable: number;
  totalPaid: number;
  outstanding: number;
  openCount: number;
}

export interface AttendanceTodayBreakdown {
  present: number;
  absent: number;
  onLeave: number;
  totalEmployees: number;
}

export interface SubmissionQueueItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  submittedAt: string;
  submittedById: string;
  submittedByName: string;
  finalGoldWeight: number;
}

export interface OrdersTrendBucket {
  date: string;
  created: number;
  completed: number;
}

export interface DepartmentWorkloadRow {
  departmentName: string;
  activeItems: number;
  pendingItems: number;
  completedToday: number;
  totalWeight: number;
}

export interface OrderStatusSlice {
  status: string;
  count: number;
  color: string;
}

export interface RecentActivityItem {
  id: string;
  orderId: string;
  orderNumber: string | null;
  action: string;
  title: string;
  description: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}

export interface NotificationPeekItem {
  id: string;
  type: string;
  priority: string | null;
  title: string;
  message: string;
  orderId: string | null;
  orderNumber: string | null;
  createdAt: string;
}

export interface MarketRatesPayload {
  gold24k: number | null;
  gold22k: number | null;
  gold18k: number | null;
  silver: number | null;
  platinum: number | null;
  palladium: number | null;
  fetchedAt: string | null;
  healthy: boolean;
  ageMs: number;
}

export interface DashboardOverview {
  kpis: DashboardKpis;
  metalsInProcess: MetalsInProcess;
  inventorySnapshot: InventorySnapshot;
  vendorOutstanding: VendorOutstandingRow[];
  attendanceToday: AttendanceTodayBreakdown;
  submissionsQueue: SubmissionQueueItem[];
  ordersTrend: OrdersTrendBucket[];
  departmentWorkload: DepartmentWorkloadRow[];
  orderStatusDistribution: OrderStatusSlice[];
  recentActivity: RecentActivityItem[];
  notifications: NotificationPeekItem[];
  marketRates: MarketRatesPayload;
  meta: {
    generatedAt: string;
    range: DashboardRange;
    rangeFrom: string;
    rangeTo: string;
    cacheTtlSeconds: number;
    cached: boolean;
  };
}

export interface WorkerDashboardOverview {
  myMetrics: {
    total: number;
    inProgress: number;
    completedToday: number;
    overdue: number;
  };
  myAssignments: Array<{
    id: string;
    orderNumber: string;
    productType: string | null;
    status: string;
    dueDate: string | null;
    productPhotoUrl: string | null;
  }>;
  myActivity: RecentActivityItem[];
  myDepartmentRollup: {
    department: string | null;
    activeItems: number;
    completedToday: number;
  };
  myAttendanceToday: {
    status: 'PRESENT' | 'CHECKED_OUT' | 'ABSENT' | 'ON_LEAVE';
    checkInTime: string | null;
    checkOutTime: string | null;
  };
  marketRates: MarketRatesPayload;
  meta: {
    generatedAt: string;
    cacheTtlSeconds: number;
    cached: boolean;
  };
}
