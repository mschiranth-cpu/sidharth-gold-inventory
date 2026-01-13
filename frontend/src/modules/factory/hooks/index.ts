/**
 * ============================================
 * FACTORY HOOKS
 * ============================================
 *
 * React Query hooks for factory statistics and gold tracking.
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { factoryService } from '../services';
import { GoldInventoryFilters } from '../types';

const FACTORY_KEY = 'factory';

/**
 * Hook to fetch factory statistics
 */
export const useFactoryStats = () => {
  return useQuery({
    queryKey: [FACTORY_KEY, 'stats'],
    queryFn: () => factoryService.getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch gold inventory (orders in factory)
 */
export const useGoldInventory = (page = 1, limit = 10, filters?: GoldInventoryFilters) => {
  return useQuery({
    queryKey: [FACTORY_KEY, 'inventory', page, limit, filters],
    queryFn: () => factoryService.getGoldInventory(page, limit, filters),
  });
};

/**
 * Hook to fetch a single gold item by order ID
 */
export const useGoldItem = (id: string) => {
  return useQuery({
    queryKey: [FACTORY_KEY, 'inventory', id],
    queryFn: () => factoryService.getGoldItemById(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch gold movements
 */
export const useGoldMovements = (page = 1, limit = 20, orderId?: string) => {
  return useQuery({
    queryKey: [FACTORY_KEY, 'movements', page, limit, orderId],
    queryFn: () => factoryService.getGoldMovements(page, limit, orderId),
  });
};

// Legacy exports for backward compatibility
export const useInventory = useGoldInventory;
export const useInventoryItem = useGoldItem;
export const useInventoryStats = useFactoryStats;
