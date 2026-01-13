/**
 * ============================================
 * FINAL SUBMISSION TYPES
 * ============================================
 * 
 * TypeScript interfaces and Zod schemas for
 * factory-to-office order submissions.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { z } from 'zod';
import { UserRole } from '@prisma/client';

// ============================================
// CONSTANTS
// ============================================

/**
 * Threshold for weight variance alerts (percentage)
 */
export const WEIGHT_VARIANCE_ALERT_THRESHOLD = 5;

/**
 * Quality grade options
 */
export const QUALITY_GRADES = ['A', 'A+', 'B', 'B+', 'C', 'D'] as const;

/**
 * Roles that can submit orders from factory
 */
export const SUBMISSION_ROLES: UserRole[] = [
  'ADMIN',
  'FACTORY_MANAGER',
];

/**
 * Roles that receive submission notifications
 */
export const NOTIFICATION_RECIPIENT_ROLES: UserRole[] = [
  'ADMIN',
  'OFFICE_STAFF',
];

// ============================================
// ERROR HANDLING
// ============================================

export enum SubmissionErrorCode {
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_ALREADY_SUBMITTED = 'ORDER_ALREADY_SUBMITTED',
  SUBMISSION_NOT_FOUND = 'SUBMISSION_NOT_FOUND',
  DEPARTMENTS_INCOMPLETE = 'DEPARTMENTS_INCOMPLETE',
  INVALID_WEIGHT = 'INVALID_WEIGHT',
  HIGH_VARIANCE = 'HIGH_VARIANCE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ORDER_NOT_IN_FACTORY = 'ORDER_NOT_IN_FACTORY',
}

export class SubmissionError extends Error {
  constructor(
    public code: SubmissionErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SubmissionError';
  }
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

/**
 * Create submission request validation
 */
export const createSubmissionSchema = z.object({
  // Final weights
  finalGoldWeight: z
    .number()
    .positive('Final gold weight must be positive')
    .max(10000, 'Final gold weight seems too high'),
  
  finalStoneWeight: z
    .number()
    .min(0, 'Stone weight cannot be negative')
    .default(0),
  
  finalPurity: z
    .number()
    .min(1, 'Purity must be at least 1 karat')
    .max(24, 'Purity cannot exceed 24 karats'),
  
  // Piece info
  numberOfPieces: z
    .number()
    .int()
    .positive()
    .default(1),
  
  totalWeight: z
    .number()
    .positive()
    .optional(),
  
  // Quality check
  qualityGrade: z
    .enum(QUALITY_GRADES)
    .optional(),
  
  qualityNotes: z
    .string()
    .max(2000, 'Quality notes too long')
    .optional(),
  
  // Photos
  completionPhotos: z
    .array(z.string().url('Invalid photo URL'))
    .min(1, 'At least one completion photo is required')
    .max(20, 'Maximum 20 photos allowed'),
  
  certificateUrl: z
    .string()
    .url('Invalid certificate URL')
    .optional(),
  
  // Optional: Acknowledge high variance
  acknowledgeVariance: z
    .boolean()
    .optional(),
});

/**
 * List submissions query parameters
 */
export const submissionQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  
  // Sorting
  sortBy: z.enum(['submittedAt', 'orderNumber', 'finalGoldWeight', 'qualityGrade']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Filters
  submittedFrom: z.string().datetime().optional(),
  submittedTo: z.string().datetime().optional(),
  submittedById: z.string().uuid().optional(),
  qualityGrade: z.enum(QUALITY_GRADES).optional(),
  hasHighVariance: z.coerce.boolean().optional(),
  customerApproved: z.coerce.boolean().optional(),
  
  // Search
  search: z.string().max(100).optional(),
});

/**
 * Customer approval request
 */
export const customerApprovalSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(1000).optional(),
});

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateSubmissionRequest {
  finalGoldWeight: number;
  finalStoneWeight: number;
  finalPurity: number;
  numberOfPieces?: number;
  totalWeight?: number;
  qualityGrade?: typeof QUALITY_GRADES[number];
  qualityNotes?: string;
  completionPhotos: string[];
  certificateUrl?: string;
  acknowledgeVariance?: boolean;
}

