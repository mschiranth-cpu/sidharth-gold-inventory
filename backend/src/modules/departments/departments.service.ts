/**
 * ============================================
 * DEPARTMENT TRACKING SERVICE
 * ============================================
 *
 * Business logic for tracking order progress
 * through factory departments.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { PrismaClient, DepartmentName, DepartmentStatus, OrderStatus } from '@prisma/client';
import { logger } from '../../utils/logger';
import {
  DepartmentError,
  DepartmentErrorCode,
  DepartmentTrackingResponse,
  OrderDepartmentsResponse,
  DepartmentNotification,
  WorkerSummary,
  StartDepartmentRequest,
  CompleteDepartmentRequest,
  AssignWorkerRequest,
  UploadPhotosRequest,
  DEPARTMENT_ORDER,
  DEPARTMENT_DISPLAY_NAMES,
  getDepartmentSequence,
  getPreviousDepartment,
  getNextDepartment,
  isValidDepartmentStatusTransition,
  calculateDurationHours,
  canStartDepartment,
} from './departments.types';
import { createAssignmentNotification } from '../notifications/notifications.service';

const prisma = new PrismaClient();

// ============================================
// NOTIFICATION SERVICE (Simple Implementation)
// ============================================

/**
 * Queue for notifications (in-memory for now, can be replaced with Redis/SQS)
 */
const notificationQueue: DepartmentNotification[] = [];

/**
 * Sends a notification (logs and queues)
 * Creates actual notification records in database
 */
async function sendNotification(notification: DepartmentNotification): Promise<void> {
  // Log the notification
  logger.info('Department notification', {
    type: notification.type,
    orderId: notification.orderId,
    department: notification.departmentName,
    message: notification.message,
    hasAssignedTo: !!notification.assignedTo,
    assignedToId: notification.assignedTo?.id,
  });

  // Add to queue (for debugging/admin)
  notificationQueue.push(notification);

  // Create actual notification in database for worker assignment
  if (notification.type === 'WORKER_ASSIGNED' && notification.assignedTo) {
    try {
      const isUrgent =
        notification.message.includes('URGENT') || notification.message.includes('High priority');

      await createAssignmentNotification(
        notification.assignedTo.id,
        notification.orderId,
        notification.orderNumber,
        isUrgent
      );

      logger.info('✅ Notification created successfully in database', {
        workerId: notification.assignedTo.id,
        orderId: notification.orderId,
      });
    } catch (error) {
      logger.error('Failed to create notification', { error, notification });
      console.error('❌ Failed to create notification:', error);
    }
  } else {
    console.log('⚠️ Skipping notification creation:', {
      type: notification.type,
      hasAssignedTo: !!notification.assignedTo,
    });
  }
}

/**
 * Gets recent notifications (for debugging/admin)
 */
