/**
 * ============================================
 * FINAL SUBMISSION SERVICE
 * ============================================
 *
 * Business logic for factory-to-office order
 * submissions with weight variance tracking.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { PrismaClient, UserRole, Prisma } from '@prisma/client';
import { logger } from '../../utils/logger';
import {
  SubmissionError,
  SubmissionErrorCode,
  CreateSubmissionRequest,
  SubmissionQueryParams,
  CustomerApprovalRequest,
  SubmissionListItem,
  SubmissionDetailResponse,
  PaginatedSubmissionsResponse,
  SubmissionNotification,
  WeightVariance,
  calculateWeightVariance,
  canViewCustomerInfo,
  WEIGHT_VARIANCE_ALERT_THRESHOLD,
  NOTIFICATION_RECIPIENT_ROLES,
} from './submissions.types';
import { DEPARTMENT_ORDER } from '../departments/departments.types';

const prisma = new PrismaClient();

// ============================================
// NOTIFICATION QUEUE
// ============================================

const notificationQueue: SubmissionNotification[] = [];

/**
 * Sends a notification for submission events
 */
async function sendNotification(notification: SubmissionNotification): Promise<void> {
  logger.info('Submission notification', {
    type: notification.type,
    orderId: notification.orderId,
    message: notification.message,
  });

  notificationQueue.push(notification);

  // Create database notifications for office staff
  // TODO: Update to use new NotificationType enum values
  // Temporarily disabled to avoid type conflicts
  /*
  try {
    const recipients = await prisma.user.findMany({
      where: {
        role: { in: NOTIFICATION_RECIPIENT_ROLES },
        isActive: true,
      },
      select: { id: true },
    });

    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((user: { id: string }) => ({
          userId: user.id,
          title:
            notification.type === 'HIGH_VARIANCE_ALERT'
              ? '⚠️ High Variance Alert'
              : '✅ Order Submitted',
          message: notification.message,
          type: notification.type,
          relatedId: notification.orderId,
        })),
      });
    }
  } catch (error) {
    logger.error('Failed to create notifications', { error });
  }
  */
}

/**
 * Gets recent submission notifications
 */
