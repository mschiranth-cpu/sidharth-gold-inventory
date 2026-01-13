/**
 * ============================================
 * SUBMISSIONS SERVICE
 * ============================================
 *
 * API service for submissions operations.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { apiGet, apiPut } from '../../../services/api';

const SUBMISSIONS_URL = '/submissions';

// ============================================
// TYPES
// ============================================

export interface SubmissionListItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  productType: string | null;
  finalGoldWeight: number;
  finalStoneWeight: number;
  numberOfPieces: number;
  qualityGrade: string | null;
  submittedBy: {
    id: string;
    name: string;
    email: string;
  };
  submittedAt: string;
  customerApproved: boolean;
  weightVariance: {
    initialWeight: number;
    finalWeight: number;
    difference: number;
    percentageVariance: number;
    isHighVariance: boolean;
    alertThreshold: number;
  };
  photoCount: number;
}

export interface SubmissionsListResponse {
  success: boolean;
  message: string;
  data: SubmissionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalSubmissions: number;
    highVarianceCount: number;
    pendingApprovalCount: number;
    averageVariance: number;
  };
}

// Backend returns these field names from /stats endpoint
export interface SubmissionStatsResponse {
  success: boolean;
  message: string;
  data: {
    totalSubmissions: number;
    submissionsThisMonth: number;
    highVarianceSubmissions: number;
    pendingApprovals: number;
    averageVariance: number;
    byQualityGrade: Record<string, number>;
  };
}

export interface SubmissionQueryParams {
  page: number;
  limit: number;
  sortBy?: 'submittedAt' | 'orderNumber' | 'finalGoldWeight' | 'qualityGrade';
  sortOrder?: 'asc' | 'desc';
  submittedFrom?: string;
  submittedTo?: string;
  submittedById?: string;
  qualityGrade?: string;
  hasHighVariance?: boolean;
  customerApproved?: boolean;
  search?: string;
}

// ============================================
// SERVICE
// ============================================

export const submissionsService = {
  getAll: async (params: SubmissionQueryParams): Promise<SubmissionsListResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('limit', params.limit.toString());

    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
      queryParams.append('sortOrder', params.sortOrder || 'desc');
    }

    if (params.submittedFrom) queryParams.append('submittedFrom', params.submittedFrom);
    if (params.submittedTo) queryParams.append('submittedTo', params.submittedTo);
    if (params.submittedById) queryParams.append('submittedById', params.submittedById);
    if (params.qualityGrade) queryParams.append('qualityGrade', params.qualityGrade);
    if (params.hasHighVariance !== undefined)
      queryParams.append('hasHighVariance', params.hasHighVariance.toString());
    if (params.customerApproved !== undefined)
      queryParams.append('customerApproved', params.customerApproved.toString());
    if (params.search) queryParams.append('search', params.search);

    return apiGet(`${SUBMISSIONS_URL}?${queryParams.toString()}`);
  },

  getById: async (id: string) => {
    return apiGet(`${SUBMISSIONS_URL}/${id}`);
  },

  getStats: async (): Promise<SubmissionStatsResponse> => {
    return apiGet(`${SUBMISSIONS_URL}/stats`);
  },

  updateApproval: async (id: string, approved: boolean, notes?: string) => {
    return apiPut(`${SUBMISSIONS_URL}/${id}/approval`, { approved, notes });
  },
};
