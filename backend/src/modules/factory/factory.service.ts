/**
 * ============================================
 * FACTORY SERVICE
 * ============================================
 *
 * Service for factory statistics and tracking.
 * Uses existing Order and DepartmentTracking models
 * to provide gold weight and production stats.
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

import { PrismaClient, DepartmentName } from '@prisma/client';
import { ApiError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

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

export interface FactoryStats {
  totalGoldInFactory: number;
  ordersInFactory: number;
  ordersByDepartment: {
    department: string;
    departmentId: string;
    count: number;
    totalWeight: number;
  }[];
  completedToday: number;
  avgProductionTime: number;
}

export interface GoldInventoryItem {
  id: string;
  orderNumber: string;
  customerName: string;
  goldWeight: number;
  currentDepartment: string;
  status: string;
  daysInProduction: number;
  createdAt: Date;
}

export interface GoldMovement {
  id: string;
  orderNumber: string;
  department: string;
  goldWeightIn: number | null;
  goldWeightOut: number | null;
  goldLoss: number;
  startedAt: Date | null;
  completedAt: Date | null;
}

export class FactoryService {
  /**
   * Get gold inventory (orders in factory)
   */
  async getGoldInventory(
    page: number = 1,
    limit: number = 10,
    filters?: { departmentId?: string; status?: string }
  ): Promise<{ items: GoldInventoryItem[]; total: number }> {
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      status: 'IN_FACTORY',
    };

    // If department filter, we need to filter by current department tracking
    let departmentFilter: any = undefined;
    if (filters?.departmentId) {
      departmentFilter = {
        departmentName: filters.departmentId as DepartmentName,
        status: 'IN_PROGRESS',
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        where: whereClause,
        include: {
          orderDetails: true,
          departmentTracking: {
            where: departmentFilter,
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    // Filter out orders that don't match department filter
    const filteredOrders = filters?.departmentId
      ? orders.filter((o) => o.departmentTracking.length > 0)
      : orders;

    const items: GoldInventoryItem[] = filteredOrders.map((order) => {
      const currentTracking = order.departmentTracking[0];
      const daysInProduction = Math.floor(
        (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        goldWeight: order.orderDetails?.goldWeightInitial || 0,
        currentDepartment: currentTracking
          ? DEPARTMENT_LABELS[currentTracking.departmentName]
          : 'Not Started',
        status: order.status,
        daysInProduction,
        createdAt: order.createdAt,
      };
    });

    return { items, total };
  }

  /**
   * Get gold item by order ID
   */
  async getGoldItemById(id: string): Promise<GoldInventoryItem | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderDetails: true,
        departmentTracking: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) return null;

    const currentTracking = order.departmentTracking[0];
    const daysInProduction = Math.floor(
      (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      goldWeight: order.orderDetails?.goldWeightInitial || 0,
      currentDepartment: currentTracking
        ? DEPARTMENT_LABELS[currentTracking.departmentName]
        : 'Not Started',
      status: order.status,
      daysInProduction,
      createdAt: order.createdAt,
    };
  }

  /**
   * Get factory statistics
   */
  async getStats(): Promise<FactoryStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get orders in factory
    const ordersInFactory = await prisma.order.findMany({
      where: { status: 'IN_FACTORY' },
      include: {
        orderDetails: true,
        departmentTracking: {
          where: { status: 'IN_PROGRESS' },
        },
      },
    });

    // Calculate total gold in factory
    const totalGoldInFactory = ordersInFactory.reduce(
      (sum, order) => sum + (order.orderDetails?.goldWeightInitial || 0),
      0
    );

    // Group by department
    const departmentCounts: Record<string, { count: number; weight: number }> = {};

    ordersInFactory.forEach((order) => {
      const tracking = order.departmentTracking[0];
      if (tracking) {
        const dept = tracking.departmentName;
        if (!departmentCounts[dept]) {
          departmentCounts[dept] = { count: 0, weight: 0 };
        }
        departmentCounts[dept].count++;
        departmentCounts[dept].weight += order.orderDetails?.goldWeightInitial || 0;
      }
    });

    const ordersByDepartment = Object.entries(departmentCounts).map(([dept, data]) => ({
      department: DEPARTMENT_LABELS[dept as DepartmentName] || dept,
      departmentId: dept,
      count: data.count,
      totalWeight: Math.round(data.weight * 100) / 100,
    }));

    // Get completed today
    const completedToday = await prisma.order.count({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: todayStart,
        },
      },
    });

    // Calculate average production time (from completed orders)
    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
      take: 100, // Last 100 completed orders
      orderBy: { completedAt: 'desc' },
    });

    let avgProductionTime = 0;
    if (completedOrders.length > 0) {
      const totalTime = completedOrders.reduce((sum, order) => {
        if (order.completedAt) {
          return sum + (order.completedAt.getTime() - order.createdAt.getTime());
        }
        return sum;
      }, 0);
      avgProductionTime =
        Math.round((totalTime / completedOrders.length / (1000 * 60 * 60 * 24)) * 10) / 10; // Days
    }

    return {
      totalGoldInFactory: Math.round(totalGoldInFactory * 100) / 100,
      ordersInFactory: ordersInFactory.length,
      ordersByDepartment,
      completedToday,
      avgProductionTime,
    };
  }

  /**
   * Get gold movements (department tracking history)
   */
  async getGoldMovements(
    page: number = 1,
    limit: number = 20,
    orderId?: string
  ): Promise<{ movements: GoldMovement[]; total: number }> {
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (orderId) {
      whereClause.orderId = orderId;
    }

    const [trackingRecords, total] = await Promise.all([
      prisma.departmentTracking.findMany({
        skip,
        take: limit,
        where: whereClause,
        include: {
          order: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.departmentTracking.count({ where: whereClause }),
    ]);

    const movements: GoldMovement[] = trackingRecords.map((record) => {
      const goldLoss = (record.goldWeightIn || 0) - (record.goldWeightOut || 0);

      return {
        id: record.id,
        orderNumber: record.order.orderNumber,
        department: DEPARTMENT_LABELS[record.departmentName],
        goldWeightIn: record.goldWeightIn,
        goldWeightOut: record.goldWeightOut,
        goldLoss: Math.max(0, goldLoss),
        startedAt: record.startedAt,
        completedAt: record.completedAt,
      };
    });

    return { movements, total };
  }
}

export const factoryService = new FactoryService();
