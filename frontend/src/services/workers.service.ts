/**
 * ============================================
 * WORKERS API SERVICE
 * ============================================
 *
 * Service for worker-specific API calls
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import api from './api';

interface PendingAssignmentsResponse {
  success: boolean;
  data: {
    count: number;
    hasAssignments: boolean;
  };
}

interface WorkData {
  order: any;
  department: any;
  tracking: {
    id: string;
    status: string;
    assignedAt: string;
    startedAt: string | null;
    completedAt: string | null;
  };
  workData: {
    id: string;
    formData: Record<string, any>;
    uploadedFiles: string[];
    uploadedPhotos: string[];
    startedAt: string | null;
    completedAt: string | null;
    lastSavedAt: string | null;
    isDraft: boolean;
    isComplete: boolean;
  } | null;
}

interface WorkDataResponse {
  success: boolean;
  data: WorkData;
}

interface SaveProgressPayload {
  formData: Record<string, any>;
  uploadedFiles: string[];
  uploadedPhotos: string[];
}

interface SaveProgressResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Get count of pending assignments for the logged-in worker
 */
export const workersService = {
  /**
   * Fetch pending assignments count
   */
  getPendingAssignmentsCount: async (): Promise<PendingAssignmentsResponse> => {
    const response = await api.get<PendingAssignmentsResponse>(
      '/workers/pending-assignments-count'
    );
    return response.data;
  },

  /**
   * Get work data for a specific order
   */
  getWorkData: async (orderId: string): Promise<WorkDataResponse> => {
    const response = await api.get<WorkDataResponse>(`/workers/work/${orderId}`);
    return response.data;
  },

  /**
   * Start work on an order
   */
  startWork: async (orderId: string): Promise<SaveProgressResponse> => {
    const response = await api.post<SaveProgressResponse>(`/workers/work/${orderId}/start`);
    return response.data;
  },

  /**
   * Save work progress (draft)
   */
  saveWorkProgress: async (
    orderId: string,
    data: SaveProgressPayload
  ): Promise<SaveProgressResponse> => {
    const response = await api.post<SaveProgressResponse>(`/workers/work/${orderId}/save`, data);
    return response.data;
  },

  /**
   * Complete and submit work
   */
  completeWork: async (
    orderId: string,
    data: SaveProgressPayload
  ): Promise<SaveProgressResponse> => {
    const response = await api.post<SaveProgressResponse>(
      `/workers/work/${orderId}/complete`,
      data
    );
    return response.data;
  },
};