export function getRecentNotifications(limit = 50): DepartmentNotification[] {
  return notificationQueue.slice(-limit);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Transforms a department tracking record to response format
 */
function toDepartmentTrackingResponse(tracking: {
  id: string;
  orderId: string;
  departmentName: DepartmentName;
  sequenceOrder: number;
  status: DepartmentStatus;
  assignedTo: { id: string; name: string; email: string; department: DepartmentName | null } | null;
  goldWeightIn: number | null;
  goldWeightOut: number | null;
  goldLoss: number | null;
  estimatedHours: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  photos: string[];
  issues: string | null;
  createdAt: Date;
  updatedAt: Date;
}): DepartmentTrackingResponse {
  // Calculate duration if started and completed
  let durationHours: number | null = null;
  if (tracking.startedAt && tracking.completedAt) {
    durationHours = calculateDurationHours(tracking.startedAt, tracking.completedAt);
  }

  return {
    id: tracking.id,
    orderId: tracking.orderId,
    departmentName: tracking.departmentName,
    displayName: DEPARTMENT_DISPLAY_NAMES[tracking.departmentName],
    sequenceOrder: tracking.sequenceOrder,
    status: tracking.status,
    assignedTo: tracking.assignedTo
      ? {
          id: tracking.assignedTo.id,
          name: tracking.assignedTo.name,
          email: tracking.assignedTo.email,
          department: tracking.assignedTo.department,
        }
      : null,
    goldWeightIn: tracking.goldWeightIn,
    goldWeightOut: tracking.goldWeightOut,
    goldLoss: tracking.goldLoss,
    estimatedHours: tracking.estimatedHours,
    startedAt: tracking.startedAt,
    completedAt: tracking.completedAt,
    durationHours,
    notes: tracking.notes,
    photos: tracking.photos,
    issues: tracking.issues,
    createdAt: tracking.createdAt,
    updatedAt: tracking.updatedAt,
  };
}

/**
 * Initializes department tracking records for a new order
 */
export async function initializeDepartmentTracking(orderId: string): Promise<void> {
  const trackingRecords = DEPARTMENT_ORDER.map((dept, index) => ({
    orderId,
    departmentName: dept,
    sequenceOrder: index + 1,
    status: 'NOT_STARTED' as DepartmentStatus,
  }));

  await prisma.departmentTracking.createMany({
    data: trackingRecords,
    skipDuplicates: true,
  });

  logger.info('Initialized department tracking', { orderId, departments: DEPARTMENT_ORDER.length });
}

// ============================================
// GET DEPARTMENT STATUSES
// ============================================

/**
 * Gets all department statuses for an order
 */
export async function getOrderDepartments(orderId: string): Promise<OrderDepartmentsResponse> {
  // First verify the order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
    },
  });

  if (!order) {
    throw new DepartmentError(
      DepartmentErrorCode.ORDER_NOT_FOUND,
      `Order with ID ${orderId} not found`,
      404
    );
  }

  // Get all department tracking records
  let departments = await prisma.departmentTracking.findMany({
    where: { orderId },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
    orderBy: { sequenceOrder: 'asc' },
  });

  // If no tracking records exist, initialize them
  if (departments.length === 0) {
    await initializeDepartmentTracking(orderId);
    departments = await prisma.departmentTracking.findMany({
      where: { orderId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
      orderBy: { sequenceOrder: 'asc' },
    });
  }

  // Calculate summary
  const completedDepartments = departments.filter((d) => d.status === 'COMPLETED').length;
  const inProgressDept = departments.find((d) => d.status === 'IN_PROGRESS');

  // Find current department (first non-completed, or last if all completed)
  let currentDepartment: DepartmentName | null = null;
  if (inProgressDept) {
    currentDepartment = inProgressDept.departmentName;
  } else {
    const firstNotStarted = departments.find(
      (d) => d.status === 'NOT_STARTED' || d.status === 'ON_HOLD'
    );
    currentDepartment = firstNotStarted?.departmentName ?? null;
  }

  // Calculate totals
  const totalEstimatedHours =
    departments.reduce((sum, d) => sum + (d.estimatedHours ?? 0), 0) || null;
  const totalActualHours =
    departments
      .filter((d) => d.startedAt && d.completedAt)
      .reduce((sum, d) => sum + calculateDurationHours(d.startedAt!, d.completedAt!), 0) || null;

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    departments: departments.map(toDepartmentTrackingResponse),
    summary: {
      totalDepartments: DEPARTMENT_ORDER.length,
      completedDepartments,
      currentDepartment,
      completionPercentage: Math.round((completedDepartments / DEPARTMENT_ORDER.length) * 100),
      totalEstimatedHours,
      totalActualHours,
    },
  };
}

/**
 * Gets a single department tracking record
 */
