/**
 * ============================================
 * ORDERS SERVICE
 * ============================================
 *
 * Business logic for order operations.
 * Handles database queries, data transformation,
 * and business rule enforcement.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { PrismaClient, Order, OrderDetails, Stone, Prisma, UserRole } from '@prisma/client';
import { logger } from '../../utils/logger';
import { calculateDepartmentProgress } from '../../config/departmentRequirements';
import { createAssignmentNotification } from '../notifications/notifications.service';
import {
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderQueryParams,
  OrderListItemResponse,
  OrderDetailResponse,
  PaginatedResponse,
  OrderError,
  OrderErrorCode,
  CUSTOMER_VISIBLE_ROLES,
  isValidStatusTransition,
  DEPARTMENT_ORDER,
  StoneInput,
} from './orders.types';

// ============================================
// PRISMA CLIENT INSTANCE
// ============================================

const prisma = new PrismaClient();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generates a unique order number
 * Format: ORD-YYYY-NNNNN-XXX (e.g., ORD-2026-00042-A3B)
 * Added random suffix to prevent race conditions in concurrent scenarios
 */
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  // Get the latest order number for this year
  const latestOrder = await prisma.order.findFirst({
    where: {
      orderNumber: { startsWith: prefix },
    },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });

  let nextNumber = 1;
  if (latestOrder) {
    // Extract the sequence number (handle both old and new format)
    const parts = latestOrder.orderNumber.split('-');
    const currentNumber = parseInt(parts[2] || '0', 10);
    nextNumber = currentNumber + 1;
  }

  // Add random suffix to prevent race condition collisions
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${String(nextNumber).padStart(5, '0')}-${randomSuffix}`;
}

/**
 * Calculates the current department for an order based on tracking
 */
function getCurrentDepartment(
  departmentTracking: Array<{ departmentName: string; status: string }>
): string | null {
  // Find the first department that is IN_PROGRESS
  const inProgress = departmentTracking.find((dt) => dt.status === 'IN_PROGRESS');
  if (inProgress) {
    return inProgress.departmentName;
  }

  // Find the last completed department and return the next one
  const completedDepts = departmentTracking
    .filter((dt: { departmentName: string; status: string }) => dt.status === 'COMPLETED')
    .sort((a: { departmentName: string }, b: { departmentName: string }) => {
      const aIndex = DEPARTMENT_ORDER.indexOf(a.departmentName as any);
      const bIndex = DEPARTMENT_ORDER.indexOf(b.departmentName as any);
      return bIndex - aIndex;
    });

  if (completedDepts.length > 0) {
    const lastCompletedIndex = DEPARTMENT_ORDER.indexOf(completedDepts[0]!.departmentName as any);
    if (lastCompletedIndex < DEPARTMENT_ORDER.length - 1) {
      return DEPARTMENT_ORDER[lastCompletedIndex + 1] ?? null;
    }
  }

  // No progress yet, return first department
  return DEPARTMENT_ORDER[0] ?? null;
}

/**
 * Calculates completion percentage based on department tracking
 */
function calculateCompletionPercentage(departmentTracking: Array<{ status: string }>): number {
  if (departmentTracking.length === 0) return 0;

  const totalDepartments = DEPARTMENT_ORDER.length;
  const completedCount = departmentTracking.filter(
    (dt: { status: string }) => dt.status === 'COMPLETED'
  ).length;

  return Math.round((completedCount / totalDepartments) * 100);
}

/**
 * Transforms order data to list item response
 * Hides customer info from factory users
 */
function toOrderListItem(order: any, userRole: UserRole): OrderListItemResponse {
  const canSeeCustomer = CUSTOMER_VISIBLE_ROLES.includes(userRole);

  const primaryPhoto = order.productPhotoUrl || order.orderDetails?.referenceImages?.[0] || null;

  // Add completionPercentage to each departmentTracking item
  const departmentTrackingWithProgress = (order.departmentTracking || []).map((dt: any) => ({
    ...dt,
    completionPercentage: calculateDepartmentProgress(dt.departmentName, dt.workData),
  }));

  const response: OrderListItemResponse = {
    id: order.id,
    orderNumber: order.orderNumber,
    productPhotoUrl: primaryPhoto,
    status: order.status,
    priority: order.priority,
    createdBy: {
      id: order.createdBy.id,
      name: order.createdBy.name,
      email: order.createdBy.email,
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    productType: order.orderDetails?.productType ?? undefined,
    dueDate: order.orderDetails?.dueDate ?? undefined,
    currentDepartment: getCurrentDepartment(order.departmentTracking || []) as any,
    completionPercentage: calculateCompletionPercentage(order.departmentTracking || []),
    departmentTracking: departmentTrackingWithProgress,
  };

  // Only include customer info for authorized roles
  if (canSeeCustomer) {
    response.customerName = order.customerName;
    response.customerPhone = order.customerPhone ?? undefined;
    response.customerEmail = order.customerEmail ?? undefined;
  }

  return response;
}

/**
 * Collects all files from an order including department work files
 */
function collectOrderFiles(order: any): any[] {
  const files: any[] = [];

  // Collect main product photo
  if (order.productPhotoUrl) {
    files.push({
      id: 'product-main',
      url: order.productPhotoUrl,
      filename: 'Product Photo',
      fileType: 'image',
      category: 'product',
      uploadedBy: order.createdBy?.name || 'System',
      uploadedAt: order.createdAt,
      size: 0,
    });
  }

  // Collect reference images from order details
  if (order.orderDetails?.referenceImages && Array.isArray(order.orderDetails.referenceImages)) {
    order.orderDetails.referenceImages.forEach((imgUrl: string, index: number) => {
      files.push({
        id: `ref-${index}`,
        url: imgUrl,
        filename: `Reference Image ${index + 1}`,
        fileType: 'image',
        category: 'reference',
        uploadedBy: order.orderDetails.enteredBy?.name || 'System',
        uploadedAt: order.orderDetails.createdAt,
        size: 0, // Unknown size for reference images
      });
    });
  }

  // Collect files and photos from department work data
  if (order.departmentTracking && Array.isArray(order.departmentTracking)) {
    order.departmentTracking.forEach((dt: any) => {
      const deptName = dt.departmentName;

      // Add department photos
      if (dt.workData?.uploadedPhotos && Array.isArray(dt.workData.uploadedPhotos)) {
        dt.workData.uploadedPhotos.forEach((photo: any) => {
          if (photo && photo.url) {
            files.push({
              id: photo.id || `photo-${dt.id}-${files.length}`,
              url: photo.url,
              thumbnailUrl: photo.thumbnailUrl || photo.url,
              filename: photo.name || photo.filename || 'Department Photo',
              fileType: 'image',
              category: 'department',
              uploadedBy: dt.assignedTo?.name || 'Worker',
              uploadedAt: dt.workData.workCompletedAt || dt.completedAt || dt.startedAt,
              departmentId: dt.departmentName,
              departmentName: deptName,
              size: photo.size || 0,
            });
          }
        });
      }

      // Add department files
      if (dt.workData?.uploadedFiles && Array.isArray(dt.workData.uploadedFiles)) {
        dt.workData.uploadedFiles.forEach((file: any) => {
          if (file && file.url) {
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
              file.name || file.filename || ''
            );
            files.push({
              id: file.id || `file-${dt.id}-${files.length}`,
              url: file.url,
              filename: file.name || file.filename || 'Department File',
              fileType: isImage ? 'image' : 'document',
              category: 'department',
              uploadedBy: dt.assignedTo?.name || 'Worker',
              uploadedAt: dt.workData.workCompletedAt || dt.completedAt || dt.startedAt,
              departmentId: dt.departmentName,
              departmentName: deptName,
              size: file.size || 0,
            });
          }
        });
      }
    });
  }

  // Collect completion photos from final submission
  if (
    order.finalSubmission?.completionPhotos &&
    Array.isArray(order.finalSubmission.completionPhotos)
  ) {
    order.finalSubmission.completionPhotos.forEach((photoUrl: string, index: number) => {
      files.push({
        id: `completion-${index}`,
        url: photoUrl,
        filename: `Completion Photo ${index + 1}`,
        fileType: 'image',
        category: 'completion',
        uploadedBy: order.finalSubmission.submittedBy?.name || 'System',
        uploadedAt: order.finalSubmission.submittedAt,
        size: 0,
      });
    });
  }

  return files;
}

/**
 * Transforms order data to detail response
 * Hides customer info from factory users
 */
function toOrderDetailResponse(order: any, userRole: UserRole): OrderDetailResponse {
  const canSeeCustomer = CUSTOMER_VISIBLE_ROLES.includes(userRole);

  const response: OrderDetailResponse = {
    id: order.id,
    orderNumber: order.orderNumber,
    productPhotoUrl: order.productPhotoUrl,
    status: order.status,
    priority: order.priority,
    currentDepartment: getCurrentDepartment(order.departmentTracking || []) as any,
    completionPercentage: calculateCompletionPercentage(order.departmentTracking || []),
    createdBy: {
      id: order.createdBy.id,
      name: order.createdBy.name,
      email: order.createdBy.email,
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    orderDetails: order.orderDetails
      ? {
          id: order.orderDetails.id,
          goldWeightInitial: order.orderDetails.goldWeightInitial,
          purity: order.orderDetails.purity,
          goldColor: order.orderDetails.goldColor,
          metalType: order.orderDetails.metalType,
          metalFinish: order.orderDetails.metalFinish,
          customFinish: order.orderDetails.customFinish,
          size: order.orderDetails.size,
          quantity: order.orderDetails.quantity,
          productType: order.orderDetails.productType,
          customProductType: order.orderDetails.customProductType,
          dueDate: order.orderDetails.dueDate,
          additionalDescription: order.orderDetails.additionalDescription,
          specialInstructions: order.orderDetails.specialInstructions,
          referenceImages: order.orderDetails.referenceImages,
          enteredBy: {
            id: order.orderDetails.enteredBy.id,
            name: order.orderDetails.enteredBy.name,
          },
          createdAt: order.orderDetails.createdAt,
          updatedAt: order.orderDetails.updatedAt,
        }
      : null,
    stones:
      order.stones?.map((stone: any) => ({
        id: stone.id,
        stoneType: stone.stoneType,
        stoneName: stone.stoneName,
        customType: stone.customType,
        weight: stone.weight,
        quantity: stone.quantity,
        color: stone.color,
        clarity: stone.clarity,
        cut: stone.cut,
        shape: stone.shape,
        customShape: stone.customShape,
        setting: stone.setting,
        customSetting: stone.customSetting,
        notes: stone.notes,
      })) ?? [],
    departmentTracking:
      order.departmentTracking?.map((dt: any) => ({
        id: dt.id,
        departmentName: dt.departmentName,
        sequenceOrder: dt.sequenceOrder,
        status: dt.status,
        assignedTo: dt.assignedTo
          ? {
              id: dt.assignedTo.id,
              name: dt.assignedTo.name,
            }
          : null,
        goldWeightIn: dt.goldWeightIn,
        goldWeightOut: dt.goldWeightOut,
        goldLoss: dt.goldLoss,
        estimatedHours: dt.estimatedHours,
        startedAt: dt.startedAt,
        completedAt: dt.completedAt,
        notes: dt.notes,
        photos: dt.photos,
        issues: dt.issues,
        completionPercentage: calculateDepartmentProgress(dt.departmentName, dt.workData),
        workData: dt.workData
          ? {
              formData: dt.workData.formData,
              uploadedFiles: dt.workData.uploadedFiles,
              uploadedPhotos: dt.workData.uploadedPhotos,
              isComplete: dt.workData.isComplete,
            }
          : null,
      })) ?? [],
    files: collectOrderFiles(order),
    finalSubmission: order.finalSubmission
      ? {
          id: order.finalSubmission.id,
          finalGoldWeight: order.finalSubmission.finalGoldWeight,
          finalStoneWeight: order.finalSubmission.finalStoneWeight,
          finalPurity: order.finalSubmission.finalPurity,
          numberOfPieces: order.finalSubmission.numberOfPieces,
          totalWeight: order.finalSubmission.totalWeight,
          qualityGrade: order.finalSubmission.qualityGrade,
          qualityNotes: order.finalSubmission.qualityNotes,
          completionPhotos: order.finalSubmission.completionPhotos,
          certificateUrl: order.finalSubmission.certificateUrl,
          submittedBy: {
            id: order.finalSubmission.submittedBy.id,
            name: order.finalSubmission.submittedBy.name,
          },
          submittedAt: order.finalSubmission.submittedAt,
          customerApproved: order.finalSubmission.customerApproved,
          approvalDate: order.finalSubmission.approvalDate,
          approvalNotes: order.finalSubmission.approvalNotes,
        }
      : null,
  };

  // Only include customer info for authorized roles
  if (canSeeCustomer) {
    response.customerName = order.customerName;
    response.customerPhone = order.customerPhone ?? undefined;
    response.customerEmail = order.customerEmail ?? undefined;
  }

  return response;
}

// ============================================
// ORDER CRUD OPERATIONS
// ============================================

/**
 * Creates a new order with details and optional stones
 */
export async function createOrder(data: CreateOrderRequest, userId: string): Promise<Order> {
  const orderNumber = await generateOrderNumber();

  logger.info('Creating new order', { orderNumber, userId });

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      productPhotoUrl: data.productPhotoUrl,
      priority: data.priority ?? 0,
      status: 'DRAFT',
      createdById: userId,
      orderDetails: {
        create: {
          goldWeightInitial: data.orderDetails.goldWeightInitial,
          purity: data.orderDetails.purity,
          goldColor: data.orderDetails.goldColor,
          metalType: data.orderDetails.metalType ?? 'GOLD',
          metalFinish: data.orderDetails.metalFinish,
          customFinish: data.orderDetails.customFinish,
          size: data.orderDetails.size,
          quantity: data.orderDetails.quantity ?? 1,
          productType: data.orderDetails.productType,
          dueDate: new Date(data.orderDetails.dueDate),
          additionalDescription: data.orderDetails.additionalDescription,
          specialInstructions: data.orderDetails.specialInstructions,
          referenceImages: data.orderDetails.referenceImages ?? [],
          enteredById: userId,
        },
      },
      stones:
        data.stones && data.stones.length > 0
          ? {
              create: data.stones.map((stone) => ({
                stoneType: stone.stoneType,
                stoneName: stone.stoneName,
                customType: stone.customType,
                weight: stone.weight,
                quantity: stone.quantity ?? 1,
                color: stone.color,
                clarity: stone.clarity,
                cut: stone.cut,
                shape: stone.shape,
                customShape: stone.customShape,
                setting: stone.setting,
                customSetting: stone.customSetting,
                notes: stone.notes,
              })),
            }
          : undefined,
    },
    include: {
      createdBy: true,
      orderDetails: {
        include: { enteredBy: true },
      },
      stones: true,
    },
  });

  logger.info('Order created successfully', { orderId: order.id, orderNumber });

  return order;
}

/**
 * Gets a single order by ID with all related data
 */
export async function getOrderById(
  orderId: string,
  userRole: UserRole
): Promise<OrderDetailResponse | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      createdBy: true,
      orderDetails: {
        include: { enteredBy: true },
      },
      stones: true,
      departmentTracking: {
        include: {
          assignedTo: true,
          workData: true,
        },
        orderBy: { sequenceOrder: 'asc' },
      },
      finalSubmission: {
        include: { submittedBy: true },
      },
    },
  });

  if (!order) {
    return null;
  }

  return toOrderDetailResponse(order, userRole);
}

/**
 * Gets orders with pagination and filtering
 */
export async function getOrders(
  params: OrderQueryParams,
  userRole: UserRole
): Promise<PaginatedResponse<OrderListItemResponse>> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    orderNumber,
    status,
    createdFrom,
    createdTo,
    dueDateFrom,
    dueDateTo,
    currentDepartment,
    priority,
    priorityMin,
    createdById,
    assignedToId,
  } = params;

  // Build where clause
  const where: Prisma.OrderWhereInput = {};

  // Search in order number and customer name
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Exact or partial order number match
  if (orderNumber) {
    where.orderNumber = { contains: orderNumber, mode: 'insensitive' };
  }

  // Status filter
  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }

  // Date range filters
  if (createdFrom || createdTo) {
    where.createdAt = {};
    if (createdFrom) where.createdAt.gte = new Date(createdFrom);
    if (createdTo) where.createdAt.lte = new Date(createdTo);
  }

  // Due date filter
  if (dueDateFrom || dueDateTo) {
    where.orderDetails = {
      dueDate: {},
    };
    if (dueDateFrom) (where.orderDetails.dueDate as any).gte = new Date(dueDateFrom);
    if (dueDateTo) (where.orderDetails.dueDate as any).lte = new Date(dueDateTo);
  }

  // Priority filter
  if (priority !== undefined) {
    where.priority = priority;
  } else if (priorityMin !== undefined) {
    where.priority = { gte: priorityMin };
  }

  // Created by filter
  if (createdById) {
    where.createdById = createdById;
  }

  // Assigned to filter (filter by worker assigned to any department)
  if (assignedToId) {
    where.departmentTracking = {
      some: {
        assignedToId: assignedToId,
      },
    };
  }

  // Calculate offset
  const skip = (page - 1) * limit;

  // Build orderBy clause
  let orderBy: Prisma.OrderOrderByWithRelationInput = {};

  if (sortBy === 'dueDate') {
    orderBy = { orderDetails: { dueDate: sortOrder } };
  } else {
    orderBy = { [sortBy]: sortOrder };
  }

  // Execute query with count
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        createdBy: true,
        orderDetails: true,
        departmentTracking: {
          select: {
            departmentName: true,
            status: true,
            startedAt: true,
            completedAt: true,
            assignedToId: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
            workData: {
              select: {
                formData: true,
                uploadedFiles: true,
                uploadedPhotos: true,
                isComplete: true,
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  // Filter by current department if specified (post-query filter)
  let filteredOrders = orders;
  if (currentDepartment) {
    filteredOrders = orders.filter((order) => {
      const current = getCurrentDepartment(order.departmentTracking);
      return current === currentDepartment;
    });
  }

  // Transform to response format
  const data = filteredOrders.map((order) => toOrderListItem(order, userRole));

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Updates an existing order
 */
export async function updateOrder(
  orderId: string,
  data: UpdateOrderRequest,
  userId: string,
  userRole: UserRole
): Promise<Order> {
  // Get existing order
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderDetails: true },
  });

  if (!existingOrder) {
    throw new OrderError(OrderErrorCode.ORDER_NOT_FOUND, `Order with ID ${orderId} not found`, 404);
  }

  // Check if order can be modified
  if (existingOrder.status === 'COMPLETED') {
    throw new OrderError(
      OrderErrorCode.ORDER_CANNOT_BE_MODIFIED,
      'Completed orders cannot be modified',
      400
    );
  }

  // Validate status transition if status is being updated
  if (data.status && data.status !== existingOrder.status) {
    if (!isValidStatusTransition(existingOrder.status, data.status)) {
      throw new OrderError(
        OrderErrorCode.INVALID_STATUS_TRANSITION,
        `Cannot transition from ${existingOrder.status} to ${data.status}`,
        400
      );
    }
  }

  // Check permissions for customer info updates
  if (
    (data.customerName || data.customerPhone || data.customerEmail) &&
    !CUSTOMER_VISIBLE_ROLES.includes(userRole)
  ) {
    throw new OrderError(
      OrderErrorCode.INSUFFICIENT_PERMISSIONS,
      'You do not have permission to modify customer information',
      403
    );
  }

  logger.info('Updating order', { orderId, userId });

  // Build update data
  const updateData: Prisma.OrderUpdateInput = {};

  if (data.customerName !== undefined) updateData.customerName = data.customerName;
  if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone;
  if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
  if (data.productPhotoUrl !== undefined) updateData.productPhotoUrl = data.productPhotoUrl;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;

  // Update order details if provided
  if (data.orderDetails && existingOrder.orderDetails) {
    const detailsUpdate: Prisma.OrderDetailsUpdateInput = {};

    if (data.orderDetails.goldWeightInitial !== undefined) {
      detailsUpdate.goldWeightInitial = data.orderDetails.goldWeightInitial;
    }
    if (data.orderDetails.purity !== undefined) {
      detailsUpdate.purity = data.orderDetails.purity;
    }
    if (data.orderDetails.goldColor !== undefined) {
      detailsUpdate.goldColor = data.orderDetails.goldColor;
    }
    if (data.orderDetails.metalType !== undefined) {
      detailsUpdate.metalType = data.orderDetails.metalType;
    }
    if (data.orderDetails.metalFinish !== undefined) {
      detailsUpdate.metalFinish = data.orderDetails.metalFinish;
    }
    if (data.orderDetails.customFinish !== undefined) {
      detailsUpdate.customFinish = data.orderDetails.customFinish;
    }
    if (data.orderDetails.size !== undefined) {
      detailsUpdate.size = data.orderDetails.size;
    }
    if (data.orderDetails.quantity !== undefined) {
      detailsUpdate.quantity = data.orderDetails.quantity;
    }
    if (data.orderDetails.productType !== undefined) {
      detailsUpdate.productType = data.orderDetails.productType;
    }
    if (data.orderDetails.dueDate !== undefined) {
      detailsUpdate.dueDate = new Date(data.orderDetails.dueDate);
    }
    if (data.orderDetails.additionalDescription !== undefined) {
      detailsUpdate.additionalDescription = data.orderDetails.additionalDescription;
    }
    if (data.orderDetails.specialInstructions !== undefined) {
      detailsUpdate.specialInstructions = data.orderDetails.specialInstructions;
    }
    if (data.orderDetails.referenceImages !== undefined) {
      detailsUpdate.referenceImages = data.orderDetails.referenceImages;
    }

    updateData.orderDetails = {
      update: detailsUpdate,
    };
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: {
      createdBy: true,
      orderDetails: {
        include: { enteredBy: true },
      },
      stones: true,
    },
  });

  logger.info('Order updated successfully', { orderId });

  return order;
}

/**
 * Soft deletes an order (admin only)
 * In production, add a deletedAt field for soft delete
 * For now, we'll just mark the order as COMPLETED to prevent further processing
 */
export async function deleteOrder(orderId: string, userId: string): Promise<void> {
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    throw new OrderError(OrderErrorCode.ORDER_NOT_FOUND, `Order with ID ${orderId} not found`, 404);
  }

  // In production, implement soft delete with deletedAt field
  // For now, we delete related records and the order
  logger.warn('Deleting order', { orderId, userId });

  await prisma.$transaction([
    // Delete related records first
    prisma.finalSubmission.deleteMany({ where: { orderId } }),
    prisma.departmentTracking.deleteMany({ where: { orderId } }),
    prisma.stone.deleteMany({ where: { orderId } }),
    prisma.orderDetails.deleteMany({ where: { orderId } }),
    // Delete the order
    prisma.order.delete({ where: { id: orderId } }),
  ]);

  logger.info('Order deleted successfully', { orderId });
}

/**
 * Adds stones to an existing order
 */
export async function addStonesToOrder(orderId: string, stones: StoneInput[]): Promise<Stone[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new OrderError(OrderErrorCode.ORDER_NOT_FOUND, `Order with ID ${orderId} not found`, 404);
  }

  if (order.status === 'COMPLETED') {
    throw new OrderError(
      OrderErrorCode.ORDER_CANNOT_BE_MODIFIED,
      'Cannot add stones to a completed order',
      400
    );
  }

  const createdStones = await prisma.stone.createManyAndReturn({
    data: stones.map((stone) => ({
      orderId,
      stoneType: stone.stoneType,
      stoneName: stone.stoneName,
      customType: stone.customType,
      weight: stone.weight,
      quantity: stone.quantity ?? 1,
      color: stone.color,
      clarity: stone.clarity,
      cut: stone.cut,
      shape: stone.shape,
      customShape: stone.customShape,
      setting: stone.setting,
      customSetting: stone.customSetting,
      notes: stone.notes,
    })),
  });

  logger.info('Stones added to order', { orderId, count: createdStones.length });

  return createdStones;
}

/**
 * Updates order product photo URL
 */
export async function updateOrderPhoto(orderId: string, photoUrl: string): Promise<Order> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new OrderError(OrderErrorCode.ORDER_NOT_FOUND, `Order with ID ${orderId} not found`, 404);
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { productPhotoUrl: photoUrl },
  });
}

/**
 * Gets order statistics
 */
export async function getOrderStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  overdueCount: number;
  dueTodayCount: number;
}> {
  const [total, byStatusArray, overdueCount, dueTodayCount] = await Promise.all([
    prisma.order.count(),
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.order.count({
      where: {
        status: { not: 'COMPLETED' },
        orderDetails: {
          dueDate: { lt: new Date() },
        },
      },
    }),
    prisma.order.count({
      where: {
        status: { not: 'COMPLETED' },
        orderDetails: {
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      },
    }),
  ]);

  const byStatus = byStatusArray.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {} as Record<string, number>);

  return { total, byStatus, overdueCount, dueTodayCount };
}

// ============================================
// ASSIGN WORKER TO DEPARTMENT
// ============================================

/**
 * Assigns a worker to a specific department for an order
 */
export async function assignWorkerToDepartment(
  orderId: string,
  departmentName: string,
  workerId: string,
  assignedBy: string
): Promise<{ message: string; tracking: any }> {
  // Validate worker exists and has DEPARTMENT_WORKER role
  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    select: { id: true, name: true, role: true, department: true },
  });

  if (!worker) {
    throw new OrderError(OrderErrorCode.NOT_FOUND, 'Worker not found', 404);
  }

  if (worker.role !== 'DEPARTMENT_WORKER') {
    throw new OrderError(OrderErrorCode.VALIDATION_ERROR, 'User is not a department worker', 400);
  }

  if (worker.department !== departmentName) {
    throw new OrderError(
      OrderErrorCode.VALIDATION_ERROR,
      `Worker is not assigned to ${departmentName} department`,
      400
    );
  }

  // Find the department tracking for this order and department
  const tracking = await prisma.departmentTracking.findFirst({
    where: {
      orderId,
      departmentName: departmentName as any,
    },
  });

  if (!tracking) {
    throw new OrderError(
      OrderErrorCode.NOT_FOUND,
      'Department tracking not found for this order',
      404
    );
  }

  if (tracking.status !== 'PENDING_ASSIGNMENT') {
    throw new OrderError(
      OrderErrorCode.VALIDATION_ERROR,
      'Order is not in pending assignment status',
      400
    );
  }

  // Update department tracking - assign worker and change status
  const updatedTracking = await prisma.departmentTracking.update({
    where: { id: tracking.id },
    data: {
      assignedToId: workerId,
      status: 'NOT_STARTED',
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Create activity log
  const assigner = await prisma.user.findUnique({
    where: { id: assignedBy },
    select: { name: true },
  });

  await prisma.orderActivity.create({
    data: {
      orderId,
      userId: assignedBy,
      action: 'WORKER_ASSIGNED',
      title: 'Worker Assigned',
      description: `${assigner?.name || 'Admin'} assigned ${
        worker.name
      } to ${departmentName} department`,
      metadata: {
        departmentName,
        workerId,
        workerName: worker.name,
      },
    },
  });

  logger.info('Worker assigned to department', {
    orderId,
    departmentName,
    workerId,
    workerName: worker.name,
    assignedBy,
  });

  // Create notification for the assigned worker
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true },
    });

    if (order) {
      await createAssignmentNotification(
        workerId,
        orderId,
        order.orderNumber,
        false // isUrgent
      );
      logger.info('✅ Assignment notification created successfully', {
        workerId,
        orderId,
        orderNumber: order.orderNumber,
      });
    }
  } catch (error) {
    logger.error('Failed to create assignment notification', { error, workerId, orderId });
    // Don't fail the assignment if notification creation fails
  }

  return {
    message: 'Worker assigned successfully',
    tracking: updatedTracking,
  };
}

// ============================================
// WORKER SELF-ASSIGN
// ============================================

/**
 * Allows a worker to self-assign to a pending order in their department
 */
export async function selfAssignToDepartment(
  orderId: string,
  departmentName: string,
  workerId: string,
  workerDepartment: string
): Promise<{ message: string; tracking: any }> {
  // Verify worker's department matches the order's department
  if (workerDepartment !== departmentName) {
    throw new OrderError(
      OrderErrorCode.VALIDATION_ERROR,
      'You can only assign yourself to orders in your department',
      403
    );
  }

  // Find the department tracking
  const tracking = await prisma.departmentTracking.findFirst({
    where: {
      orderId,
      departmentName: departmentName as any,
    },
  });

  if (!tracking) {
    throw new OrderError(
      OrderErrorCode.NOT_FOUND,
      'Department tracking not found for this order',
      404
    );
  }

  if (tracking.status !== 'PENDING_ASSIGNMENT') {
    throw new OrderError(
      OrderErrorCode.VALIDATION_ERROR,
      'Order is not available for self-assignment',
      400
    );
  }

  // Update department tracking
  const updatedTracking = await prisma.departmentTracking.update({
    where: { id: tracking.id },
    data: {
      assignedToId: workerId,
      status: 'NOT_STARTED',
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Create activity log
  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    select: { name: true },
  });

  await prisma.orderActivity.create({
    data: {
      orderId,
      userId: workerId,
      action: 'WORKER_ASSIGNED',
      title: 'Worker Self-Assigned',
      description: `${worker?.name || 'Worker'} self-assigned to ${departmentName} department`,
      metadata: {
        departmentName,
        selfAssigned: true,
      },
    },
  });

  logger.info('Worker self-assigned to department', {
    orderId,
    departmentName,
    workerId,
    workerName: worker?.name,
  });

  return {
    message: 'Successfully assigned to yourself',
    tracking: updatedTracking,
  };
}

// ============================================
// GET DEPARTMENT WORKERS
// ============================================

/**
 * Gets list of workers in a department with their workload
 */
export async function getDepartmentWorkers(departmentName: string): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    currentWorkload: number;
  }>
> {
  // Get all workers in the department
  const workers = await prisma.user.findMany({
    where: {
      role: 'DEPARTMENT_WORKER',
      department: departmentName as any,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Get workload for each worker (count of NOT_STARTED and IN_PROGRESS orders)
  const workersWithWorkload = await Promise.all(
    workers.map(async (worker) => {
      const workload = await prisma.departmentTracking.count({
        where: {
          assignedToId: worker.id,
          status: {
            in: ['NOT_STARTED', 'IN_PROGRESS'],
          },
        },
      });

      return {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        currentWorkload: workload,
      };
    })
  );

  // Sort by workload (ascending) - show least busy workers first
  return workersWithWorkload.sort((a, b) => a.currentWorkload - b.currentWorkload);
}
