/**
 * ============================================
 * ASSIGNMENT SERVICE
 * ============================================
 *
 * Smart auto-assignment service for orders.
 * Handles workload balancing and automatic
 * cascading through departments.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { PrismaClient, DepartmentName, DepartmentStatus } from '@prisma/client';
import { logger } from '../../utils/logger';
import activityService, { ActivityAction } from '../../services/activity.service';

const prisma = new PrismaClient();

// Department order for cascading
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

export interface AssignmentResult {
  success: boolean;
  assigned: boolean;
  workerId?: string;
  workerName?: string;
  queued: boolean;
  queuePosition?: number;
  message: string;
}

export interface SendToFactoryResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  departmentsCreated: number;
  firstDepartmentAssignment: AssignmentResult;
}

/**
 * Get the next department in the sequence
 */
export function getNextDepartment(current: DepartmentName): DepartmentName | null {
  const currentIndex = DEPARTMENT_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === DEPARTMENT_ORDER.length - 1) {
    return null;
  }
  return DEPARTMENT_ORDER[currentIndex + 1] ?? null;
}

/**
 * Get available workers for a department, sorted by workload
 */
async function getAvailableWorkers(departmentName: DepartmentName) {
  // Get all active workers in this department
  const workers = await prisma.user.findMany({
    where: {
      department: departmentName,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      departmentAssignments: {
        where: {
          status: 'IN_PROGRESS',
        },
        select: {
          id: true,
        },
      },
    },
  });

  // Calculate workload and sort by lowest first
  const workersWithWorkload = workers.map((worker) => ({
    id: worker.id,
    name: worker.name,
    workload: worker.departmentAssignments.length,
  }));

  workersWithWorkload.sort((a, b) => a.workload - b.workload);

  return workersWithWorkload;
}

/**
 * Auto-assign a department to the best available worker
 * If no workers are available, mark as waiting
 */
export async function autoAssignDepartment(
  orderId: string,
  departmentName: DepartmentName
): Promise<AssignmentResult> {
  try {
    // Get order info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        priority: true,
      },
    });

    if (!order) {
      return {
        success: false,
        assigned: false,
        queued: false,
        message: 'Order not found',
      };
    }

    // Get available workers
    const workers = await getAvailableWorkers(departmentName);

    // Find a worker with zero or low workload (less than 5)
    const availableWorker = workers.find((w) => w.workload === 0) ?? workers[0];

    if (availableWorker && availableWorker.workload < 5) {
      // Assign to this worker
      await prisma.departmentTracking.update({
        where: {
          orderId_departmentName: { orderId, departmentName },
        },
        data: {
          assignedToId: availableWorker.id,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Log worker assignment
      await activityService.logWorkerAssignment(orderId, availableWorker.name, departmentName);

      logger.info('Auto-assigned department to worker', {
        orderId,
        departmentName,
        workerId: availableWorker.id,
        workerName: availableWorker.name,
      });

      return {
        success: true,
        assigned: true,
        workerId: availableWorker.id,
        workerName: availableWorker.name,
        queued: false,
        message: `Assigned to ${availableWorker.name}`,
      };
    }

    // No available workers - leave in NOT_STARTED status
    logger.info('No available workers for department - order waiting', {
      orderId,
      departmentName,
    });

    return {
      success: true,
      assigned: false,
      queued: true,
      queuePosition: 1,
      message: 'Waiting for available worker',
    };
  } catch (error) {
    logger.error('Error in auto-assign', { orderId, departmentName, error });
    return {
      success: false,
      assigned: false,
      queued: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send an order to the factory
 * - Creates all department tracking records
 * - Sets order status to IN_FACTORY
 * - Auto-assigns the first department (CAD)
 */
export async function sendToFactory(orderId: string): Promise<SendToFactoryResult> {
  // Get order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      departmentTracking: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== 'DRAFT') {
    throw new Error(`Order is already ${order.status}`);
  }

  // Create department tracking records if they don't exist
  const existingDepts = new Set(order.departmentTracking.map((dt) => dt.departmentName));
  const newDepts = DEPARTMENT_ORDER.filter((dept) => !existingDepts.has(dept));

  if (newDepts.length > 0) {
    await prisma.departmentTracking.createMany({
      data: newDepts.map((dept) => ({
        orderId,
        departmentName: dept,
        sequenceOrder: DEPARTMENT_ORDER.indexOf(dept) + 1,
        status: 'NOT_STARTED' as DepartmentStatus,
      })),
      skipDuplicates: true,
    });
  }

  // Update order status to IN_FACTORY
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'IN_FACTORY' },
  });

  // Log activity
  await activityService.logStatusChange(orderId, 'DRAFT', 'IN_FACTORY');

  // Auto-assign the first department (CAD)
  const firstDepartment = DEPARTMENT_ORDER[0]!;
  const assignmentResult = await autoAssignDepartment(orderId, firstDepartment);

  logger.info('Order sent to factory', {
    orderId,
    orderNumber: order.orderNumber,
    firstDepartmentAssignment: assignmentResult,
  });

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    departmentsCreated: newDepts.length,
    firstDepartmentAssignment: assignmentResult,
  };
}

