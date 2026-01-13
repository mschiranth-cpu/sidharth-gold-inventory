/**
 * ============================================
 * ASSIGNMENT CONTROLLER
 * ============================================
 *
 * HTTP request handlers for assignment operations.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, DepartmentName } from '@prisma/client';
import { logger } from '../../utils/logger';
import * as assignmentService from './assignment.service';

const prisma = new PrismaClient();

/**
 * Send multiple orders to factory (bulk operation)
 * POST /api/assignments/send-to-factory
 */
export async function sendToFactory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'orderIds array is required',
      });
      return;
    }

    const result = await assignmentService.bulkSendToFactory(orderIds);

    res.status(200).json({
      success: result.success,
      message: `Sent ${result.successCount} orders to factory${
        result.failedCount > 0 ? `, ${result.failedCount} failed` : ''
      }`,
      data: result,
    });
  } catch (error) {
    logger.error('Error in sendToFactory controller', { error });
    next(error);
  }
}

/**
 * Send a single order to factory
 * POST /api/assignments/orders/:orderId/send-to-factory
 */
export async function sendSingleOrderToFactory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        message: 'orderId is required',
      });
      return;
    }

    const result = await assignmentService.sendToFactory(orderId);

    res.status(200).json({
      success: true,
      message: `Order ${result.orderNumber} sent to factory`,
      data: result,
    });
  } catch (error) {
    logger.error('Error in sendSingleOrderToFactory controller', { error });

    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (error.message.includes('already')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    next(error);
  }
}

/**
 * Reassign a department to a different worker
 * POST /api/assignments/orders/:orderId/departments/:departmentName/reassign
 */
export async function reassignDepartment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId, departmentName } = req.params;
    const { workerId } = req.body;
    const userId = (req as any).user?.id;

    if (!workerId) {
      res.status(400).json({
        success: false,
        message: 'workerId is required',
      });
      return;
    }

    // Validate department name
    if (!assignmentService.DEPARTMENT_ORDER.includes(departmentName as DepartmentName)) {
      res.status(400).json({
        success: false,
        message: 'Invalid department name',
      });
      return;
    }

    const result = await assignmentService.reassignDepartment(
      orderId,
      departmentName as DepartmentName,
      workerId,
      userId
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error('Error in reassignDepartment controller', { error });
    next(error);
  }
}

/**
 * Complete a department and cascade to next
 * POST /api/assignments/orders/:orderId/departments/:departmentName/complete
 */
export async function completeDepartment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId, departmentName } = req.params;
    const { goldWeightOut, notes } = req.body;
    const userId = (req as any).user?.id;

    // Validate department name
    if (!assignmentService.DEPARTMENT_ORDER.includes(departmentName as DepartmentName)) {
      res.status(400).json({
        success: false,
        message: 'Invalid department name',
      });
      return;
    }

    const result = await assignmentService.completeDepartmentAndCascade(
      orderId,
      departmentName as DepartmentName,
      userId,
      goldWeightOut,
      notes
    );

    res.status(200).json({
      success: true,
      message: result.orderCompleted
        ? 'Order completed - all departments finished'
        : result.nextDepartment
        ? `Completed ${departmentName}, cascaded to ${result.nextDepartment}`
        : `Completed ${departmentName}`,
      data: result,
    });
  } catch (error) {
    logger.error('Error in completeDepartment controller', { error });
    next(error);
  }
}

/**
 * Get the current queue for a department
 * GET /api/assignments/queue/:departmentName
 */
export async function getDepartmentQueue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { departmentName } = req.params;

    // Validate department name
    if (!assignmentService.DEPARTMENT_ORDER.includes(departmentName as DepartmentName)) {
      res.status(400).json({
        success: false,
        message: 'Invalid department name',
      });
      return;
    }

    // Get waiting orders (NOT_STARTED and unassigned) ordered by creation date
    const queue = await prisma.departmentTracking.findMany({
      where: {
        departmentName: departmentName as DepartmentName,
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
            customerName: true,
            priority: true,
            orderDetails: {
              select: {
                dueDate: true,
                productType: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        departmentName,
        queueLength: queue.length,
        queue: queue.map((item, index) => ({
          trackingId: item.id,
          orderId: item.order.id,
          orderNumber: item.order.orderNumber,
          customerName: item.order.customerName,
          priority: item.order.priority,
          productType: item.order.orderDetails?.productType,
          dueDate: item.order.orderDetails?.dueDate,
          queuePosition: index + 1,
          queuedAt: item.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error('Error in getDepartmentQueue controller', { error });
    next(error);
  }
}

/**
 * Manually move an order to a different department
 * POST /api/assignments/orders/:orderId/move-to/:departmentName
 */
export async function moveToDepartment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId, departmentName } = req.params;

    // Validate department name
    if (!assignmentService.DEPARTMENT_ORDER.includes(departmentName as DepartmentName)) {
      res.status(400).json({
        success: false,
        message: 'Invalid department name',
      });
      return;
    }

    const result = await assignmentService.moveToDepartment(
      orderId,
      departmentName as DepartmentName
    );

    res.status(200).json({
      success: true,
      message: `Order moved to ${departmentName}`,
      data: result,
    });
  } catch (error) {
    logger.error('Error in moveToDepartment controller', { error });
    next(error);
  }
}