export async function getDepartmentTracking(
  orderId: string,
  departmentName: DepartmentName
): Promise<DepartmentTrackingResponse> {
  const tracking = await prisma.departmentTracking.findUnique({
    where: {
      orderId_departmentName: {
        orderId,
        departmentName,
      },
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
  });

  if (!tracking) {
    throw new DepartmentError(
      DepartmentErrorCode.TRACKING_NOT_FOUND,
      `Department tracking for ${departmentName} not found for order ${orderId}`,
      404
    );
  }

  return toDepartmentTrackingResponse(tracking);
}

// ============================================
// START DEPARTMENT
// ============================================

/**
 * Marks a department as started
 */
export async function startDepartment(
  orderId: string,
  departmentName: DepartmentName,
  data: StartDepartmentRequest,
  userId: string
): Promise<DepartmentTrackingResponse> {
  // Verify order exists and is in factory
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, status: true },
  });

  if (!order) {
    throw new DepartmentError(
      DepartmentErrorCode.ORDER_NOT_FOUND,
      `Order with ID ${orderId} not found`,
      404
    );
  }

  if (order.status !== 'IN_FACTORY' && order.status !== 'DRAFT') {
    throw new DepartmentError(
      DepartmentErrorCode.ORDER_NOT_IN_FACTORY,
      'Can only start departments for orders in factory',
      400
    );
  }

  // Get all department statuses to check prerequisites
  const allDepartments = await prisma.departmentTracking.findMany({
    where: { orderId },
    select: { departmentName: true, status: true },
  });

  // Initialize if not exists
  if (allDepartments.length === 0) {
    await initializeDepartmentTracking(orderId);
  }

  // Build status map
  const statusMap = new Map<DepartmentName, DepartmentStatus>();
  allDepartments.forEach((d) => statusMap.set(d.departmentName, d.status));

  // Check if we can start this department
  const { canStart, blockingDepartment } = canStartDepartment(departmentName, statusMap);
  if (!canStart) {
    throw new DepartmentError(
      DepartmentErrorCode.PREVIOUS_DEPARTMENT_NOT_COMPLETE,
      `Cannot start ${departmentName} - ${blockingDepartment} must be completed first`,
      400,
      { blockingDepartment }
    );
  }

  // Get current tracking record
  const currentTracking = await prisma.departmentTracking.findUnique({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
  });

  if (currentTracking?.status === 'IN_PROGRESS') {
    throw new DepartmentError(
      DepartmentErrorCode.ALREADY_STARTED,
      `${departmentName} is already in progress`,
      400
    );
  }

  if (currentTracking?.status === 'COMPLETED') {
    throw new DepartmentError(
      DepartmentErrorCode.ALREADY_COMPLETED,
      `${departmentName} is already completed`,
      400
    );
  }

  // Get user info for notification
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  // Update or create tracking record
  const tracking = await prisma.departmentTracking.upsert({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
    update: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      goldWeightIn: data.goldWeightIn,
      estimatedHours: data.estimatedHours,
      notes: data.notes,
    },
    create: {
      orderId,
      departmentName,
      sequenceOrder: getDepartmentSequence(departmentName),
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      goldWeightIn: data.goldWeightIn,
      estimatedHours: data.estimatedHours,
      notes: data.notes,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
  });

  // Update order status to IN_FACTORY if it's still DRAFT
  if (order.status === 'DRAFT') {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'IN_FACTORY' },
    });
  }

  // Send notification
  await sendNotification({
    type: 'DEPARTMENT_STARTED',
    orderId,
    orderNumber: order.orderNumber,
    departmentName,
    displayName: DEPARTMENT_DISPLAY_NAMES[departmentName],
    message: `${DEPARTMENT_DISPLAY_NAMES[departmentName]} has started for order ${order.orderNumber}`,
    timestamp: new Date(),
    triggeredBy: {
      id: user?.id ?? userId,
      name: user?.name ?? 'Unknown',
    },
  });

  logger.info('Department started', { orderId, departmentName, userId });

  return toDepartmentTrackingResponse(tracking);
}

// ============================================
// COMPLETE DEPARTMENT
// ============================================

/**
 * Marks a department as completed
 */