/**
 * Process orders waiting in a department when a worker becomes free
 */
export async function processWaitingOrders(
  departmentName: DepartmentName,
  workerId: string
): Promise<AssignmentResult | null> {
  // Get the next order waiting for this department
  const nextWaiting = await prisma.departmentTracking.findFirst({
    where: {
      departmentName,
      status: 'NOT_STARTED',
      assignedToId: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          priority: true,
        },
      },
    },
  });

  if (!nextWaiting) {
    return null;
  }

  // Assign to the freed worker
  await prisma.departmentTracking.update({
    where: { id: nextWaiting.id },
    data: {
      assignedToId: workerId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  // Get worker name
  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    select: { name: true },
  });

  logger.info('Assigned waiting order to freed worker', {
    orderId: nextWaiting.orderId,
    departmentName,
    workerId,
    workerName: worker?.name,
  });

  return {
    success: true,
    assigned: true,
    workerId,
    workerName: worker?.name,
    queued: false,
    message: `Assigned waiting order ${nextWaiting.order.orderNumber} to ${worker?.name}`,
  };
}

/**
 * Complete a department and cascade to the next
 */
export async function completeDepartmentAndCascade(
  orderId: string,
  departmentName: DepartmentName,
  completedByWorkerId: string,
  goldWeightOut?: number,
  notes?: string
): Promise<{
  completed: boolean;
  nextDepartment: DepartmentName | null;
  nextAssignment: AssignmentResult | null;
  queueAssignment: AssignmentResult | null;
  orderCompleted: boolean;
}> {
  // Get current tracking
  const tracking = await prisma.departmentTracking.findUnique({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
  });

  if (!tracking) {
    throw new Error('Department tracking not found');
  }

  // Calculate gold loss if applicable
  let goldLoss: number | null = null;
  if (tracking.goldWeightIn && goldWeightOut) {
    goldLoss = tracking.goldWeightIn - goldWeightOut;
  }

  // Mark department as completed
  await prisma.departmentTracking.update({
    where: { id: tracking.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      goldWeightOut,
      goldLoss,
      notes: notes ?? tracking.notes,
    },
  });

  // Log department completion
  const nextDepartment = getNextDepartment(departmentName);
  await activityService.logDepartmentCompletion(
    orderId,
    departmentName,
    nextDepartment || undefined
  );

  // Process waiting orders - assign next waiting order to the freed worker
  const queueAssignment = await processWaitingOrders(departmentName, completedByWorkerId);

  // Get next department
  let nextAssignment: AssignmentResult | null = null;
  let orderCompleted = false;

  if (nextDepartment) {
    // Ensure next department tracking exists
    await prisma.departmentTracking.upsert({
      where: {
        orderId_departmentName: { orderId, departmentName: nextDepartment },
      },
      create: {
        orderId,
        departmentName: nextDepartment,
        sequenceOrder: DEPARTMENT_ORDER.indexOf(nextDepartment) + 1,
        status: 'NOT_STARTED',
        goldWeightIn: goldWeightOut,
      },
      update: {
        goldWeightIn: goldWeightOut,
      },
    });

    // Auto-assign next department
    nextAssignment = await autoAssignDepartment(orderId, nextDepartment);

    logger.info('Cascaded to next department', {
      orderId,
      fromDepartment: departmentName,
      toDepartment: nextDepartment,
      assignment: nextAssignment,
    });
  } else {
    // Last department - mark order as completed
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    // Log order completion
    await activityService.logStatusChange(orderId, 'IN_FACTORY', 'COMPLETED');

    orderCompleted = true;

    logger.info('Order completed - all departments finished', { orderId });
  }

  return {
    completed: true,
    nextDepartment,
    nextAssignment,
    queueAssignment,
    orderCompleted,
  };
}

