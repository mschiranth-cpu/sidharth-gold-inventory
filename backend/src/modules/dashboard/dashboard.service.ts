/**
 * ============================================
 * DASHBOARD SERVICE — Aggregator
 * ============================================
 *
 * Builds the unified `/api/dashboard/overview` payload by composing
 * existing services (orders, factory, vendors, attendance, submissions,
 * notifications, market-rates, inventory, activity) plus a few raw
 * Prisma aggregates. In-memory cache (30 s) + single-flight per key.
 */

import { PrismaClient, DepartmentName, OrderStatus } from '@prisma/client';
import { logger } from '../../utils/logger';
import { getOrderStats } from '../orders/orders.service';
import { factoryService } from '../factory/factory.service';
import { getMetalStockSummary } from '../metal-inventory/metal.service';
import { getNotifications } from '../notifications/notifications.service';
import { getAllAttendance } from '../attendance/attendance.service';
import { ambicaaScraper } from '../../services/ambicaaScraper';
import { getGlobalMetalRates } from '../../services/globalMetalRates';
import activityService from '../../services/activity.service';
import type {
  DashboardOverview,
  DashboardRange,
  WorkerDashboardOverview,
  MarketRatesPayload,
  InventoryLowStockItem,
  OrdersTrendBucket,
  DepartmentWorkloadRow,
  OrderStatusSlice,
  RecentActivityItem,
  NotificationPeekItem,
  SubmissionQueueItem,
  VendorOutstandingRow,
  AttendanceToday,
} from './dashboard.types';

const prisma = new PrismaClient();

// ============================================
// CONSTANTS
// ============================================

const CACHE_TTL_MS = 30_000;
const LOW_STOCK_DIAMOND_LOT_THRESHOLD = 5;
const LOW_STOCK_STONE_PACKET_THRESHOLD = 5;
const LOW_STOCK_METAL_GRAMS_THRESHOLD = 20;

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

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#D4B373',
  IN_FACTORY: '#C9A55C',
  COMPLETED: '#5FA37A',
};

// ============================================
// CACHE + SINGLE-FLIGHT
// ============================================

interface CacheEntry<T> {
  exp: number;
  data: T;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

async function withCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<{ data: T; cached: boolean }> {
  const now = Date.now();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.exp > now) {
    return { data: hit.data, cached: true };
  }
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) {
    return { data: await existing, cached: false };
  }
  const promise = (async () => {
    try {
      const data = await loader();
      cache.set(key, { exp: Date.now() + ttlMs, data });
      return data;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return { data: await promise, cached: false };
}

// ============================================
// RANGE HELPERS
// ============================================

export interface RangeWindow {
  range: DashboardRange;
  from: Date;
  to: Date;
}

export function resolveRange(
  range: DashboardRange | undefined,
  fromStr?: string,
  toStr?: string
): RangeWindow {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  if (range === 'custom') {
    const from = fromStr ? new Date(fromStr) : todayStart;
    const to = toStr ? new Date(toStr) : todayEnd;
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new Error('Invalid custom date range');
    }
    if (from > to) {
      throw new Error('`from` must be before `to`');
    }
    return { range: 'custom', from, to };
  }

  if (range === '7d') {
    const from = new Date(todayStart);
    from.setDate(from.getDate() - 6);
    return { range: '7d', from, to: todayEnd };
  }
  if (range === '30d') {
    const from = new Date(todayStart);
    from.setDate(from.getDate() - 29);
    return { range: '30d', from, to: todayEnd };
  }
  return { range: 'today', from: todayStart, to: todayEnd };
}

// ============================================
// MARKET RATES
// ============================================

async function loadMarketRates(): Promise<MarketRatesPayload> {
  // Always pull global spot in parallel — it's the only source for
  // platinum/palladium (Ambicaa Bangalore retail covers gold + silver only).
  const globalPromise = getGlobalMetalRates().catch((err) => {
    logger.warn('Global metal rates fallback failed', { err: String(err) });
    return null;
  });

  // Primary: Bangalore retail (Ambicaa scraper).
  try {
    await ambicaaScraper.start();
  } catch (err) {
    logger.warn('Ambicaa scraper start failed', { err });
  }
  const { data, healthy, ageMs } = ambicaaScraper.getLatest();
  const global = await globalPromise;

  // If Bangalore is healthy AND has gold24k, use it for gold+silver and
  // borrow platinum/palladium from global spot.
  if (healthy && data?.perGram.gold24k != null) {
    return {
      gold24k: data.perGram.gold24k,
      gold22k: data.perGram.gold22k,
      gold18k: data.perGram.gold18k,
      silver: data.perGram.silver,
      platinum: global?.healthy ? global.platinum : null,
      palladium: global?.healthy ? global.palladium : null,
      fetchedAt: data.fetchedAt,
      healthy: true,
      ageMs,
    };
  }

  // Fallback: global spot rates (gold-api.com + USD/INR FX), same source the
  // frontend's LiveMetalRatesCard uses in "Global" mode. Keeps the dashboard
  // aligned with what users see on the Receive Metal page.
  if (global?.healthy) {
    return {
      gold24k: global.gold24k,
      gold22k: global.gold22k,
      gold18k: global.gold18k,
      silver: global.silver,
      platinum: global.platinum,
      palladium: global.palladium,
      fetchedAt: global.fetchedAt,
      healthy: true,
      ageMs: global.ageMs,
    };
  }

  // Last resort: whatever we had (likely all nulls).
  return {
    gold24k: data?.perGram.gold24k ?? null,
    gold22k: data?.perGram.gold22k ?? null,
    gold18k: data?.perGram.gold18k ?? null,
    silver: data?.perGram.silver ?? null,
    platinum: null,
    palladium: null,
    fetchedAt: data?.fetchedAt ?? null,
    healthy,
    ageMs,
  };
}

// ============================================
// SUB-LOADERS
// ============================================

async function loadOrdersTrend(from: Date, to: Date): Promise<OrdersTrendBucket[]> {
  const [created, completed] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      where: { completedAt: { gte: from, lte: to } },
      select: { completedAt: true },
    }),
  ]);

  const buckets = new Map<string, { created: number; completed: number }>();
  const day = 24 * 60 * 60 * 1000;
  for (let t = from.getTime(); t <= to.getTime(); t += day) {
    const d = new Date(t);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { created: 0, completed: 0 });
  }
  created.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (b) b.created += 1;
  });
  completed.forEach((o) => {
    if (!o.completedAt) return;
    const key = o.completedAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (b) b.completed += 1;
  });
  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
}