export async function completeDepartment(
  orderId: string,
  departmentName: DepartmentName,
  data: CompleteDepartmentRequest,
  userId: string
): Promise<DepartmentTrackingResponse> {
  // Verify order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, status: true },
  });

  if (!order) {
    throw new DepartmentError(
      DepartmentErrorCode.ORDER_NOT_FOUND,
      `Order with ID ${orderId} not found`,
      404
    );
  }

  // Get current tracking record
  const currentTracking = await prisma.departmentTracking.findUnique({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
  });

  if (!currentTracking) {
    throw new DepartmentError(
      DepartmentErrorCode.TRACKING_NOT_FOUND,
      `Department tracking for ${departmentName} not found`,
      404
    );
  }

  if (currentTracking.status === 'NOT_STARTED') {
    throw new DepartmentError(
      DepartmentErrorCode.NOT_STARTED,
      `Cannot complete ${departmentName} - it has not been started`,
      400
    );
  }

  if (currentTracking.status === 'COMPLETED') {
    throw new DepartmentError(
      DepartmentErrorCode.ALREADY_COMPLETED,
      `${departmentName} is already completed`,
      400
    );
  }

  // Calculate gold loss if weights provided
  let goldLoss: number | null = null;
  if (currentTracking.goldWeightIn && data.goldWeightOut) {
    goldLoss = Math.round((currentTracking.goldWeightIn - data.goldWeightOut) * 1000) / 1000;
  }

  // Get user info for notification
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  // Update tracking record
  const tracking = await prisma.departmentTracking.update({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      goldWeightOut: data.goldWeightOut,
      goldLoss,
      notes: data.notes ?? currentTracking.notes,
      issues: data.issues,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
  });

  // Check if this was the last department
  const isLastDepartment = getNextDepartment(departmentName) === null;

  // Check if all departments are completed
  if (isLastDepartment) {
    const allDepartments = await prisma.departmentTracking.findMany({
      where: { orderId },
      select: { status: true },
    });

    const allCompleted = allDepartments.every((d) => d.status === 'COMPLETED');
    if (allCompleted) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
      });
      logger.info('All departments completed - order marked as COMPLETED', { orderId });
    }
  }

  // Send notification
  await sendNotification({
    type: 'DEPARTMENT_COMPLETED',
    orderId,
    orderNumber: order.orderNumber,
    departmentName,
    displayName: DEPARTMENT_DISPLAY_NAMES[departmentName],
    message: `${DEPARTMENT_DISPLAY_NAMES[departmentName]} has been completed for order ${order.orderNumber}`,
    timestamp: new Date(),
    triggeredBy: {
      id: user?.id ?? userId,
      name: user?.name ?? 'Unknown',
    },
  });

  logger.info('Department completed', { orderId, departmentName, userId, goldLoss });

  return toDepartmentTrackingResponse(tracking);
}

// ============================================
// ASSIGN WORKER
// ============================================

/**
 * Assigns a worker to a department
 */
export async function assignWorker(
  orderId: string,
  departmentName: DepartmentName,
  data: AssignWorkerRequest,
  assignedByUserId: string
): Promise<DepartmentTrackingResponse> {
  // Verify order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true },
  });

  if (!order) {
    throw new DepartmentError(
      DepartmentErrorCode.ORDER_NOT_FOUND,
      `Order with ID ${orderId} not found`,
      404
    );
  }

  // Verify worker exists and belongs to the right department
  const worker = await prisma.user.findUnique({
    where: { id: data.workerId },
    select: { id: true, name: true, email: true, department: true, isActive: true },
  });

  if (!worker) {
    throw new DepartmentError(
      DepartmentErrorCode.WORKER_NOT_FOUND,
      `Worker with ID ${data.workerId} not found`,
      404
    );
  }

  if (!worker.isActive) {
    throw new DepartmentError(
      DepartmentErrorCode.WORKER_NOT_FOUND,
      'Cannot assign to inactive worker',
      400
    );
  }

  // Optional: Check if worker belongs to the correct department
  // Commenting this out to allow flexibility
  // if (worker.department && worker.department !== departmentName) {
  //   throw new DepartmentError(
  //     DepartmentErrorCode.WORKER_WRONG_DEPARTMENT,
  //     `Worker ${worker.name} belongs to ${worker.department}, not ${departmentName}`,
  //     400
  //   );
  // }

  // Get user info for notification
  const assignedByUser = await prisma.user.findUnique({
    where: { id: assignedByUserId },
    select: { id: true, name: true },
  });

  // Update or create tracking record
  const tracking = await prisma.departmentTracking.upsert({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
    update: {
      assignedToId: data.workerId,
      estimatedHours: data.estimatedHours,
      notes: data.notes,
    },
    create: {
      orderId,
      departmentName,
      sequenceOrder: getDepartmentSequence(departmentName),
      status: 'NOT_STARTED',
      assignedToId: data.workerId,
      estimatedHours: data.estimatedHours,
      notes: data.notes,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
  });

  // Send notification
  await sendNotification({
    type: 'WORKER_ASSIGNED',
    orderId,
    orderNumber: order.orderNumber,
    departmentName,
    displayName: DEPARTMENT_DISPLAY_NAMES[departmentName],
    message: `${worker.name} has been assigned to ${DEPARTMENT_DISPLAY_NAMES[departmentName]} for order ${order.orderNumber}`,
    timestamp: new Date(),
    triggeredBy: {
      id: assignedByUser?.id ?? assignedByUserId,
      name: assignedByUser?.name ?? 'Unknown',
    },
    assignedTo: {
      id: worker.id,
      name: worker.name,
      email: worker.email,
      department: worker.department,
    },
  });

  logger.info('Worker assigned to department', {
    orderId,
    departmentName,
    workerId: data.workerId,
    workerName: worker.name,
  });

  return toDepartmentTrackingResponse(tracking);
}

