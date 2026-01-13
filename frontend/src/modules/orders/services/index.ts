import { apiGet, apiPost, apiPut, apiDelete } from '../../../services/api';
import { Order, ApiResponse } from '../../../types';
import { CreateOrderRequest, UpdateOrderRequest, OrderListParams } from '../types';

const ORDERS_URL = '/orders';

// Extended response type that includes the actual API response structure
interface OrdersApiResponse {
  success: boolean;
  message: string;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const ordersService = {
  getAll: async (params: OrderListParams): Promise<OrdersApiResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('limit', params.limit.toString());

    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
      queryParams.append('sortOrder', params.sortOrder || 'asc');
    }

    if (params.filters) {
      if (params.filters.status) queryParams.append('status', params.filters.status);
      if (params.filters.departmentId)
        queryParams.append('currentDepartment', params.filters.departmentId);
      if (params.filters.startDate) queryParams.append('createdFrom', params.filters.startDate);
      if (params.filters.endDate) queryParams.append('createdTo', params.filters.endDate);
      if (params.filters.search) queryParams.append('search', params.filters.search);
    }

    return apiGet(`${ORDERS_URL}?${queryParams.toString()}`);
  },

  getById: async (id: string): Promise<ApiResponse<Order>> => {
    return apiGet(`${ORDERS_URL}/${id}`);
  },

  getStats: async () => {
    return apiGet(`${ORDERS_URL}/stats`);
  },

  create: async (data: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    return apiPost(ORDERS_URL, data);
  },

  update: async (id: string, data: UpdateOrderRequest): Promise<ApiResponse<Order>> => {
    return apiPut(`${ORDERS_URL}/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiDelete(`${ORDERS_URL}/${id}`);
  },

  bulkDelete: async (ids: string[]): Promise<ApiResponse<void>> => {
    return apiDelete(`${ORDERS_URL}/bulk`, { data: { ids } });
  },

  exportOrders: async (ids: string[]): Promise<Blob> => {
    const response = await apiPost(`${ORDERS_URL}/export`, { ids }, { responseType: 'blob' });
    return response as unknown as Blob;
  },

  // Upload product photo
  uploadPhoto: async (orderId: string, photoUrl: string): Promise<ApiResponse<any>> => {
    return apiPost(`${ORDERS_URL}/${orderId}/photo`, { photoUrl });
  },

  // Add reference image
  addReferenceImage: async (orderId: string, imageUrl: string): Promise<ApiResponse<any>> => {
    return apiPost(`${ORDERS_URL}/${orderId}/reference-images`, { imageUrl });
  },

  // Add completion photo
  addCompletionPhoto: async (orderId: string, photoUrl: string): Promise<ApiResponse<any>> => {
    return apiPost(`${ORDERS_URL}/${orderId}/completion-photos`, { photoUrl });
  },
};
