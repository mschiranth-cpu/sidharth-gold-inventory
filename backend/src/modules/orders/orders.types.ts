/**
 * ============================================
 * ORDERS TYPES & INTERFACES
 * ============================================
 *
 * TypeScript interfaces for the Orders module.
 * Defines request/response shapes, filters, and DTOs.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { OrderStatus, DepartmentName, DepartmentStatus, StoneType, UserRole } from '@prisma/client';

// ============================================
// RE-EXPORT PRISMA ENUMS
// ============================================

export { OrderStatus, DepartmentName, DepartmentStatus, StoneType };

// ============================================
// ORDER DATA TYPES
// ============================================

/**
 * Stone data for order creation/update
 */
export interface StoneInput {
  stoneType: StoneType;
  stoneName?: string;
  customType?: string; // For "Other" stone type
  weight: number;
  quantity?: number;
  color?: string;
  clarity?: string;
  cut?: string;
  shape?: string;
  customShape?: string; // For "Other" shape
  setting?: string;
  customSetting?: string; // For "Other" setting
  notes?: string;
}

/**
 * Order details input for creation
 */
export interface OrderDetailsInput {
  goldWeightInitial?: number;
  purity: number;
  goldColor?: string;
  metalType?: 'GOLD' | 'SILVER' | 'PLATINUM';
  metalFinish?: string;
  customFinish?: string;
  size?: string;
  quantity?: number;
  productType?: string;
  customProductType?: string;
  dueDate: string | Date;
  additionalDescription?: string;
  specialInstructions?: string;
  referenceImages?: string[];
  // CAD/Design files
  cadFiles?: string[];
  // Hallmark Details
  hallmarkRequired?: boolean;
  huidNumber?: string;
  bisHallmark?: string;
  // Pricing Details
  makingChargeType?: 'PER_GRAM' | 'FLAT_RATE' | 'PERCENTAGE';
  makingChargeValue?: number;
  wastagePercentage?: number;
  laborCharges?: number;
  // Manufacturing Instructions
  meltingInstructions?: string;
  claspType?: string;
  engravingText?: string;
  polishType?: string;
  rhodiumPlating?: boolean;
  // Certification
  certificationRequired?: string;
  // Customer's Old Gold
  usingCustomerGold?: boolean;
  customerGoldWeight?: number;
  customerGoldPurity?: number;
  // Logistics & Classification
  deliveryMethod?: string;
  customerAddress?: string;
  occasion?: string;
  designCategory?: string;
  warrantyPeriod?: string;
  exchangeAllowed?: boolean;
  paymentTerms?: string;
  advancePercentage?: number;
  goldRateLocked?: boolean;
  expectedGoldRate?: number;
  // Price Estimation
  estimatedGoldCost?: number;
  estimatedStoneCost?: number;
  estimatedMakingCharges?: number;
  estimatedOtherCharges?: number;
  estimatedTotalCost?: number;
  // Template & Cloning
  templateName?: string;
  clonedFromOrderId?: string;
}

/**
 * Create order request body
 */
export interface CreateOrderRequest {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  productPhotoUrl?: string;
  priority?: number;
  orderDetails: OrderDetailsInput;
  stones?: StoneInput[];
}

/**
 * Update order request body
 */
export interface UpdateOrderRequest {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  productPhotoUrl?: string;
  status?: OrderStatus;
  priority?: number;
  orderDetails?: Partial<OrderDetailsInput>;
}

/**
 * Update order status request
 */
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Stone data in responses
 */
export interface StoneResponse {
  id: string;
  stoneType: StoneType;
  stoneName: string | null;
  customType: string | null;
  weight: number;
  quantity: number;
  color: string | null;
  clarity: string | null;
  cut: string | null;
  shape: string | null;
  customShape: string | null;
  setting: string | null;
  customSetting: string | null;
  notes: string | null;
}

/**
 * Order details in responses
 */