/**
 * Bulk send multiple orders to factory
 */
export async function bulkSendToFactory(orderIds: string[]): Promise<{
  success: boolean;
  results: SendToFactoryResult[];
  successCount: number;
  failedCount: number;
}> {
  const results: SendToFactoryResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const orderId of orderIds) {
    try {
      const result = await sendToFactory(orderId);
      results.push(result);
      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      failedCount++;
      results.push({
        success: false,
        orderId,
        orderNumber: '',
        departmentsCreated: 0,
        firstDepartmentAssignment: {
          success: false,
          assigned: false,
          queued: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  return {
    success: failedCount === 0,
    results,
    successCount,
    failedCount,
  };
}

/**
 * Manually reassign a department to a different worker
 */
export async function reassignDepartment(
  orderId: string,
  departmentName: DepartmentName,
  newWorkerId: string,
  reassignedByUserId: string
): Promise<AssignmentResult> {
  // Verify new worker exists
  const worker = await prisma.user.findUnique({
    where: { id: newWorkerId },
    select: {
      id: true,
      name: true,
      department: true,
      isActive: true,
    },
  });

  if (!worker) {
    return {
      success: false,
      assigned: false,
      queued: false,
      message: 'Worker not found',
    };
  }

  if (!worker.isActive) {
    return {
      success: false,
      assigned: false,
      queued: false,
      message: 'Worker is not active',
    };
  }

  // Update assignment
  await prisma.departmentTracking.update({
    where: {
      orderId_departmentName: { orderId, departmentName },
    },
    data: {
      assignedToId: newWorkerId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  // Log worker reassignment
  await activityService.logWorkerAssignment(
    orderId,
    worker.name,
    departmentName,
    reassignedByUserId,
    true // isReassignment
  );

  logger.info('Department manually reassigned', {
    orderId,
    departmentName,
    newWorkerId,
    reassignedByUserId,
  });

  return {
    success: true,
    assigned: true,
    workerId: worker.id,
    workerName: worker.name,
    queued: false,
    message: `Reassigned to ${worker.name}`,
  };
}

/**
 * Manually move an order to a different department
 * This skips the normal cascade workflow
 */
export async function moveToDepartment(
  orderId: string,
  targetDepartment: DepartmentName
): Promise<{
  success: boolean;
  orderId: string;
  fromDepartment: DepartmentName | null;
  toDepartment: DepartmentName;
  assignment: AssignmentResult;
}> {
  // Get order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      departmentTracking: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== 'IN_FACTORY') {
    throw new Error(`Order must be IN_FACTORY status to move departments`);
  }

  // Find current in-progress department
  const currentTracking = order.departmentTracking.find((dt) => dt.status === 'IN_PROGRESS');
  const fromDepartment = currentTracking?.departmentName || null;

  // Complete current department if exists
  if (currentTracking) {
    await prisma.departmentTracking.update({
      where: { id: currentTracking.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Log department completion
    await activityService.logDepartmentCompletion(
      orderId,
      currentTracking.departmentName,
      targetDepartment
    );
  }

  // Ensure target department tracking exists
  await prisma.departmentTracking.upsert({
    where: {
      orderId_departmentName: { orderId, departmentName: targetDepartment },
    },
    create: {
      orderId,
      departmentName: targetDepartment,
      sequenceOrder: DEPARTMENT_ORDER.indexOf(targetDepartment) + 1,
      status: 'NOT_STARTED',
    },
    update: {
      status: 'NOT_STARTED',
      startedAt: null,
      completedAt: null,
      assignedToId: null,
    },
  });

  // Log department move
  if (fromDepartment) {
    await activityService.logDepartmentMove(orderId, fromDepartment, targetDepartment);
  }

  // Auto-assign the target department
  const assignment = await autoAssignDepartment(orderId, targetDepartment);

  logger.info('Order manually moved to department', {
    orderId,
    fromDepartment,
    toDepartment: targetDepartment,
    assignment,
  });

  return {
    success: true,
    orderId,
    fromDepartment,
    toDepartment: targetDepartment,
    assignment,
  };
}