export function getRecentNotifications(limit = 50): SubmissionNotification[] {
  return notificationQueue.slice(-limit);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates that all departments are completed for an order
 */
async function validateDepartmentsComplete(orderId: string): Promise<{
  isComplete: boolean;
  incompleteDepartments: string[];
}> {
  const departmentTracking = await prisma.departmentTracking.findMany({
    where: { orderId },
    select: { departmentName: true, status: true },
  });

  const completedDepts = new Set(
    departmentTracking
      .filter((dt: { departmentName: string; status: string }) => dt.status === 'COMPLETED')
      .map((dt: { departmentName: string; status: string }) => dt.departmentName)
  );

  const incompleteDepartments = DEPARTMENT_ORDER.filter((dept) => !completedDepts.has(dept));

  return {
    isComplete: incompleteDepartments.length === 0,
    incompleteDepartments,
  };
}

/**
 * Transforms submission to list item format
 */
function toSubmissionListItem(
  submission: {
    id: string;
    orderId: string;
    finalGoldWeight: number;
    finalStoneWeight: number;
    numberOfPieces: number;
    qualityGrade: string | null;
    completionPhotos: string[];
    submittedAt: Date;
    customerApproved: boolean;
    submittedBy: {
      id: string;
      name: string;
      email: string;
    };
    order: {
      orderNumber: string;
      customerName: string;
      orderDetails: {
        goldWeightInitial: number;
        productType: string | null;
      } | null;
    };
  },
  userRole: UserRole
): SubmissionListItem {
  const initialWeight = submission.order.orderDetails?.goldWeightInitial ?? 0;
  const weightVariance = calculateWeightVariance(initialWeight, submission.finalGoldWeight);

  const item: SubmissionListItem = {
    id: submission.id,
    orderId: submission.orderId,
    orderNumber: submission.order.orderNumber,
    productType: submission.order.orderDetails?.productType ?? null,
    finalGoldWeight: submission.finalGoldWeight,
    finalStoneWeight: submission.finalStoneWeight,
    numberOfPieces: submission.numberOfPieces,
    qualityGrade: submission.qualityGrade,
    submittedBy: {
      id: submission.submittedBy.id,
      name: submission.submittedBy.name,
      email: submission.submittedBy.email,
    },
    submittedAt: submission.submittedAt,
    customerApproved: submission.customerApproved,
    weightVariance,
    photoCount: submission.completionPhotos.length,
  };

  // Only include customer name for authorized roles
  if (canViewCustomerInfo(userRole)) {
    item.customerName = submission.order.customerName;
  }

  return item;
}

/**
 * Transforms submission to detail response
 */
function toSubmissionDetailResponse(
  submission: {
    id: string;
    orderId: string;
    finalGoldWeight: number;
    finalStoneWeight: number;
    finalPurity: number;
    numberOfPieces: number;
    totalWeight: number | null;
    qualityGrade: string | null;
    qualityNotes: string | null;
    completionPhotos: string[];
    certificateUrl: string | null;
    submittedAt: Date;
    customerApproved: boolean;
    approvalDate: Date | null;
    approvalNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
    submittedBy: {
      id: string;
      name: string;
      email: string;
    };
    order: {
      id: string;
      orderNumber: string;
      customerName: string;
      orderDetails: {
        goldWeightInitial: number;
        productType: string | null;
        dueDate: Date;
      } | null;
    };
  },
  userRole: UserRole
): SubmissionDetailResponse {
  const initialWeight = submission.order.orderDetails?.goldWeightInitial ?? 0;
  const weightVariance = calculateWeightVariance(initialWeight, submission.finalGoldWeight);

  return {
    id: submission.id,
    order: {
      id: submission.order.id,
      orderNumber: submission.order.orderNumber,
      customerName: canViewCustomerInfo(userRole) ? submission.order.customerName : '[Hidden]',
      productType: submission.order.orderDetails?.productType ?? null,
      dueDate: submission.order.orderDetails?.dueDate ?? null,
    },
    finalGoldWeight: submission.finalGoldWeight,
    finalStoneWeight: submission.finalStoneWeight,
    finalPurity: submission.finalPurity,
    numberOfPieces: submission.numberOfPieces,
    totalWeight: submission.totalWeight,
    qualityGrade: submission.qualityGrade,
    qualityNotes: submission.qualityNotes,
    completionPhotos: submission.completionPhotos,
    certificateUrl: submission.certificateUrl,
    submittedBy: {
      id: submission.submittedBy.id,
      name: submission.submittedBy.name,
      email: submission.submittedBy.email,
    },
    submittedAt: submission.submittedAt,
    weightVariance,
    customerApproved: submission.customerApproved,
    approvalDate: submission.approvalDate,
    approvalNotes: submission.approvalNotes,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

// ============================================
// CREATE SUBMISSION
// ============================================

/**
 * Creates a final submission for a completed order
 */
export async function createSubmission(
  orderId: string,
  data: CreateSubmissionRequest,
  userId: string
): Promise<SubmissionDetailResponse> {
  // Verify order exists and is in factory
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderDetails: true,
      finalSubmission: true,
    },
  });

  if (!order) {
    throw new SubmissionError(
      SubmissionErrorCode.ORDER_NOT_FOUND,
      `Order with ID ${orderId} not found`,
      404
    );
  }

  if (order.status !== 'IN_FACTORY') {
    throw new SubmissionError(
      SubmissionErrorCode.ORDER_NOT_IN_FACTORY,
      `Order must be IN_FACTORY to submit. Current status: ${order.status}`,
      400
    );
  }

  if (order.finalSubmission) {
    throw new SubmissionError(
      SubmissionErrorCode.ORDER_ALREADY_SUBMITTED,
      'This order has already been submitted',
      400,
      { existingSubmissionId: order.finalSubmission.id }
    );
  }

  // Validate all departments are completed
  const { isComplete, incompleteDepartments } = await validateDepartmentsComplete(orderId);
  if (!isComplete) {
    throw new SubmissionError(
      SubmissionErrorCode.DEPARTMENTS_INCOMPLETE,
      `Cannot submit order - ${incompleteDepartments.length} department(s) not completed`,
      400,
      { incompleteDepartments }
    );
  }

  // Calculate weight variance
  const initialWeight = order.orderDetails?.goldWeightInitial ?? 0;
  const weightVariance = calculateWeightVariance(initialWeight, data.finalGoldWeight);

  // Check for high variance without acknowledgment
  if (weightVariance.isHighVariance && !data.acknowledgeVariance) {
    throw new SubmissionError(
      SubmissionErrorCode.HIGH_VARIANCE,
      `Weight variance of ${weightVariance.percentageVariance}% exceeds ${WEIGHT_VARIANCE_ALERT_THRESHOLD}% threshold. Please acknowledge to proceed.`,
      400,
      { weightVariance }
    );
  }

  // Get user info for submission
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  // Create submission and update order status in transaction
  const submission = await prisma.$transaction(async (tx) => {
    // Create the final submission
    const created = await tx.finalSubmission.create({
      data: {
        orderId,
        finalGoldWeight: data.finalGoldWeight,
        finalStoneWeight: data.finalStoneWeight,
        finalPurity: data.finalPurity,
        numberOfPieces: data.numberOfPieces ?? 1,
        totalWeight: data.totalWeight,
        qualityGrade: data.qualityGrade,
        qualityNotes: data.qualityNotes,
        completionPhotos: data.completionPhotos,
        certificateUrl: data.certificateUrl,
        submittedById: userId,
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        order: {
          include: {
            orderDetails: true,
          },
        },
      },
    });

    // Update order status to COMPLETED
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    return created;
  });

  // Send notifications
  const submitterInfo = {
    id: user?.id ?? userId,
    name: user?.name ?? 'Unknown',
    email: user?.email ?? '',
  };

  await sendNotification({
    type: 'ORDER_SUBMITTED',
    orderId,
    orderNumber: order.orderNumber,
    message: `Order ${order.orderNumber} has been submitted from factory by ${submitterInfo.name}`,
    timestamp: new Date(),
    submittedBy: submitterInfo,
    weightVariance,
  });

  // Send additional alert for high variance
  if (weightVariance.isHighVariance) {
    await sendNotification({
      type: 'HIGH_VARIANCE_ALERT',
      orderId,
      orderNumber: order.orderNumber,
      message: `⚠️ High weight variance (${weightVariance.percentageVariance}%) on order ${order.orderNumber}. Initial: ${weightVariance.initialWeight}g, Final: ${weightVariance.finalWeight}g`,
      timestamp: new Date(),
      submittedBy: submitterInfo,
      weightVariance,
    });
  }

  logger.info('Order submitted from factory', {
    orderId,
    orderNumber: order.orderNumber,
    submissionId: submission.id,
    weightVariance: weightVariance.percentageVariance,
    isHighVariance: weightVariance.isHighVariance,
  });

  // Get user role for response formatting (default to FACTORY_MANAGER for submitter)
  return toSubmissionDetailResponse(submission as any, 'FACTORY_MANAGER');
}