export interface OrderDetailsResponse {
  id: string;
  goldWeightInitial: number | null;
  purity: number;
  goldColor: string | null;
  metalType: string | null;
  metalFinish: string | null;
  customFinish: string | null;
  size: string | null;
  quantity: number;
  productType: string | null;
  customProductType: string | null;
  dueDate: Date;
  additionalDescription: string | null;
  specialInstructions: string | null;
  referenceImages: string[];
  enteredBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Department tracking in responses
 */
export interface DepartmentTrackingResponse {
  id: string;
  departmentName: DepartmentName;
  sequenceOrder: number;
  status: DepartmentStatus;
  assignedTo: {
    id: string;
    name: string;
  } | null;
  goldWeightIn: number | null;
  goldWeightOut: number | null;
  goldLoss: number | null;
  estimatedHours: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  photos: string[];
  issues: string | null;
}

/**
 * Final submission in responses
 */
export interface FinalSubmissionResponse {
  id: string;
  finalGoldWeight: number;
  finalStoneWeight: number | null;
  finalPurity: number | null;
  numberOfPieces: number;
  totalWeight: number | null;
  qualityGrade: string | null;
  qualityNotes: string | null;
  completionPhotos: string[];
  certificateUrl: string | null;
  submittedBy: {
    id: string;
    name: string;
  };
  submittedAt: Date;
  customerApproved: boolean;
  approvalDate: Date | null;
  approvalNotes: string | null;
}

/**
 * Order creator in responses
 */
export interface OrderCreatorResponse {
  id: string;
  name: string;
  email: string;
}

/**
 * Base order response (for list views)
 * Customer info hidden from factory users
 */
export interface OrderListItemResponse {
  id: string;
  orderNumber: string;
  customerName?: string; // Hidden for factory users
  customerPhone?: string; // Hidden for factory users
  customerEmail?: string; // Hidden for factory users
  productPhotoUrl: string | null;
  status: OrderStatus;
  priority: number;
  createdBy: OrderCreatorResponse;
  createdAt: Date;
  updatedAt: Date;
  // Summary fields
  productType?: string;
  dueDate?: Date;
  currentDepartment?: DepartmentName | null;
  completionPercentage?: number;
  departmentTracking?: DepartmentTrackingResponse[];
}

/**
 * Full order response (for detail views)
 */
export interface OrderDetailResponse
  extends Omit<OrderListItemResponse, 'productType' | 'dueDate' | 'orderDetails'> {
  orderDetails: OrderDetailsResponse | null;
  stones: StoneResponse[];
  departmentTracking: DepartmentTrackingResponse[];
  finalSubmission: FinalSubmissionResponse | null;
  files: any[]; // Array of files from department work and references
}

// ============================================
// QUERY & FILTER TYPES
// ============================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Order filter parameters
 */
export interface OrderFilters {
  // Search
  search?: string; // Search in orderNumber, customerName
  orderNumber?: string; // Exact or partial match

  // Status filters
  status?: OrderStatus | OrderStatus[];

  // Date filters
  createdFrom?: string | Date;
  createdTo?: string | Date;
  dueDateFrom?: string | Date;
  dueDateTo?: string | Date;

  // Department filters
  currentDepartment?: DepartmentName;
  inDepartment?: DepartmentName;

  // Other filters
  priority?: number;
  priorityMin?: number;
  createdById?: string;
  assignedToId?: string; // Filter by assigned worker ID

  // Include deleted
  includeDeleted?: boolean;
}

/**
 * Combined query parameters
 */
export interface OrderQueryParams extends PaginationParams, OrderFilters {}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================
// PHOTO UPLOAD TYPES
// ============================================

/**
 * Photo upload request
 */
export interface PhotoUploadRequest {
  type: 'product' | 'reference' | 'department' | 'completion';
  departmentName?: DepartmentName; // Required if type is 'department'
}

/**
 * Photo upload response
 */
export interface PhotoUploadResponse {
  url: string;
  type: PhotoUploadRequest['type'];
  uploadedAt: Date;
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * Order-specific error codes
 */
export enum OrderErrorCode {
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_ALREADY_EXISTS = 'ORDER_ALREADY_EXISTS',
  ORDER_CANNOT_BE_MODIFIED = 'ORDER_CANNOT_BE_MODIFIED',
  ORDER_CANNOT_BE_DELETED = 'ORDER_CANNOT_BE_DELETED',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  INVALID_ORDER_DATA = 'INVALID_ORDER_DATA',
  PHOTO_UPLOAD_FAILED = 'PHOTO_UPLOAD_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Custom order error class
 */
export class OrderError extends Error {
  constructor(
    public code: OrderErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OrderError';
    Object.setPrototypeOf(this, OrderError.prototype);
  }
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Roles that can see customer information
 */
export const CUSTOMER_VISIBLE_ROLES: UserRole[] = ['ADMIN', 'OFFICE_STAFF'];

/**
 * Valid status transitions
 */
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['IN_FACTORY'],
  IN_FACTORY: ['COMPLETED', 'DRAFT'], // Can revert to draft if needed
  COMPLETED: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Department processing order
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
 * Get the next department in sequence
 */
export function getNextDepartment(current: DepartmentName): DepartmentName | null {
  const currentIndex = DEPARTMENT_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === DEPARTMENT_ORDER.length - 1) {
    return null;
  }
  return DEPARTMENT_ORDER[currentIndex + 1] ?? null;
}