// ============================================
// UNASSIGN WORKER
// ============================================

/**
 * Unassigns the currently assigned worker from a department
 */
export async function unassignWorker(
  orderId: string,
  departmentName: DepartmentName,
  unassignedByUserId: string
): Promise<DepartmentTrackingResponse> {
  // Verify order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true },
  });

  if (!order) {
    throw new DepartmentError(
      DepartmentErrorCode.ORDER_NOT_FOUND,
      `Order with ID ${orderId} not found`,
      404
    );
  }

  // Get current tracking
  const tracking = await prisma.departmentTracking.findUnique({
    where: {
      orderId_departmentName: {
        orderId,
        departmentName,
      },
    },
    include: {
      order: { select: { orderNumber: true } },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
  });

  if (!tracking) {
    throw new DepartmentError(
      DepartmentErrorCode.TRACKING_NOT_FOUND,
      `Department tracking not found for department ${departmentName}`,
      404
    );
  }

  // Check if worker is assigned
  if (!tracking.assignedToId) {
    throw new DepartmentError(
      DepartmentErrorCode.NOT_STARTED,
      'No worker currently assigned to this department',
      400
    );
  }

  // Don't allow unassigning if work has started
  if (tracking.status === 'IN_PROGRESS') {
    throw new DepartmentError(
      DepartmentErrorCode.INVALID_STATUS_TRANSITION,
      'Cannot unassign worker after work has started',
      400
    );
  }

  // Update tracking to unassign worker
  const updatedTracking = await prisma.departmentTracking.update({
    where: {
      orderId_departmentName: {
        orderId,
        departmentName,
      },
    },
    data: {
      assignedToId: null,
      status: 'PENDING_ASSIGNMENT',
      updatedAt: new Date(),
    },
    include: {
      order: { select: { id: true, orderNumber: true } },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
  });

  logger.info('Worker unassigned from department', {
    orderId,
    departmentName,
    unassignedWorkerId: tracking.assignedToId,
    unassignedByUserId,
  });

  return toDepartmentTrackingResponse(updatedTracking);
}

// ============================================
// UPLOAD PHOTOS
// ============================================

/**
 * Uploads photos for a department
 * In production, this would integrate with S3/cloud storage
 */
export async function uploadDepartmentPhotos(
  orderId: string,
  departmentName: DepartmentName,
  data: UploadPhotosRequest,
  userId: string
): Promise<DepartmentTrackingResponse> {
  // Verify order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true },
  });

  if (!order) {
    throw new DepartmentError(
      DepartmentErrorCode.ORDER_NOT_FOUND,
      `Order with ID ${orderId} not found`,
      404
    );
  }

  // Get current tracking record
  const currentTracking = await prisma.departmentTracking.findUnique({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
  });

  // Combine existing photos with new ones
  const existingPhotos = currentTracking?.photos ?? [];
  const allPhotos = [...existingPhotos, ...data.photos];

  // Update tracking record
  const tracking = await prisma.departmentTracking.upsert({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
    update: {
      photos: allPhotos,
      notes: data.notes
        ? currentTracking?.notes
          ? `${currentTracking.notes}\n${data.notes}`
          : data.notes
        : currentTracking?.notes,
    },
    create: {
      orderId,
      departmentName,
      sequenceOrder: getDepartmentSequence(departmentName),
      status: 'NOT_STARTED',
      photos: data.photos,
      notes: data.notes,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
  });

  logger.info('Photos uploaded to department', {
    orderId,
    departmentName,
    photoCount: data.photos.length,
    totalPhotos: allPhotos.length,
  });

  return toDepartmentTrackingResponse(tracking);
}

