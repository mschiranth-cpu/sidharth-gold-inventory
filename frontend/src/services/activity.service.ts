/**
 * ============================================
 * ACTIVITY SERVICE (Frontend)
 * ============================================
 *
 * Service for fetching order activities and logs
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { apiGet } from './api';

export interface OrderActivity {
  id: string;
  orderId: string;
  action: string;
  title: string;
  description?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ActivitySummary {
  totalActions: number;
  statusChanges: number;
  departmentMoves: number;
  workerAssignments: number;
  filesUploaded: number;
}

const activityService = {
  /**
   * Get all activities for an order
   */
  async getOrderActivities(orderId: string): Promise<OrderActivity[]> {
    try {
      const response = await apiGet<{ data: OrderActivity[] } | OrderActivity[]>(
        `/activities/orders/${orderId}`
      );
      // Handle both wrapped { data: [] } and direct array responses
      if (Array.isArray(response)) return response;
      if ('data' in response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.error('Failed to fetch order activities', error);
      return [];
    }
  },

  /**
   * Get activity summary for an order
   */
  async getActivitySummary(orderId: string): Promise<ActivitySummary> {
    try {
      const response = await apiGet<{ data: ActivitySummary } | ActivitySummary>(
        `/activities/orders/${orderId}/summary`
      );
      const defaultSummary = {
        totalActions: 0,
        statusChanges: 0,
        departmentMoves: 0,
        workerAssignments: 0,
        filesUploaded: 0,
      };
      // Handle both wrapped { data: {} } and direct object responses
      if ('data' in response && response.data) return response.data;
      if ('totalActions' in response) return response as ActivitySummary;
      return defaultSummary;
    } catch (error) {
      console.error('Failed to fetch activity summary', error);
      return {
        totalActions: 0,
        statusChanges: 0,
        departmentMoves: 0,
        workerAssignments: 0,
        filesUploaded: 0,
      };
    }
  },
};

export default activityService;
