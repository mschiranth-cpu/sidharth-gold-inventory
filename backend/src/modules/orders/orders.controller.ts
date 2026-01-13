/**
 * ============================================
 * ORDERS CONTROLLER
 * ============================================
 *
 * Express controllers for order endpoints.
 * Handles HTTP requests and responses for CRUD operations.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { UserRole, PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
  deleteOrder,
  addStonesToOrder,
  updateOrderPhoto,
  getOrderStats,
  assignWorkerToDepartment,
  selfAssignToDepartment,
  getDepartmentWorkers,
} from './orders.service';
import {
  createOrderSchema,
  updateOrderSchema,
  orderQuerySchema,
  addStonesSchema,
  photoUploadSchema,
} from './orders.validation';
import {
  OrderError,
  OrderErrorCode,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderQueryParams,
} from './orders.types';
import { AuthenticatedRequest } from '../auth/auth.types';

// ============================================
// INITIALIZE PRISMA
// ============================================

const prisma = new PrismaClient();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sends a success response with consistent format
 */
function sendSuccess<T>(res: Response, data: T, message: string, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Sends an error response with consistent format
 */
function sendError(res: Response, error: OrderError | ZodError | Error, statusCode = 500): void {
  if (error instanceof OrderError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        statusCode: 400,
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode,
    },
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// CREATE ORDER
// ============================================

/**
 * POST /api/orders
 *
 * Creates a new order with details and optional stones.
 * Only office staff and admins can create orders.
 *
 * Request body:
 * {
 *   "customerName": "Shree Balaji Jewellers",
 *   "customerPhone": "+91 9876543210",
 *   "customerEmail": "balaji@example.com",
 *   "productPhotoUrl": "https://...",
 *   "priority": 5,
 *   "orderDetails": {
 *     "goldWeightInitial": 50.5,
 *     "purity": 22,
 *     "goldColor": "Yellow Gold",
 *     "size": "18 inches",
 *     "quantity": 1,
 *     "productType": "Kundan Necklace Set",
 *     "dueDate": "2026-02-15",
 *     "additionalDescription": "...",
 *     "specialInstructions": "..."
 *   },
 *   "stones": [
 *     {
 *       "stoneType": "KUNDAN",
 *       "weight": 5.2,
 *       "quantity": 12,
 *       "color": "White"
 *     }
 *   ]
 * }
 */
export async function handleCreateOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate request body
    const validatedData = createOrderSchema.parse(req.body) as CreateOrderRequest;

    logger.info('Creating order', { userId: authReq.user.userId });

    const order = await createOrder(validatedData, authReq.user.userId);

    sendSuccess(
      res,
      {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
      },
      'Order created successfully',
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    if (error instanceof OrderError) {
      sendError(res, error);
      return;
    }
    logger.error('Create order error', { error });
    next(error);
  }
}

// ============================================
// GET ALL ORDERS
// ============================================

/**
 * GET /api/orders
 *
 * Returns a paginated list of orders with optional filtering.
 * Customer information is hidden from factory users.
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sortBy: Field to sort by (createdAt, orderNumber, status, priority, dueDate)
 * - sortOrder: asc or desc
 * - search: Search in order number and customer name
 * - status: Filter by status (DRAFT, IN_FACTORY, COMPLETED)
 * - createdFrom, createdTo: Date range for creation date
 * - dueDateFrom, dueDateTo: Date range for due date
 * - currentDepartment: Filter by current processing department
 * - priority: Exact priority match
 * - priorityMin: Minimum priority
 */
export async function handleGetOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate query parameters
    const validatedQuery = orderQuerySchema.parse(req.query) as OrderQueryParams;

    const result = await getOrders(validatedQuery, authReq.user.role);

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    logger.error('Get orders error', { error });
    next(error);
  }
}

// ============================================
// GET SINGLE ORDER
// ============================================

/**
 * GET /api/orders/:id
 *
 * Returns full details of a single order.
 * Customer information is hidden from factory users.
 */