// ============================================
// GET SUBMISSIONS
// ============================================

/**
 * Gets paginated list of submissions with filtering
 */
export async function getSubmissions(
  params: SubmissionQueryParams,
  userRole: UserRole
): Promise<PaginatedSubmissionsResponse> {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    submittedFrom,
    submittedTo,
    submittedById,
    qualityGrade,
    customerApproved,
    search,
  } = params;

  // Build where clause
  const where: any = {};

  if (submittedFrom || submittedTo) {
    where.submittedAt = {};
    if (submittedFrom) where.submittedAt.gte = new Date(submittedFrom);
    if (submittedTo) where.submittedAt.lte = new Date(submittedTo);
  }

  if (submittedById) {
    where.submittedById = submittedById;
  }

  if (qualityGrade) {
    where.qualityGrade = qualityGrade;
  }

  if (customerApproved !== undefined) {
    where.customerApproved = customerApproved;
  }

  if (search) {
    where.order = {
      OR: [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  // Build order by
  let orderBy: any = {};
  if (sortBy === 'orderNumber') {
    orderBy = { order: { orderNumber: sortOrder } };
  } else {
    orderBy = { [sortBy]: sortOrder };
  }

  // Execute query
  const [submissions, total] = await Promise.all([
    prisma.finalSubmission.findMany({
      where,
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            orderDetails: {
              select: {
                goldWeightInitial: true,
                productType: true,
              },
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.finalSubmission.count({ where }),
  ]);

  // Transform to response format
  const data = submissions.map((s: any) => toSubmissionListItem(s, userRole));

  // Calculate summary stats
  const allSubmissions = await prisma.finalSubmission.findMany({
    where,
    select: {
      finalGoldWeight: true,
      customerApproved: true,
      order: {
        select: {
          orderDetails: {
            select: { goldWeightInitial: true },
          },
        },
      },
    },
  });

  let highVarianceCount = 0;
  let totalVariance = 0;

  allSubmissions.forEach((s: any) => {
    const initial = s.order.orderDetails?.goldWeightInitial ?? 0;
    const variance = calculateWeightVariance(initial, s.finalGoldWeight);
    if (variance.isHighVariance) highVarianceCount++;
    totalVariance += variance.percentageVariance;
  });

  const pendingApprovalCount = allSubmissions.filter((s: any) => !s.customerApproved).length;
  const averageVariance =
    allSubmissions.length > 0 ? Math.round((totalVariance / allSubmissions.length) * 100) / 100 : 0;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    summary: {
      totalSubmissions: total,
      highVarianceCount,
      pendingApprovalCount,
      averageVariance,
    },
  };
}

/**
 * Gets a single submission by ID
 */
export async function getSubmissionById(
  submissionId: string,
  userRole: UserRole
): Promise<SubmissionDetailResponse | null> {
  const submission = await prisma.finalSubmission.findUnique({
    where: { id: submissionId },
    include: {
      submittedBy: {
        select: { id: true, name: true, email: true },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          orderDetails: {
            select: {
              goldWeightInitial: true,
              productType: true,
              dueDate: true,
            },
          },
        },
      },
    },
  });

  if (!submission) {
    return null;
  }

  return toSubmissionDetailResponse(submission as any, userRole);
}

/**
 * Gets submission by order ID
 */
export async function getSubmissionByOrderId(
  orderId: string,
  userRole: UserRole
): Promise<SubmissionDetailResponse | null> {
  const submission = await prisma.finalSubmission.findUnique({
    where: { orderId },
    include: {
      submittedBy: {
        select: { id: true, name: true, email: true },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          orderDetails: {
            select: {
              goldWeightInitial: true,
              productType: true,
              dueDate: true,
            },
          },
        },
      },
    },
  });

  if (!submission) {
    return null;
  }

  return toSubmissionDetailResponse(submission as any, userRole);
}

// ============================================
// CUSTOMER APPROVAL
// ============================================

/**
 * Updates customer approval status
 */
export async function updateCustomerApproval(
  submissionId: string,
  data: CustomerApprovalRequest,
  userId: string
): Promise<SubmissionDetailResponse> {
  const submission = await prisma.finalSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new SubmissionError(
      SubmissionErrorCode.SUBMISSION_NOT_FOUND,
      `Submission with ID ${submissionId} not found`,
      404
    );
  }

  const updated = await prisma.finalSubmission.update({
    where: { id: submissionId },
    data: {
      customerApproved: data.approved,
      approvalDate: data.approved ? new Date() : null,
      approvalNotes: data.notes,
    },
    include: {
      submittedBy: {
        select: { id: true, name: true, email: true },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          orderDetails: {
            select: {
              goldWeightInitial: true,
              productType: true,
              dueDate: true,
            },
          },
        },
      },
    },
  });

  logger.info('Customer approval updated', {
    submissionId,
    approved: data.approved,
    userId,
  });

  return toSubmissionDetailResponse(updated as any, 'ADMIN');
}

