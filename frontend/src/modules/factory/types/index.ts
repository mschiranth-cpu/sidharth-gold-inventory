/**
 * ============================================
 * FACTORY MODULE TYPES
 * ============================================
 *
 * Types for factory statistics, gold tracking, and Kanban board.
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

// ============================================
// FACTORY STATS
// ============================================

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

// ============================================
// GOLD INVENTORY (Orders in Factory)
// ============================================

export interface GoldInventoryItem {
  id: string;
  orderNumber: string;
  customerName: string;
  goldWeight: number;
  currentDepartment: string;
  status: string;
  daysInProduction: number;
  createdAt: string;
}

export interface GoldInventoryFilters {
  departmentId?: string;
  status?: string;
}

// ============================================
// GOLD MOVEMENTS
// ============================================

export interface GoldMovement {
  id: string;
  orderNumber: string;
  department: string;
  goldWeightIn: number | null;
  goldWeightOut: number | null;
  goldLoss: number;
  startedAt: string | null;
  completedAt: string | null;
}

// ============================================
// KANBAN / FACTORY TRACKING TYPES
// ============================================

export interface KanbanDepartment {
  id: string;
  name: string;
  displayName: string;
  order: number;
  color: string;
}

export interface KanbanWorker {
  id: string;
  name: string;
  avatar?: string;
  department: string;
}

export interface KanbanOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  productImage?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueDate: string;
  currentDepartment: string;
  assignedWorker?: KanbanWorker;
  enteredDepartmentAt: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_ASSIGNMENT';
  grossWeight: number;
  purity: string;
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM';
  metalFinish?: string;
  customFinish?: string;
  notes?: string;
  workProgress?: number; // 0-100 percentage of work completion
  history: DepartmentTransition[];
}

export interface DepartmentTransition {
  departmentId: string;
  departmentName: string;
  enteredAt: string;
  exitedAt?: string;
  workerId?: string;
  workerName?: string;
  goldWeightIn?: number;
  goldWeightOut?: number;
  goldLoss?: number;
  notes?: string;
}

export interface KanbanColumn {
  department: KanbanDepartment;
  orders: KanbanOrder[];
  totalOrders: number;
  completedOrders: number;
}

export interface DepartmentStats {
  ordersInProgress: number;
  ordersCompleted: number;
  averageTime: number;
  activeWorkers: number;
}

// ============================================
// KANBAN STATE AND FILTERS
// ============================================

export interface KanbanStateData {
  orders: KanbanOrder[];
  isLoading: boolean;
  error: string | null;
}

// KanbanState is a record mapping department IDs to their orders
export type KanbanState = Record<string, KanbanOrder[]>;

export interface KanbanFilters {
  search?: string;
  departmentId?: string;
  workerId?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status?: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDateRange?: string;
}

// ============================================
// CONSTANTS
// ============================================

export const KANBAN_DEPARTMENTS: KanbanDepartment[] = [
  { id: 'CAD', name: 'CAD', displayName: 'CAD Design', order: 1, color: '#3B82F6' },
  { id: 'PRINT', name: 'PRINT', displayName: '3D Print', order: 2, color: '#8B5CF6' },
  { id: 'CASTING', name: 'CASTING', displayName: 'Casting', order: 3, color: '#EF4444' },
  { id: 'FILLING', name: 'FILLING', displayName: 'Filling', order: 4, color: '#F97316' },
  { id: 'MEENA', name: 'MEENA', displayName: 'Meena Work', order: 5, color: '#EC4899' },
  { id: 'POLISH_1', name: 'POLISH_1', displayName: 'Polish 1', order: 6, color: '#10B981' },
  { id: 'SETTING', name: 'SETTING', displayName: 'Stone Setting', order: 7, color: '#06B6D4' },
  { id: 'POLISH_2', name: 'POLISH_2', displayName: 'Polish 2', order: 8, color: '#14B8A6' },
  {
    id: 'ADDITIONAL',
    name: 'ADDITIONAL',
    displayName: 'Finishing Touch',
    order: 9,
    color: '#6B7280',
  },
];

export const PRIORITY_BG_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100',
  NORMAL: 'bg-blue-100',
  HIGH: 'bg-orange-100',
  URGENT: 'bg-red-100',
};

export const PRIORITY_BORDER_COLORS: Record<string, string> = {
  LOW: 'border-gray-300',
  NORMAL: 'border-blue-400',
  HIGH: 'border-orange-400',
  URGENT: 'border-red-500',
};

export const PRIORITY_TEXT_COLORS: Record<string, string> = {
  LOW: 'text-gray-700',
  NORMAL: 'text-blue-700',
  HIGH: 'text-orange-700',
  URGENT: 'text-red-700',
};

// ============================================
// LEGACY TYPES (for backward compatibility)
// ============================================

export type GoldType =
  | 'RAW_GOLD'
  | 'GOLD_BAR'
  | 'GOLD_COIN'
  | 'JEWELRY'
  | 'SCRAP_GOLD'
  | 'GOLD_DUST';
export type InventoryStatus = 'AVAILABLE' | 'RESERVED' | 'IN_PRODUCTION' | 'SOLD' | 'DAMAGED';

export interface InventoryStats {
  totalItems: number;
  totalWeight: number;
  byStatus: { status: string; _count: number }[];
  byGoldType: { goldType: string; _count: number; _sum: { weightGrams: number } }[];
}

export interface CreateInventoryRequest {
  name: string;
  description?: string;
  goldType: GoldType;
  purity: number;
  weightGrams: number;
  quantity?: number;
  pricePerGram: number;
  departmentId: string;
}

export interface UpdateInventoryRequest {
  name?: string;
  description?: string;
  goldType?: GoldType;
  purity?: number;
  weightGrams?: number;
  quantity?: number;
  pricePerGram?: number;
  departmentId?: string;
  status?: InventoryStatus;
}

export interface InventoryFilters {
  departmentId?: string;
  status?: InventoryStatus;
  goldType?: GoldType;
}