export async function handleGetOrderById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const order = await getOrderById(id, authReq.user.role);

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: OrderErrorCode.ORDER_NOT_FOUND,
          message: `Order with ID ${id} not found`,
          statusCode: 404,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    sendSuccess(res, order, 'Order retrieved successfully');
  } catch (error) {
    logger.error('Get order by ID error', { error });
    next(error);
  }
}

// ============================================
// UPDATE ORDER
// ============================================

/**
 * PUT /api/orders/:id
 *
 * Updates an existing order.
 * Cannot modify completed orders.
 * Factory users cannot modify customer information.
 *
 * Request body (all fields optional):
 * {
 *   "customerName": "Updated Name",
 *   "status": "IN_FACTORY",
 *   "priority": 8,
 *   "orderDetails": {
 *     "dueDate": "2026-02-20"
 *   }
 * }
 */
export async function handleUpdateOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate request body
    const validatedData = updateOrderSchema.parse(req.body) as UpdateOrderRequest;

    const order = await updateOrder(id, validatedData, authReq.user.userId, authReq.user.role);

    sendSuccess(
      res,
      {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt,
      },
      'Order updated successfully'
    );
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    if (error instanceof OrderError) {
      sendError(res, error);
      return;
    }
    logger.error('Update order error', { error });
    next(error);
  }
}

// ============================================
// DELETE ORDER
// ============================================

/**
 * DELETE /api/orders/:id
 *
 * Soft deletes an order (admin only).
 * Removes order and all related records.
 */
export async function handleDeleteOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    await deleteOrder(id, authReq.user.userId);

    sendSuccess(res, null, 'Order deleted successfully');
  } catch (error) {
    if (error instanceof OrderError) {
      sendError(res, error);
      return;
    }
    logger.error('Delete order error', { error });
    next(error);
  }
}

// ============================================
// UPLOAD PHOTO
// ============================================

/**
 * POST /api/orders/:id/photo
 *
 * Uploads/updates the product photo for an order.
 * In a real implementation, this would handle file uploads.
 *
 * Request body:
 * {
 *   "photoUrl": "https://storage.example.com/photos/abc123.jpg"
 * }
 */
export async function handleUploadPhoto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { photoUrl } = req.body;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!photoUrl || typeof photoUrl !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'photoUrl is required and must be a string',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const order = await updateOrderPhoto(id, photoUrl);

    sendSuccess(
      res,
      {
        id: order.id,
        orderNumber: order.orderNumber,
        productPhotoUrl: order.productPhotoUrl,
      },
      'Photo uploaded successfully'
    );
  } catch (error) {
    if (error instanceof OrderError) {
      sendError(res, error);
      return;
    }
    logger.error('Upload photo error', { error });
    next(error);
  }
}

// ============================================
// ADD STONES
// ============================================

/**
 * POST /api/orders/:id/stones
 *
 * Adds stones to an existing order.
 *
 * Request body:
 * {
 *   "stones": [
 *     {
 *       "stoneType": "DIAMOND",
 *       "weight": 0.5,
 *       "quantity": 6,
 *       "clarity": "VVS1",
 *       "color": "D",
 *       "cut": "Excellent"
 *     }
 *   ]
 * }
 */
export async function handleAddStones(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate request body
    const validatedData = addStonesSchema.parse(req.body);

    const stones = await addStonesToOrder(id, validatedData.stones as any);

    sendSuccess(
      res,
      {
        orderId: id,
        stonesAdded: stones.length,
        stones: stones.map((s) => ({
          id: s.id,
          stoneType: s.stoneType,
          weight: s.weight,
          quantity: s.quantity,
        })),
      },
      'Stones added successfully',
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, error);
      return;
    }
    if (error instanceof OrderError) {
      sendError(res, error);
      return;
    }
    logger.error('Add stones error', { error });
    next(error);
  }
}

// ============================================
// GET ORDER STATISTICS
// ============================================

/**
 * GET /api/orders/stats
 *
 * Returns order statistics (admin and office staff only).
 */
export async function handleGetOrderStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const stats = await getOrderStats();

    sendSuccess(res, stats, 'Order statistics retrieved successfully');
  } catch (error) {
    logger.error('Get order stats error', { error });
    next(error);
  }
}

