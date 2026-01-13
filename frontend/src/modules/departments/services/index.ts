import { apiGet, apiPost, apiPut, apiDelete } from '../../../services/api';
import { Department, PaginatedResponse, ApiResponse } from '../../../types';
import { CreateDepartmentRequest, UpdateDepartmentRequest } from '../types';

const DEPARTMENTS_URL = '/departments';

export const departmentsService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Department>> => {
    return apiGet(`${DEPARTMENTS_URL}?page=${page}&limit=${limit}`);
  },

  getById: async (id: string): Promise<ApiResponse<Department>> => {
    return apiGet(`${DEPARTMENTS_URL}/${id}`);
  },

  create: async (data: CreateDepartmentRequest): Promise<ApiResponse<Department>> => {
    return apiPost(DEPARTMENTS_URL, data);
  },

  update: async (id: string, data: UpdateDepartmentRequest): Promise<ApiResponse<Department>> => {
    return apiPut(`${DEPARTMENTS_URL}/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiDelete(`${DEPARTMENTS_URL}/${id}`);
  },
};