async function loadDepartmentWorkload(): Promise<DepartmentWorkloadRow[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const grouped = await prisma.departmentTracking.groupBy({
    by: ['departmentName', 'status'],
    _count: { _all: true },
  });

  const completedTodayGrouped = await prisma.departmentTracking.groupBy({
    by: ['departmentName'],
    where: { status: 'COMPLETED', completedAt: { gte: todayStart } },
    _count: { _all: true },
  });

  const weights = await prisma.departmentTracking.findMany({
    where: { status: { in: ['IN_PROGRESS', 'NOT_STARTED', 'PENDING_ASSIGNMENT'] } },
    select: { departmentName: true, goldWeightIn: true },
  });

  const rows = new Map<DepartmentName, DepartmentWorkloadRow>();
  (Object.keys(DEPARTMENT_LABELS) as DepartmentName[]).forEach((d) => {
    rows.set(d, {
      departmentName: DEPARTMENT_LABELS[d],
      activeItems: 0,
      pendingItems: 0,
      completedToday: 0,
      totalWeight: 0,
    });
  });

  grouped.forEach((g) => {
    const r = rows.get(g.departmentName);
    if (!r) return;
    if (g.status === 'IN_PROGRESS') r.activeItems += g._count._all;
    if (g.status === 'NOT_STARTED' || g.status === 'PENDING_ASSIGNMENT') r.pendingItems += g._count._all;
  });

  completedTodayGrouped.forEach((g) => {
    const r = rows.get(g.departmentName);
    if (r) r.completedToday = g._count._all;
  });

  weights.forEach((w) => {
    const r = rows.get(w.departmentName);
    if (r) r.totalWeight += w.goldWeightIn ?? 0;
  });

  return Array.from(rows.values()).map((r) => ({
    ...r,
    totalWeight: Math.round(r.totalWeight * 100) / 100,
  }));
}

async function loadStatusDistribution(): Promise<OrderStatusSlice[]> {
  const grouped = await prisma.order.groupBy({
    by: ['status'],
    _count: { status: true },
  });
  return grouped.map((g) => ({
    status: g.status,
    count: g._count.status,
    color: STATUS_COLORS[g.status] || '#9CA3AF',
  }));
}

