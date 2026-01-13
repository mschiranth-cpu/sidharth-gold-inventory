/**
 * ============================================
 * USER MANAGEMENT SERVICE (Frontend)
 * ============================================
 * 
 * API service for user CRUD operations.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../../../services/api';
import {
  User,
  UserFilters,
  UserListResponse,
  UserResponse,
  UserStatsResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  ToggleStatusRequest,
} from '../../../types/user.types';

const USERS_URL = '/users';

/**
 * Build query string from filters
 */
const buildQueryString = (filters: UserFilters): string => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.role) params.append('role', filters.role);
  if (filters.department) params.append('department', filters.department);
  if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  return params.toString();
};

export const usersService = {
  /**
   * Get all users with filtering
   */
  getAll: async (filters: UserFilters = {}): Promise<UserListResponse> => {
    const queryString = buildQueryString(filters);
    return apiGet(`${USERS_URL}?${queryString}`);
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<UserResponse> => {
    return apiGet(`${USERS_URL}/${id}`);
  },

  /**
   * Get user statistics
   */
  getStats: async (): Promise<UserStatsResponse> => {
    return apiGet(`${USERS_URL}/stats`);
  },

  /**
   * Get all workers (for dropdowns)
   */
  getWorkers: async (department?: string): Promise<{ success: boolean; data: User[] }> => {
    const url = department 
      ? `${USERS_URL}/workers?department=${department}` 
      : `${USERS_URL}/workers`;
    return apiGet(url);
  },

  /**
   * Create new user
   */
  create: async (data: CreateUserRequest): Promise<UserResponse> => {
    return apiPost(USERS_URL, data);
  },

  /**
   * Update user
   */
  update: async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
    return apiPut(`${USERS_URL}/${id}`, data);
  },

  /**
   * Toggle user active status
   */
  toggleStatus: async (id: string, data: ToggleStatusRequest): Promise<UserResponse> => {
    return apiPatch(`${USERS_URL}/${id}/status`, data);
  },

  /**
   * Reset user password
   */
  resetPassword: async (id: string, data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> => {
    return apiPost(`${USERS_URL}/${id}/reset-password`, data);
  },

  /**
   * Delete (deactivate) user
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiDelete(`${USERS_URL}/${id}`);
  },
};
