/**
 * ============================================
 * FACTORY SERVICE
 * ============================================
 *
 * API service for factory statistics and gold tracking.
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

import { apiGet } from '../../../services/api';
import { PaginatedResponse, ApiResponse } from '../../../types';
import { FactoryStats, GoldInventoryItem, GoldInventoryFilters, GoldMovement } from '../types';

const FACTORY_URL = '/factory';

export const factoryService = {
  /**
   * Get factory statistics
   */
  getStats: async (): Promise<ApiResponse<FactoryStats>> => {
    return apiGet(`${FACTORY_URL}/stats`);
  },

  /**
   * Get gold inventory (orders in factory)
   */
  getGoldInventory: async (
    page = 1,
    limit = 10,
    filters?: GoldInventoryFilters
  ): Promise<PaginatedResponse<GoldInventoryItem>> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.status) params.append('status', filters.status);

    return apiGet(`${FACTORY_URL}/inventory?${params.toString()}`);
  },

  /**
   * Get gold item by order ID
   */
  getGoldItemById: async (id: string): Promise<ApiResponse<GoldInventoryItem>> => {
    return apiGet(`${FACTORY_URL}/inventory/${id}`);
  },

  /**
   * Get gold movements (department tracking history)
   */
  getGoldMovements: async (
    page = 1,
    limit = 20,
    orderId?: string
  ): Promise<PaginatedResponse<GoldMovement>> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (orderId) params.append('orderId', orderId);

    return apiGet(`${FACTORY_URL}/movements?${params.toString()}`);
  },
};