async function loadInventorySnapshot() {
  const [metalSummary, diamondPieces, realStonePieces, stonePackets, lowMetal, lowDiamondLots, lowStonePackets] =
    await Promise.all([
      getMetalStockSummary(),
      prisma.diamond.count(),
      prisma.realStone.count(),
      prisma.stonePacket.count(),
      prisma.metalStock.findMany({
        where: { pureWeight: { gt: 0, lte: LOW_STOCK_METAL_GRAMS_THRESHOLD } },
        select: { id: true, metalType: true, purity: true, pureWeight: true },
        orderBy: { pureWeight: 'asc' },
        take: 5,
      }),
      prisma.diamondLot.findMany({
        where: { totalPieces: { gt: 0, lte: LOW_STOCK_DIAMOND_LOT_THRESHOLD } },
        select: { id: true, lotNumber: true, totalPieces: true },
        orderBy: { totalPieces: 'asc' },
        take: 5,
      }),
      prisma.stonePacket.findMany({
        where: { currentPieces: { gt: 0, lte: LOW_STOCK_STONE_PACKET_THRESHOLD } },
        select: { id: true, packetNumber: true, currentPieces: true },
        orderBy: { currentPieces: 'asc' },
        take: 5,
      }),
    ]);

  const metalStockGrams =
    Math.round(metalSummary.reduce((s, m) => s + (m.totalPureWeight || 0), 0) * 100) / 100;

  const lowStockItems: InventoryLowStockItem[] = [
    ...lowMetal.map((m) => ({
      type: 'METAL' as const,
      id: m.id,
      label: `${m.metalType} ${m.purity}`,
      quantity: Math.round(m.pureWeight * 100) / 100,
      threshold: LOW_STOCK_METAL_GRAMS_THRESHOLD,
    })),
    ...lowDiamondLots.map((d) => ({
      type: 'DIAMOND' as const,
      id: d.id,
      label: d.lotNumber,
      quantity: d.totalPieces,
      threshold: LOW_STOCK_DIAMOND_LOT_THRESHOLD,
    })),
    ...lowStonePackets.map((s) => ({
      type: 'STONE_PACKET' as const,
      id: s.id,
      label: s.packetNumber,
      quantity: s.currentPieces ?? 0,
      threshold: LOW_STOCK_STONE_PACKET_THRESHOLD,
    })),
  ];

  return {
    metalStockGrams,
    diamondPieces,
    stonePackets,
    realStonePieces,
    lowStockItems,
  };
}

async function loadVendorOutstanding(): Promise<VendorOutstandingRow[]> {
  return prisma.$queryRaw<VendorOutstandingRow[]>`
    SELECT v.id AS "vendorId", v.name, v.unique_code AS "uniqueCode",
      COALESCE(SUM(CASE WHEN mt.is_billable=true THEN mt.total_value ELSE 0 END), 0)::float AS "totalBillable",
      COALESCE(SUM(CASE WHEN mt.is_billable=true THEN COALESCE(mt.amount_paid,0) ELSE 0 END), 0)::float AS "totalPaid",
      COALESCE(SUM(CASE WHEN mt.is_billable=true THEN COALESCE(mt.total_value,0) - COALESCE(mt.amount_paid,0) ELSE 0 END), 0)::float AS "outstanding",
      COUNT(CASE WHEN mt.is_billable=true AND mt.payment_status IN ('HALF','PENDING') THEN 1 END)::int AS "openCount"
    FROM vendors v
    LEFT JOIN metal_transactions mt
      ON mt.vendor_id = v.id AND mt.transaction_type = 'PURCHASE'
    GROUP BY v.id, v.name, v.unique_code
    HAVING COALESCE(SUM(CASE WHEN mt.is_billable=true THEN COALESCE(mt.total_value,0) - COALESCE(mt.amount_paid,0) ELSE 0 END), 0) > 0
    ORDER BY "outstanding" DESC, v.name ASC
    LIMIT 5
  `;
}

async function loadAttendanceToday(): Promise<AttendanceToday> {
  const todayDateOnly = new Date();
  todayDateOnly.setHours(0, 0, 0, 0);

  const [records, totalEmployees, activeLeaves] = await Promise.all([
    getAllAttendance(todayDateOnly),
    prisma.user.count({ where: { isActive: true, role: { not: 'CLIENT' } } }),
    prisma.leave.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: todayDateOnly },
        endDate: { gte: todayDateOnly },
      },
    }),
  ]);

  let present = 0;
  records.forEach((r) => {
    if (r.status === 'PRESENT' || r.status === 'CHECKED_OUT' || r.checkInTime) present += 1;
  });
  const absent = Math.max(totalEmployees - present - activeLeaves, 0);

  return {
    present,
    absent,
    onLeave: activeLeaves,
    totalEmployees,
  };
}

