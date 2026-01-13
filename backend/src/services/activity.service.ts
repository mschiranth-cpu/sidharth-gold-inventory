/**
 * ============================================
 * ACTIVITY LOGGING SERVICE
 * ============================================
 *
 * Service for logging order-related activities
 * (status changes, department moves, worker assignments, etc.)
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export enum ActivityAction {
  STATUS_CHANGE = 'STATUS_CHANGE',
  DEPT_MOVE = 'DEPT_MOVE',
  WORKER_ASSIGNED = 'WORKER_ASSIGNED',
  WORKER_REASSIGNED = 'WORKER_REASSIGNED',
  DEPT_COMPLETED = 'DEPT_COMPLETED',
  FILE_UPLOADED = 'FILE_UPLOADED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_SUBMITTED = 'ORDER_SUBMITTED',
  NOTES_UPDATED = 'NOTES_UPDATED',
}

interface ActivityLogParams {
  orderId: string;
  action: ActivityAction;
  title: string;
  description?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export const activityService = {
  /**
   * Log an activity for an order
   */
  async logActivity(params: ActivityLogParams): Promise<void> {
    try {
      const { orderId, action, title, description, userId, metadata } = params;

      await prisma.orderActivity.create({
        data: {
          orderId,
          action,
          title,
          description,
          userId,
          metadata,
        },
      });

      logger.info(`Activity logged: ${action} for order ${orderId}`, {
        action,
        orderId,
        userId,
      });
    } catch (error) {
      logger.error('Failed to log activity', { error, params });
      // Don't throw - activity logging should not block main operations
    }
  },

  /**
   * Get all activities for an order
   */
  async getOrderActivities(orderId: string) {
    try {
      return await prisma.orderActivity.findMany({
        where: { orderId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to fetch order activities', { error, orderId });
      return [];
    }
  },

  /**
   * Get activity summary for an order
   */
  async getActivitySummary(orderId: string) {
    try {
      const activities = await prisma.orderActivity.findMany({
        where: { orderId },
      });

      const summary = {
        totalActions: activities.length,
        statusChanges: activities.filter((a) => a.action === ActivityAction.STATUS_CHANGE).length,
        departmentMoves: activities.filter((a) => a.action === ActivityAction.DEPT_MOVE).length,
        workerAssignments: activities.filter(
          (a) =>
            a.action === ActivityAction.WORKER_ASSIGNED ||
            a.action === ActivityAction.WORKER_REASSIGNED
        ).length,
        filesUploaded: activities.filter((a) => a.action === ActivityAction.FILE_UPLOADED).length,
      };

      return summary;
    } catch (error) {
      logger.error('Failed to get activity summary', { error, orderId });
      return {
        totalActions: 0,
        statusChanges: 0,
        departmentMoves: 0,
        workerAssignments: 0,
        filesUploaded: 0,
      };
    }
  },

  /**
   * Helper: Log status change
   */
  async logStatusChange(
    orderId: string,
    oldStatus: string,
    newStatus: string,
    userId?: string
  ): Promise<void> {
    await this.logActivity({
      orderId,
      action: ActivityAction.STATUS_CHANGE,
      title: `Status changed from ${oldStatus} to ${newStatus}`,
      description: `Order status updated from ${oldStatus} to ${newStatus}`,
      userId,
      metadata: { oldStatus, newStatus },
    });
  },

  /**
   * Helper: Log department move
   */
  async logDepartmentMove(
    orderId: string,
    fromDept: string,
    toDept: string,
    userId?: string
  ): Promise<void> {
    await this.logActivity({
      orderId,
      action: ActivityAction.DEPT_MOVE,
      title: `Moved from ${fromDept} to ${toDept}`,
      description: `Order moved from ${fromDept} department to ${toDept} department`,
      userId,
      metadata: { fromDepartment: fromDept, toDepartment: toDept },
    });
  },

  /**
   * Helper: Log worker assignment
   */
  async logWorkerAssignment(
    orderId: string,
    workerName: string,
    department: string,
    userId?: string,
    isReassignment: boolean = false
  ): Promise<void> {
    const action = isReassignment
      ? ActivityAction.WORKER_REASSIGNED
      : ActivityAction.WORKER_ASSIGNED;
    const actionWord = isReassignment ? 'Reassigned to' : 'Assigned to';

    await this.logActivity({
      orderId,
      action,
      title: `${actionWord} ${workerName} (${department})`,
      description: `Order assigned to worker ${workerName} in ${department} department`,
      userId,
      metadata: { workerName, department, isReassignment },
    });
  },

  /**
   * Helper: Log department completion
   */
  async logDepartmentCompletion(
    orderId: string,
    departmentName: string,
    nextDepartment?: string,
    userId?: string
  ): Promise<void> {
    const description = nextDepartment
      ? `${departmentName} department completed. Order moved to ${nextDepartment}`
      : `${departmentName} department completed`;

    await this.logActivity({
      orderId,
      action: ActivityAction.DEPT_COMPLETED,
      title: `${departmentName} department completed`,
      description,
      userId,
      metadata: { completedDepartment: departmentName, nextDepartment },
    });
  },

  /**
   * Helper: Log file upload
   */
  async logFileUpload(
    orderId: string,
    fileName: string,
    fileType: string,
    userId?: string
  ): Promise<void> {
    await this.logActivity({
      orderId,
      action: ActivityAction.FILE_UPLOADED,
      title: `File uploaded: ${fileName}`,
      description: `File ${fileName} (${fileType}) uploaded to the order`,
      userId,
      metadata: { fileName, fileType },
    });
  },
};

export default activityService;