// ============================================
// ASSIGN WORKER TO DEPARTMENT
// ============================================

/**
 * PATCH /api/orders/:id/departments/:departmentName/assign
 *
 * Assigns a worker to a specific department for an order.
 * Admin and Office Staff only.
 */
export async function handleAssignWorker(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id: orderId, departmentName } = req.params;
    const { workerId } = req.body;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!workerId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Worker ID is required',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await assignWorkerToDepartment(
      orderId,
      departmentName,
      workerId,
      authReq.user.userId
    );

    sendSuccess(res, result, 'Worker assigned successfully');
  } catch (error) {
    logger.error('Assign worker error', { error, orderId: req.params.id });
    next(error);
  }
}

// ============================================
// WORKER SELF-ASSIGN
// ============================================

/**
 * POST /api/orders/:id/departments/:departmentName/self-assign
 *
 * Allows a worker to self-assign to a pending order in their department.
 * Department Workers only.
 */
export async function handleSelfAssign(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id: orderId, departmentName } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Fetch user to get department
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
      select: { department: true },
    });

    if (!user || !user.department) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'User does not have a department assigned',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await selfAssignToDepartment(
      orderId,
      departmentName,
      authReq.user.userId,
      user.department
    );

    sendSuccess(res, result, 'Successfully assigned to yourself');
  } catch (error) {
    logger.error('Self-assign error', { error, orderId: req.params.id });
    next(error);
  }
}

// ============================================
// GET DEPARTMENT WORKERS
// ============================================

/**
 * GET /api/orders/departments/:departmentName/workers
 *
 * Gets list of workers in a department with their current workload.
 */
export async function handleGetDepartmentWorkers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { departmentName } = req.params;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const workers = await getDepartmentWorkers(departmentName);

    sendSuccess(res, workers, 'Department workers retrieved successfully');
  } catch (error) {
    logger.error('Get department workers error', { error });
    next(error);
  }
}

// ============================================
// ADD REFERENCE IMAGE
// ============================================

/**
 * POST /api/orders/:id/reference-images
 *
 * Adds a reference image to an order's orderDetails.
 */
export async function handleAddReferenceImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'imageUrl is required and must be a string',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get current order details
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderDetails: true },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
          statusCode: 404,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!order.orderDetails) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Order has no order details',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Add new image to existing reference images
    const currentImages = order.orderDetails.referenceImages || [];
    const updatedImages = [...currentImages, imageUrl];

    await prisma.orderDetails.update({
      where: { id: order.orderDetails.id },
      data: { referenceImages: updatedImages },
    });

    sendSuccess(res, { referenceImages: updatedImages }, 'Reference image added successfully');
  } catch (error) {
    logger.error('Add reference image error', { error });
    next(error);
  }
}

// ============================================
// ADD COMPLETION PHOTO
// ============================================

/**
 * POST /api/orders/:id/completion-photos
 *
 * Adds a completion photo to an order's final submission.
 */
export async function handleAddCompletionPhoto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { photoUrl } = req.body;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!photoUrl || typeof photoUrl !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'photoUrl is required and must be a string',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get or create final submission
    let finalSubmission = await prisma.finalSubmission.findUnique({
      where: { orderId: id },
    });

    if (finalSubmission) {
      // Update existing submission
      const currentPhotos = finalSubmission.completionPhotos || [];
      const updatedPhotos = [...currentPhotos, photoUrl];

      finalSubmission = await prisma.finalSubmission.update({
        where: { id: finalSubmission.id },
        data: { completionPhotos: updatedPhotos },
      });
    } else {
      // Create new submission with just the completion photo
      finalSubmission = await prisma.finalSubmission.create({
        data: {
          orderId: id,
          finalGoldWeight: 0,
          finalStoneWeight: 0,
          finalPurity: 0,
          completionPhotos: [photoUrl],
          submittedById: authReq.user.userId,
        },
      });
    }

    sendSuccess(
      res,
      { completionPhotos: finalSubmission.completionPhotos },
      'Completion photo added successfully'
    );
  } catch (error) {
    logger.error('Add completion photo error', { error });
    next(error);
  }
}
