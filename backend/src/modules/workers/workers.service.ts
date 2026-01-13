/**
 * ============================================
 * WORKERS SERVICE
 * ============================================
 *
 * Service layer for worker-specific business logic
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { prisma } from '../../config/database';
import { DepartmentName, DepartmentStatus, UserRole } from '@prisma/client';
import { createAssignmentNotification } from '../notifications/notifications.service';
import { activityService, ActivityAction } from '../../services/activity.service';

// Department order for cascading (same as assignment.service.ts)
const DEPARTMENT_ORDER: DepartmentName[] = [
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

// Human-readable department labels
const DEPARTMENT_LABELS: Record<DepartmentName, string> = {
  CAD: 'CAD Design',
  PRINT: '3D Print',
  CASTING: 'Casting',
  FILLING: 'Filling',
  MEENA: 'Meena Work',
  POLISH_1: 'Polish 1',
  SETTING: 'Stone Setting',
  POLISH_2: 'Polish 2',
  ADDITIONAL: 'Finishing Touch',
};

interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  uploadedAt: string;
}

interface UploadedPhoto {
  id: string;
  name: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  category: string;
  uploadedAt: string;
}

interface WorkProgressData {
  formData: Record<string, any>;
  uploadedFiles: UploadedFile[] | string[];
  uploadedPhotos: UploadedPhoto[] | string[];
}

/**
 * Get count of pending assignments for a worker
 * Counts orders with status NOT_STARTED or IN_PROGRESS assigned to the worker
 *
 * @param userId - Worker's user ID
 * @returns Count of pending assignments
 */
export const getPendingAssignmentsCount = async (userId: string): Promise<number> => {
  const count = await prisma.departmentTracking.count({
    where: {
      assignedToId: userId,
      status: {
        in: [DepartmentStatus.NOT_STARTED, DepartmentStatus.IN_PROGRESS],
      },
    },
  });

  return count;
};

/**
 * Get work data for a specific order
 *
 * @param orderId - Order ID
 * @param userId - Worker's user ID
 * @returns Order details with work data
 */
