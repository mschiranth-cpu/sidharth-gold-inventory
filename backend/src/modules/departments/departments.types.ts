/**
 * ============================================
 * DEPARTMENT TRACKING TYPES
 * ============================================
 *
 * TypeScript interfaces and types for department
 * tracking within the order workflow.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { z } from 'zod';
import { DepartmentName, DepartmentStatus, UserRole } from '@prisma/client';

// ============================================
// CONSTANTS
// ============================================

/**
 * Department processing order (sequential flow)
 */
export const DEPARTMENT_ORDER: DepartmentName[] = [
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

/**
 * Department display names for UI
 */
export const DEPARTMENT_DISPLAY_NAMES: Record<DepartmentName, string> = {
  CAD: 'CAD Design',
  PRINT: '3D Printing',
  CASTING: 'Casting',
  FILLING: 'Filling',
  MEENA: 'Meena Work',
  POLISH_1: 'First Polish',
  SETTING: 'Stone Setting',
  POLISH_2: 'Final Polish',
  ADDITIONAL: 'Additional Work',
};

/**
 * Roles that can manage department tracking
 */
export const DEPARTMENT_MANAGEMENT_ROLES: UserRole[] = ['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'];

// ============================================
// ERROR HANDLING
// ============================================

export enum DepartmentErrorCode {
  TRACKING_NOT_FOUND = 'TRACKING_NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  INVALID_DEPARTMENT = 'INVALID_DEPARTMENT',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  PREVIOUS_DEPARTMENT_NOT_COMPLETE = 'PREVIOUS_DEPARTMENT_NOT_COMPLETE',
  ALREADY_STARTED = 'ALREADY_STARTED',
  ALREADY_COMPLETED = 'ALREADY_COMPLETED',
  NOT_STARTED = 'NOT_STARTED',
  WORKER_NOT_FOUND = 'WORKER_NOT_FOUND',
  WORKER_WRONG_DEPARTMENT = 'WORKER_WRONG_DEPARTMENT',
  PHOTO_UPLOAD_FAILED = 'PHOTO_UPLOAD_FAILED',
  ORDER_NOT_IN_FACTORY = 'ORDER_NOT_IN_FACTORY',
}

export class DepartmentError extends Error {
  constructor(
    public code: DepartmentErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DepartmentError';
  }
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

/**
 * Department name validation
 */
export const departmentNameSchema = z.nativeEnum(DepartmentName);

/**
 * Start department request
 */
export const startDepartmentSchema = z.object({
  goldWeightIn: z.number().positive().optional(),
  estimatedHours: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Complete department request
 */
export const completeDepartmentSchema = z.object({
  goldWeightOut: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  issues: z.string().max(2000).optional(),
});

/**
 * Assign worker request
 */
export const assignWorkerSchema = z.object({
  workerId: z.string().uuid('Invalid worker ID'),
  estimatedHours: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Upload photos request
 */
export const uploadPhotosSchema = z.object({
  photos: z.array(z.string().url('Invalid photo URL')).min(1).max(10),
  notes: z.string().max(500).optional(),
});

/**
 * Update department notes
 */
export const updateNotesSchema = z.object({
  notes: z.string().max(2000).optional(),
  issues: z.string().max(2000).optional(),
});

/**
 * Put department on hold
 */
export const putOnHoldSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

// ============================================
// REQUEST TYPES
// ============================================

export interface StartDepartmentRequest {
  goldWeightIn?: number;
  estimatedHours?: number;
  notes?: string;
}

export interface CompleteDepartmentRequest {
  goldWeightOut?: number;
  notes?: string;
  issues?: string;
}

export interface AssignWorkerRequest {
  workerId: string;
  estimatedHours?: number;
  notes?: string;
}

export interface UploadPhotosRequest {
  photos: string[];
  notes?: string;
}

export interface PutOnHoldRequest {
  reason: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Worker summary for department tracking
 */
export interface WorkerSummary {
  id: string;
  name: string;
  email: string;
  department: DepartmentName | null;
}

/**
 * Single department tracking entry
 */
export interface DepartmentTrackingResponse {
  id: string;
  orderId: string;
  departmentName: DepartmentName;
  displayName: string;
  sequenceOrder: number;
  status: DepartmentStatus;

  // Assignment
  assignedTo: WorkerSummary | null;

  // Gold tracking
  goldWeightIn: number | null;
  goldWeightOut: number | null;
  goldLoss: number | null;

  // Timing
  estimatedHours: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  durationHours: number | null;

  // Notes and photos
  notes: string | null;
  photos: string[];
  issues: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * All departments for an order
 */
export interface OrderDepartmentsResponse {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  departments: DepartmentTrackingResponse[];
  summary: {
    totalDepartments: number;
    completedDepartments: number;
    currentDepartment: DepartmentName | null;
    completionPercentage: number;
    totalEstimatedHours: number | null;
    totalActualHours: number | null;
  };
}

/**
 * Department status change notification
 */
export interface DepartmentNotification {
  type: 'DEPARTMENT_STARTED' | 'DEPARTMENT_COMPLETED' | 'DEPARTMENT_ON_HOLD' | 'WORKER_ASSIGNED';
  orderId: string;
  orderNumber: string;
  departmentName: DepartmentName;
  displayName: string;
  message: string;
  timestamp: Date;
  triggeredBy: {
    id: string;
    name: string;
  };
  assignedTo?: WorkerSummary;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets the sequence order for a department
 */
export function getDepartmentSequence(dept: DepartmentName): number {
  return DEPARTMENT_ORDER.indexOf(dept) + 1;
}

/**
 * Gets the previous department in the sequence
 */
export function getPreviousDepartment(dept: DepartmentName): DepartmentName | null {
  const index = DEPARTMENT_ORDER.indexOf(dept);
  if (index <= 0) return null;
  return DEPARTMENT_ORDER[index - 1] ?? null;
}

/**
 * Gets the next department in the sequence
 */
export function getNextDepartment(dept: DepartmentName): DepartmentName | null {
  const index = DEPARTMENT_ORDER.indexOf(dept);
  if (index === -1 || index >= DEPARTMENT_ORDER.length - 1) return null;
  return DEPARTMENT_ORDER[index + 1] ?? null;
}

/**
 * Checks if a department status transition is valid
 */
export function isValidDepartmentStatusTransition(
  current: DepartmentStatus,
  next: DepartmentStatus
): boolean {
  const validTransitions: Record<DepartmentStatus, DepartmentStatus[]> = {
    PENDING_ASSIGNMENT: ['NOT_STARTED'], // Once worker is assigned, it moves to NOT_STARTED
    NOT_STARTED: ['IN_PROGRESS'],
    IN_PROGRESS: ['COMPLETED', 'ON_HOLD'],
    ON_HOLD: ['IN_PROGRESS'],
    COMPLETED: [], // Cannot change once completed
  };

  return validTransitions[current]?.includes(next) ?? false;
}

/**
 * Calculates duration between two dates in hours
 */
export function calculateDurationHours(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
}

/**
 * Checks if all previous departments are completed
 */
export function canStartDepartment(
  targetDept: DepartmentName,
  departmentStatuses: Map<DepartmentName, DepartmentStatus>
): { canStart: boolean; blockingDepartment?: DepartmentName } {
  const targetIndex = DEPARTMENT_ORDER.indexOf(targetDept);

  // First department can always start
  if (targetIndex === 0) {
    return { canStart: true };
  }

  // Check all previous departments
  for (let i = 0; i < targetIndex; i++) {
    const prevDept = DEPARTMENT_ORDER[i];
    if (prevDept) {
      const status = departmentStatuses.get(prevDept);
      if (status !== 'COMPLETED') {
        return { canStart: false, blockingDepartment: prevDept };
      }
    }
  }

  return { canStart: true };
}