async function loadSubmissionsQueue(): Promise<{ items: SubmissionQueueItem[]; pendingCount: number }> {
  const [submissions, pendingCount] = await Promise.all([
    prisma.finalSubmission.findMany({
      where: { customerApproved: false },
      orderBy: { submittedAt: 'asc' },
      take: 5,
      include: {
        submittedBy: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true, customerName: true } },
      },
    }),
    prisma.finalSubmission.count({ where: { customerApproved: false } }),
  ]);
  const items = submissions.map((s) => ({
    id: s.id,
    orderId: s.order.id,
    orderNumber: s.order.orderNumber,
    customerName: s.order.customerName,
    submittedAt: s.submittedAt.toISOString(),
    submittedById: s.submittedBy.id,
    submittedByName: s.submittedBy.name,
    finalGoldWeight: s.finalGoldWeight,
  }));
  return { items, pendingCount };
}

function mapActivities(rows: any[]): RecentActivityItem[] {
  return rows.map((a) => ({
    id: a.id,
    orderId: a.orderId,
    orderNumber: a.order?.orderNumber ?? null,
    action: a.action,
    title: a.title,
    description: a.description ?? null,
    userId: a.userId ?? null,
    userName: a.user?.name ?? null,
    createdAt: (a.createdAt as Date).toISOString(),
  }));
}

async function loadRecentActivity(): Promise<RecentActivityItem[]> {
  const rows = await activityService.getRecentActivities(10);
  return mapActivities(rows);
}

async function loadNotifications(userId: string): Promise<NotificationPeekItem[]> {
  const { notifications } = await getNotifications({ userId, isRead: false, limit: 5, offset: 0 });
  return notifications.map((n: any) => ({
    id: n.id,
    type: n.type,
    priority: n.priority ?? null,
    title: n.title,
    message: n.message,
    orderId: n.orderId ?? null,
    orderNumber: n.order?.orderNumber ?? null,
    createdAt: (n.createdAt as Date).toISOString(),
  }));
}

// ============================================
// ADMIN OVERVIEW
// ============================================

async function buildOverview(window: RangeWindow, userId: string): Promise<DashboardOverview> {
  const [
    orderStats,
    factoryStats,
    completedInRange,
    ordersTrend,
    departmentWorkload,
    statusDistribution,
    inventorySnapshot,
    vendorOutstanding,
    attendanceToday,
    submissionsQueue,
    recentActivity,
    notifications,
    marketRates,
  ] = await Promise.all([
    getOrderStats(),
    factoryService.getStats(),
    prisma.order.count({
      where: { status: OrderStatus.COMPLETED, completedAt: { gte: window.from, lte: window.to } },
    }),
    loadOrdersTrend(window.from, window.to),
    loadDepartmentWorkload(),
    loadStatusDistribution(),
    loadInventorySnapshot(),
    loadVendorOutstanding(),
    loadAttendanceToday(),
    loadSubmissionsQueue(),
    loadRecentActivity(),
    loadNotifications(userId),
    loadMarketRates(),
  ]);

  const efficiencyPct =
    orderStats.total > 0
      ? Math.round(((orderStats.total - orderStats.overdueCount) / orderStats.total) * 1000) / 10
      : 0;

  return {
    kpis: {
      totalOrders: orderStats.total,
      ordersInProgress: orderStats.byStatus[OrderStatus.IN_FACTORY] ?? 0,
      completedInRange,
      overdueOrders: orderStats.overdueCount,
      dueTodayCount: orderStats.dueTodayCount,
      avgProductionDays: factoryStats.avgProductionTime,
      efficiencyPct,
      pendingSubmissions: submissionsQueue.pendingCount,
    },
    metalsInProcess: {
      gold: orderStats.totalGoldInProcess,
      silver: orderStats.totalSilverInProcess,
      platinum: orderStats.totalPlatinumInProcess,
    },
    inventorySnapshot,
    vendorOutstanding,
    attendanceToday,
    submissionsQueue: submissionsQueue.items,
    ordersTrend,
    departmentWorkload,
    orderStatusDistribution: statusDistribution,
    recentActivity,
    notifications,
    marketRates,
    meta: {
      generatedAt: new Date().toISOString(),
      range: window.range,
      rangeFrom: window.from.toISOString(),
      rangeTo: window.to.toISOString(),
      cacheTtlSeconds: CACHE_TTL_MS / 1000,
      cached: false,
    },
  };
}

