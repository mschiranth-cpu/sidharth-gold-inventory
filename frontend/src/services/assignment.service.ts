/**
 * ============================================
 * ASSIGNMENT SERVICE
 * ============================================
 *
 * Frontend API service for order assignment operations.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import api from './api';

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

export interface BulkSendToFactoryResult {
  success: boolean;
  results: SendToFactoryResult[];
  successCount: number;
  failedCount: number;
}

export interface QueueItem {
  trackingId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  priority: number;
  productType?: string;
  dueDate?: string;
  queuePosition: number;
  queuedAt: string;
}

export interface DepartmentQueue {
  departmentName: string;
  queueLength: number;
  queue: QueueItem[];
}

export interface CompleteDepartmentResult {
  completed: boolean;
  nextDepartment: string | null;
  nextAssignment: AssignmentResult | null;
  queueAssignment: AssignmentResult | null;
  orderCompleted: boolean;
}

export const assignmentService = {
  /**
   * Send multiple orders to factory (bulk operation)
   */
  async sendToFactory(orderIds: string[]): Promise<BulkSendToFactoryResult> {
    const response = await api.post('/assignments/send-to-factory', { orderIds });
    return response.data.data;
  },

  /**
   * Send a single order to factory
   */
  async sendSingleOrderToFactory(orderId: string): Promise<SendToFactoryResult> {
    const response = await api.post(`/assignments/orders/${orderId}/send-to-factory`);
    return response.data.data;
  },

  /**
   * Reassign a department to a different worker
   */
  async reassignDepartment(
    orderId: string,
    departmentName: string,
    workerId: string
  ): Promise<AssignmentResult> {
    const response = await api.post(
      `/assignments/orders/${orderId}/departments/${departmentName}/reassign`,
      { workerId }
    );
    return response.data.data;
  },

  /**
   * Complete a department and cascade to next
   */
  async completeDepartment(
    orderId: string,
    departmentName: string,
    goldWeightOut?: number,
    notes?: string
  ): Promise<CompleteDepartmentResult> {
    const response = await api.post(
      `/assignments/orders/${orderId}/departments/${departmentName}/complete`,
      { goldWeightOut, notes }
    );
    return response.data.data;
  },

  /**
   * Get the current queue for a department
   */
  async getDepartmentQueue(departmentName: string): Promise<DepartmentQueue> {
    const response = await api.get(`/assignments/queue/${departmentName}`);
    return response.data.data;
  },

  /**
   * Manually move an order to a different department
   */
  async moveToDepartment(orderId: string, departmentName: string): Promise<any> {
    const response = await api.post(`/assignments/orders/${orderId}/move-to/${departmentName}`);
    return response.data.data;
  },
};

export default assignmentService;