// ============================================
// PUT ON HOLD / RESUME
// ============================================

/**
 * Puts a department on hold
 */
export async function putDepartmentOnHold(
  orderId: string,
  departmentName: DepartmentName,
  reason: string,
  userId: string
): Promise<DepartmentTrackingResponse> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true },
  });

  if (!order) {
    throw new DepartmentError(
      DepartmentErrorCode.ORDER_NOT_FOUND,
      `Order with ID ${orderId} not found`,
      404
    );
  }

  const currentTracking = await prisma.departmentTracking.findUnique({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
  });

  if (!currentTracking || currentTracking.status !== 'IN_PROGRESS') {
    throw new DepartmentError(
      DepartmentErrorCode.INVALID_STATUS_TRANSITION,
      'Can only put an in-progress department on hold',
      400
    );
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  const tracking = await prisma.departmentTracking.update({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
    data: {
      status: 'ON_HOLD',
      issues: reason,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
  });

  // Send notification
  await sendNotification({
    type: 'DEPARTMENT_ON_HOLD',
    orderId,
    orderNumber: order.orderNumber,
    departmentName,
    displayName: DEPARTMENT_DISPLAY_NAMES[departmentName],
    message: `${DEPARTMENT_DISPLAY_NAMES[departmentName]} has been put on hold: ${reason}`,
    timestamp: new Date(),
    triggeredBy: {
      id: user?.id ?? userId,
      name: user?.name ?? 'Unknown',
    },
  });

  logger.info('Department put on hold', { orderId, departmentName, reason });

  return toDepartmentTrackingResponse(tracking);
}

/**
 * Resumes a department from on-hold status
 */
export async function resumeDepartment(
  orderId: string,
  departmentName: DepartmentName,
  userId: string
): Promise<DepartmentTrackingResponse> {
  const currentTracking = await prisma.departmentTracking.findUnique({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
  });

  if (!currentTracking || currentTracking.status !== 'ON_HOLD') {
    throw new DepartmentError(
      DepartmentErrorCode.INVALID_STATUS_TRANSITION,
      'Can only resume a department that is on hold',
      400
    );
  }

  const tracking = await prisma.departmentTracking.update({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
    data: {
      status: 'IN_PROGRESS',
      issues: null, // Clear the hold reason
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
  });

  logger.info('Department resumed', { orderId, departmentName });

  return toDepartmentTrackingResponse(tracking);
}

// ============================================
// S3/CLOUD STORAGE INTEGRATION (Placeholder)
// ============================================

/**
 * Generates a pre-signed URL for photo upload to S3
 * This is a placeholder - implement actual S3 integration
 */
export async function getPhotoUploadUrl(
  orderId: string,
  departmentName: DepartmentName,
  filename: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  // TODO: Implement actual S3 pre-signed URL generation
  // For now, return placeholder URLs

  const timestamp = Date.now();
  const key = `orders/${orderId}/departments/${departmentName}/${timestamp}-${filename}`;

  // Placeholder - in production, use AWS SDK
  return {
    uploadUrl: `https://s3.amazonaws.com/gold-factory-uploads/${key}?presigned=true`,
    publicUrl: `https://gold-factory-uploads.s3.amazonaws.com/${key}`,
  };
}

/**
 * Validates that all uploaded photo URLs are accessible
 * This is a placeholder - implement actual validation
 */
export async function validatePhotoUrls(urls: string[]): Promise<boolean> {
  // TODO: Implement actual URL validation
  // Check that URLs are from trusted domains (S3, etc.)

  for (const url of urls) {
    try {
      new URL(url);
    } catch {
      return false;
    }
  }

  return true;
}