export async function getDashboardOverview(
  range: DashboardRange | undefined,
  fromStr: string | undefined,
  toStr: string | undefined,
  userId: string
): Promise<DashboardOverview> {
  const window = resolveRange(range, fromStr, toStr);
  const isCustom = window.range === 'custom';
  // Per-user only for notifications; cache the rest separately would over-complicate.
  const cacheKey = `overview:${userId}:${window.range}:${window.from.toISOString()}:${window.to.toISOString()}`;
  if (isCustom) {
    // Don't cache custom ranges to keep memory bounded.
    const data = await buildOverview(window, userId);
    return { ...data, meta: { ...data.meta, cached: false } };
  }
  const { data, cached } = await withCache(cacheKey, CACHE_TTL_MS, () => buildOverview(window, userId));
  return { ...data, meta: { ...data.meta, cached } };
}

// ============================================
// WORKER OVERVIEW
// ============================================

async function buildWorkerOverview(userId: string): Promise<WorkerDashboardOverview> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dateOnly = new Date(todayStart);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { department: true },
  });

  const [trackings, todayAttendance, todayLeave, marketRates, activitiesRaw] = await Promise.all([
    prisma.departmentTracking.findMany({
      where: { assignedToId: userId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            productPhotoUrl: true,
            orderDetails: { select: { productType: true, dueDate: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    prisma.attendance.findUnique({
      where: { userId_date: { userId, date: dateOnly } },
    }),
    prisma.leave.findFirst({
      where: {
        userId,
        status: 'APPROVED',
        startDate: { lte: dateOnly },
        endDate: { gte: dateOnly },
      },
    }),
    loadMarketRates(),
    activityService.getRecentActivities(5, userId),
  ]);

  const myAssignments = trackings
    .filter((t) => t.status !== 'COMPLETED')
    .slice(0, 5)
    .map((t) => ({
      id: t.order.id,
      orderNumber: t.order.orderNumber,
      productType: t.order.orderDetails?.productType ?? null,
      status: t.status,
      dueDate: t.order.orderDetails?.dueDate?.toISOString() ?? null,
      productPhotoUrl: t.order.productPhotoUrl,
    }));

  const total = trackings.length;
  const inProgress = trackings.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedToday = trackings.filter(
    (t) => t.status === 'COMPLETED' && t.completedAt && t.completedAt >= todayStart
  ).length;
  const now = new Date();
  const overdue = trackings.filter(
    (t) =>
      t.status !== 'COMPLETED' &&
      t.order.orderDetails?.dueDate &&
      t.order.orderDetails.dueDate < now
  ).length;

  let attendanceStatus: WorkerDashboardOverview['myAttendanceToday']['status'] = 'ABSENT';
  if (todayLeave) attendanceStatus = 'ON_LEAVE';
  else if (todayAttendance?.checkOutTime) attendanceStatus = 'CHECKED_OUT';
  else if (todayAttendance?.checkInTime) attendanceStatus = 'PRESENT';

  return {
    myMetrics: { total, inProgress, completedToday, overdue },
    myAssignments,
    myActivity: mapActivities(activitiesRaw),
    myDepartmentRollup: {
      department: user?.department ? DEPARTMENT_LABELS[user.department] : null,
      activeItems: inProgress,
      completedToday,
    },
    myAttendanceToday: {
      status: attendanceStatus,
      checkInTime: todayAttendance?.checkInTime?.toISOString() ?? null,
      checkOutTime: todayAttendance?.checkOutTime?.toISOString() ?? null,
    },
    marketRates,
    meta: {
      generatedAt: new Date().toISOString(),
      cacheTtlSeconds: CACHE_TTL_MS / 1000,
      cached: false,
    },
  };
}

export async function getWorkerOverview(userId: string): Promise<WorkerDashboardOverview> {
  const cacheKey = `worker-overview:${userId}`;
  const { data, cached } = await withCache(cacheKey, CACHE_TTL_MS, () => buildWorkerOverview(userId));
  return { ...data, meta: { ...data.meta, cached } };
}