export const getWorkData = async (orderId: string, userId: string) => {
  // Get department tracking with order details
  const tracking = await prisma.departmentTracking.findFirst({
    where: {
      orderId,
      assignedToId: userId,
    },
    include: {
      order: {
        include: {
          orderDetails: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!tracking) {
    throw new Error('Order not found or not assigned to you');
  }

  // Get existing work data if exists
  const workData = await prisma.departmentWorkData.findUnique({
    where: {
      departmentTrackingId: tracking.id,
    },
  });

  return {
    order: tracking.order,
    departmentName: tracking.departmentName,
    tracking: {
      id: tracking.id,
      status: tracking.status,
      startedAt: tracking.startedAt,
      completedAt: tracking.completedAt,
    },
    workData: workData || null,
  };
};

/**
 * Start work on an order
 *
 * @param orderId - Order ID
 * @param userId - Worker's user ID
 * @returns Updated tracking and work data
 */
export const startWork = async (orderId: string, userId: string) => {
  // Get department tracking
  const tracking = await prisma.departmentTracking.findFirst({
    where: {
      orderId,
      assignedToId: userId,
    },
  });

  if (!tracking) {
    throw new Error('Order not found or not assigned to you');
  }

  if (tracking.status === DepartmentStatus.COMPLETED) {
    throw new Error('This work has already been completed');
  }

  // Update tracking status to IN_PROGRESS if not already
  const updatedTracking = await prisma.departmentTracking.update({
    where: {
      id: tracking.id,
    },
    data: {
      status: DepartmentStatus.IN_PROGRESS,
      startedAt: tracking.startedAt || new Date(),
    },
  });

  // Create or update work data record
  const workData = await prisma.departmentWorkData.upsert({
    where: {
      departmentTrackingId: tracking.id,
    },
    create: {
      departmentTrackingId: tracking.id,
      formData: {},
      uploadedFiles: [],
      uploadedPhotos: [],
      workStartedAt: new Date(),
      isDraft: true,
    },
    update: {
      workStartedAt: new Date(),
    },
  });

  return {
    tracking: updatedTracking,
    workData,
  };
};

/**
 * Save work progress (draft)
 *
 * @param orderId - Order ID
 * @param userId - Worker's user ID
 * @param data - Work progress data
 * @returns Updated work data
 */
export const saveWorkProgress = async (orderId: string, userId: string, data: WorkProgressData) => {
  // Get department tracking
  const tracking = await prisma.departmentTracking.findFirst({
    where: {
      orderId,
      assignedToId: userId,
    },
  });

  if (!tracking) {
    throw new Error('Order not found or not assigned to you');
  }

  // Update or create work data
  const workData = await prisma.departmentWorkData.upsert({
    where: {
      departmentTrackingId: tracking.id,
    },
    create: {
      departmentTrackingId: tracking.id,
      formData: (data.formData || {}) as any,
      uploadedFiles: (data.uploadedFiles || []) as any,
      uploadedPhotos: (data.uploadedPhotos || []) as any,
      workStartedAt: new Date(),
      lastSavedAt: new Date(),
      isDraft: true,
    },
    update: {
      formData: (data.formData || {}) as any,
      uploadedFiles: (data.uploadedFiles || []) as any,
      uploadedPhotos: (data.uploadedPhotos || []) as any,
      lastSavedAt: new Date(),
      isDraft: true,
    },
  });

  // Update tracking status to IN_PROGRESS if not already
  if (tracking.status === DepartmentStatus.NOT_STARTED) {
    await prisma.departmentTracking.update({
      where: {
        id: tracking.id,
      },
      data: {
        status: DepartmentStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });
  }

  return workData;
};

/**
 * Complete and submit work
 *
 * @param orderId - Order ID
 * @param userId - Worker's user ID
 * @param data - Final work data
 * @returns Completed work data
 */
export const completeWork = async (orderId: string, userId: string, data: WorkProgressData) => {
  // Get department tracking with order details
  const tracking = await prisma.departmentTracking.findFirst({
    where: {
      orderId,
      assignedToId: userId,
    },
    include: {
      order: {
        include: {
          departmentTracking: {
            orderBy: {
              sequenceOrder: 'asc',
            },
          },
          orderDetails: true, // Include order details for final submission
        },
      },
    },
  });

  if (!tracking) {
    throw new Error('Order not found or not assigned to you');
  }

  const now = new Date();

  // Calculate time spent
  const startedAt = tracking.startedAt || now;
  const timeSpentHours = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);

  // Update work data
  const workData = await prisma.departmentWorkData.upsert({
    where: {
      departmentTrackingId: tracking.id,
    },
    create: {
      departmentTrackingId: tracking.id,
      formData: (data.formData || {}) as any,
      uploadedFiles: (data.uploadedFiles || []) as any,
      uploadedPhotos: (data.uploadedPhotos || []) as any,
      workStartedAt: startedAt,
      workCompletedAt: now,
      timeSpent: timeSpentHours,
      lastSavedAt: now,
      isDraft: false,
      isComplete: true,
    },
    update: {
      formData: (data.formData || {}) as any,
      uploadedFiles: (data.uploadedFiles || []) as any,
      uploadedPhotos: (data.uploadedPhotos || []) as any,
      workCompletedAt: now,
      timeSpent: timeSpentHours,
      lastSavedAt: now,
      isDraft: false,
      isComplete: true,
    },
  });

  // Update tracking status to COMPLETED
  await prisma.departmentTracking.update({
    where: {
      id: tracking.id,
    },
    data: {
      status: DepartmentStatus.COMPLETED,
      completedAt: now,
    },
  });

  // Log department completion activity
  const deptLabel =
    DEPARTMENT_LABELS[tracking.departmentName as DepartmentName] || tracking.departmentName;
  await activityService.logActivity({
    orderId: tracking.orderId,
    action: ActivityAction.DEPT_COMPLETED,
    title: `${deptLabel} completed`,
    description: `Department work completed by worker. Time spent: ${timeSpentHours.toFixed(
      2
    )} hours`,
    userId: userId,
    metadata: {
      departmentName: tracking.departmentName,
      departmentLabel: deptLabel,
      timeSpentHours: timeSpentHours,
      workDataId: workData.id,
    },
  });

  // Log file uploads if any
  const allFiles = [...(data.uploadedFiles || []), ...(data.uploadedPhotos || [])];
  if (allFiles.length > 0) {
    await activityService.logActivity({
      orderId: tracking.orderId,
      action: ActivityAction.FILE_UPLOADED,
      title: `${allFiles.length} file(s) uploaded`,
      description: `Files uploaded for ${deptLabel}: ${allFiles.length} file(s)`,
      userId: userId,
      metadata: {
        departmentName: tracking.departmentName,
        fileCount: allFiles.length,
        files: allFiles,
      },
    });
  }

  // Auto-cascade to next department
  // First, check if next department tracking exists
  let nextDepartment = tracking.order.departmentTracking.find(
    (dt: any) => dt.sequenceOrder === tracking.sequenceOrder + 1
  );

  // If next department tracking doesn't exist, create it
  if (!nextDepartment) {
    // Get the current department's index in the order
    const currentDeptIndex = DEPARTMENT_ORDER.indexOf(tracking.departmentName as DepartmentName);

    if (currentDeptIndex !== -1 && currentDeptIndex < DEPARTMENT_ORDER.length - 1) {
      const nextDeptName = DEPARTMENT_ORDER[currentDeptIndex + 1];

      if (nextDeptName) {
        // Create the next department tracking
        nextDepartment = await prisma.departmentTracking.create({
          data: {
            orderId: tracking.orderId,
            departmentName: nextDeptName,
            sequenceOrder: tracking.sequenceOrder + 1,
            status: DepartmentStatus.PENDING_ASSIGNMENT,
          },
        });
      }
    } else if (currentDeptIndex === DEPARTMENT_ORDER.length - 1) {
      // This is the LAST department (ADDITIONAL/Finishing Touch)
      // Mark the order as COMPLETED and create FinalSubmission
      console.log('✅ All departments completed! Marking order as COMPLETED');

      // Get order details for final submission
      const orderDetails = tracking.order.orderDetails;
      const initialGoldWeight = orderDetails?.goldWeightInitial || 0;

      // Create FinalSubmission record
      await prisma.finalSubmission.create({
        data: {
          orderId: tracking.orderId,
          finalGoldWeight: initialGoldWeight, // Can be updated later with actual final weight
          finalStoneWeight: 0, // No stone weight field in OrderDetails, default to 0
          finalPurity: orderDetails?.purity || 22,
          numberOfPieces: orderDetails?.quantity || 1,
          totalWeight: initialGoldWeight,
          submittedById: userId,
          submittedAt: now,
          completionPhotos: (data.uploadedPhotos || []) as string[],
          qualityNotes: 'Auto-submitted upon completion of all departments',
        },
      });
      console.log('📦 FinalSubmission record created');

      // Log order completion activity
      await activityService.logActivity({
        orderId: tracking.orderId,
        action: ActivityAction.ORDER_SUBMITTED,
        title: 'Order completed - Ready for final submission',
        description: `All 9 departments have completed their work. Order is ready for factory-to-office handoff.`,
        userId: userId,
        metadata: {
          completedDepartments: DEPARTMENT_ORDER,
          finalGoldWeight: initialGoldWeight,
          finalPurity: orderDetails?.purity || 22,
          numberOfPieces: orderDetails?.quantity || 1,
        },
      });

      // Update order status
      await prisma.order.update({
        where: {
          id: tracking.orderId,
        },
        data: {
          status: 'COMPLETED',
          completedAt: now,
        },
      });

      // Return early since there's no next department
      return workData;
    }
  }

  if (nextDepartment) {
    // Try to find an available worker in the next department for auto-assignment
    const nextDeptName =
      'departmentName' in nextDepartment
        ? nextDepartment.departmentName
        : (nextDepartment as any).departmentName;

    const availableWorker = await prisma.user.findFirst({
      where: {
        department: nextDeptName,
        role: UserRole.DEPARTMENT_WORKER,
        isActive: true,
      },
      orderBy: {
        lastAssignedAt: 'asc', // Get the worker who was assigned longest ago (fair distribution)
      },
    });

    // Update next department tracking
    // If available worker found: auto-assign and set to NOT_STARTED
    // If no worker found: set to PENDING_ASSIGNMENT so workers can self-assign or admin can assign
    const nextDeptLabel = DEPARTMENT_LABELS[nextDeptName as DepartmentName] || nextDeptName;

    await prisma.departmentTracking.update({
      where: {
        id: nextDepartment.id,
      },
      data: {
        status: availableWorker
          ? DepartmentStatus.NOT_STARTED
          : DepartmentStatus.PENDING_ASSIGNMENT,
        assignedToId: availableWorker?.id || null,
      },
    });

    // Log department move activity
    await activityService.logActivity({
      orderId: tracking.orderId,
      action: ActivityAction.DEPT_MOVE,
      title: `Moved to ${nextDeptLabel}`,
      description: `Order moved from ${deptLabel} to ${nextDeptLabel}`,
      userId: userId,
      metadata: {
        fromDepartment: tracking.departmentName,
        toDepartment: nextDeptName,
        fromDepartmentLabel: deptLabel,
        toDepartmentLabel: nextDeptLabel,
      },
    });

    // Update worker's last assigned time if auto-assigned
    if (availableWorker) {
      await prisma.user.update({
        where: {
          id: availableWorker.id,
        },
        data: {
          lastAssignedAt: new Date(),
        },
      });

      // Log worker assignment activity
      await activityService.logActivity({
        orderId: tracking.orderId,
        action: ActivityAction.WORKER_ASSIGNED,
        title: `Worker assigned to ${nextDeptLabel}`,
        description: `${availableWorker.name} auto-assigned to ${nextDeptLabel}`,
        userId: userId,
        metadata: {
          departmentName: nextDeptName,
          departmentLabel: nextDeptLabel,
          assignedWorkerId: availableWorker.id,
          assignedWorkerName: availableWorker.name,
          autoAssigned: true,
        },
      });

      // Create notification for auto-assigned worker
      try {
        console.log('Creating auto-assignment notification for:', {
          workerId: availableWorker.id,
          workerName: availableWorker.name,
          orderId: tracking.orderId,
          orderNumber: tracking.order?.orderNumber,
        });

        await createAssignmentNotification(
          availableWorker.id,
          tracking.orderId,
          tracking.order?.orderNumber || 'Unknown Order',
          false // isUrgent - could check order priority if needed
        );

        console.log('✅ Auto-assignment notification created successfully');
      } catch (error) {
        console.error('❌ Failed to create auto-assignment notification:', error);
      }
    }

    // Update order's current department
    await prisma.order.update({
      where: {
        id: tracking.orderId,
      },
      data: {
        currentDepartment: nextDeptName,
      },
    });
  }

  return workData;
};