export interface SubmissionQueryParams {
  page: number;
  limit: number;
  sortBy: 'submittedAt' | 'orderNumber' | 'finalGoldWeight' | 'qualityGrade';
  sortOrder: 'asc' | 'desc';
  submittedFrom?: string;
  submittedTo?: string;
  submittedById?: string;
  qualityGrade?: typeof QUALITY_GRADES[number];
  hasHighVariance?: boolean;
  customerApproved?: boolean;
  search?: string;
}

export interface CustomerApprovalRequest {
  approved: boolean;
  notes?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Weight variance details
 */
export interface WeightVariance {
  initialWeight: number;
  finalWeight: number;
  difference: number;
  percentageVariance: number;
  isHighVariance: boolean;
  alertThreshold: number;
}

/**
 * Submitter info
 */
export interface SubmitterInfo {
  id: string;
  name: string;
  email: string;
}

/**
 * Order summary for submission
 */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  productType: string | null;
  dueDate: Date | null;
}

/**
 * Submission list item response
 */
export interface SubmissionListItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  productType: string | null;
  finalGoldWeight: number;
  finalStoneWeight: number;
  numberOfPieces: number;
  qualityGrade: string | null;
  submittedBy: SubmitterInfo;
  submittedAt: Date;
  customerApproved: boolean;
  weightVariance: WeightVariance;
  photoCount: number;
}

/**
 * Submission detail response
 */
export interface SubmissionDetailResponse {
  id: string;
  
  // Order info
  order: OrderSummary;
  
  // Final weights
  finalGoldWeight: number;
  finalStoneWeight: number;
  finalPurity: number;
  
  // Piece info
  numberOfPieces: number;
  totalWeight: number | null;
  
  // Quality
  qualityGrade: string | null;
  qualityNotes: string | null;
  
  // Photos
  completionPhotos: string[];
  certificateUrl: string | null;
  
  // Submission info
  submittedBy: SubmitterInfo;
  submittedAt: Date;
  
  // Weight variance
  weightVariance: WeightVariance;
  
  // Customer approval
  customerApproved: boolean;
  approvalDate: Date | null;
  approvalNotes: string | null;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated submission response
 */
export interface PaginatedSubmissionsResponse {
  data: SubmissionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalSubmissions: number;
    highVarianceCount: number;
    pendingApprovalCount: number;
    averageVariance: number;
  };
}

/**
 * Submission notification
 */
export interface SubmissionNotification {
  type: 'ORDER_SUBMITTED' | 'HIGH_VARIANCE_ALERT' | 'APPROVAL_REQUESTED';
  orderId: string;
  orderNumber: string;
  message: string;
  timestamp: Date;
  submittedBy: SubmitterInfo;
  weightVariance?: WeightVariance;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculates weight variance between initial and final gold weight
 */
export function calculateWeightVariance(
  initialWeight: number,
  finalWeight: number
): WeightVariance {
  const difference = finalWeight - initialWeight;
  const percentageVariance = initialWeight > 0 
    ? Math.abs((difference / initialWeight) * 100)
    : 0;
  
  return {
    initialWeight,
    finalWeight,
    difference: Math.round(difference * 1000) / 1000, // Round to 3 decimals
    percentageVariance: Math.round(percentageVariance * 100) / 100, // Round to 2 decimals
    isHighVariance: percentageVariance > WEIGHT_VARIANCE_ALERT_THRESHOLD,
    alertThreshold: WEIGHT_VARIANCE_ALERT_THRESHOLD,
  };
}

/**
 * Checks if user can submit orders
 */
export function canSubmitOrder(role: UserRole): boolean {
  return SUBMISSION_ROLES.includes(role);
}

/**
 * Checks if user can view customer info in submissions
 */
export function canViewCustomerInfo(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'OFFICE_STAFF';
}
