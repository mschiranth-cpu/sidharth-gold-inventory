/**
 * ============================================
 * FACTORY TYPES
 * ============================================
 *
 * TypeScript types for factory statistics and gold tracking.
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

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

export interface GoldInventoryFilters {
  departmentId?: string;
  status?: string;
}