// ============================================
// STATISTICS
// ============================================

/**
 * Gets submission statistics
 */
export async function getSubmissionStats(): Promise<{
  totalSubmissions: number;
  submissionsThisMonth: number;
  highVarianceSubmissions: number;
  pendingApprovals: number;
  averageVariance: number;
  byQualityGrade: Record<string, number>;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, thisMonth, pending, submissions] = await Promise.all([
    prisma.finalSubmission.count(),
    prisma.finalSubmission.count({
      where: { submittedAt: { gte: startOfMonth } },
    }),
    prisma.finalSubmission.count({
      where: { customerApproved: false },
    }),
    prisma.finalSubmission.findMany({
      select: {
        finalGoldWeight: true,
        qualityGrade: true,
        order: {
          select: {
            orderDetails: {
              select: { goldWeightInitial: true },
            },
          },
        },
      },
    }),
  ]);

  // Calculate variance stats
  let highVarianceCount = 0;
  let totalVariance = 0;
  const gradeCount: Record<string, number> = {};

  submissions.forEach((s: any) => {
    const initial = s.order.orderDetails?.goldWeightInitial ?? 0;
    const variance = calculateWeightVariance(initial, s.finalGoldWeight);
    if (variance.isHighVariance) highVarianceCount++;
    totalVariance += variance.percentageVariance;

    if (s.qualityGrade) {
      gradeCount[s.qualityGrade] = (gradeCount[s.qualityGrade] ?? 0) + 1;
    }
  });

  return {
    totalSubmissions: total,
    submissionsThisMonth: thisMonth,
    highVarianceSubmissions: highVarianceCount,
    pendingApprovals: pending,
    averageVariance:
      submissions.length > 0 ? Math.round((totalVariance / submissions.length) * 100) / 100 : 0,
    byQualityGrade: gradeCount,
  };
}
