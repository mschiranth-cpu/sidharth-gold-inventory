/**
 * ============================================
 * FACTORY INVENTORY SERVICE
 * ============================================
 */

import api from './api';

export interface FactoryItemCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: string;
}

export interface FactoryItem {
  id: string;
  itemCode: string;
  name: string;
  description?: string;
  categoryId: string;
  unit: string;
  currentStock: number;
  minStock?: number;
  maxStock?: number;
  isEquipment: boolean;
  location?: string;
  createdAt: string;
}

export async function getAllCategories(): Promise<FactoryItemCategory[]> {
  const response = await api.get('/factory-inventory/categories');
  return response.data.data;
}

export async function createCategory(data: any) {
  const response = await api.post('/factory-inventory/categories', data);
  return response.data.data;
}

export async function getAllFactoryItems(filters?: any): Promise<FactoryItem[]> {
  const response = await api.get('/factory-inventory/items', { params: filters });
  return response.data.data;
}

export async function getFactoryItemById(itemId: string) {
  const response = await api.get(`/factory-inventory/items/${itemId}`);
  return response.data.data;
}

export async function createFactoryItem(data: any) {
  const response = await api.post('/factory-inventory/items', data);
  return response.data.data;
}

export async function updateFactoryItem(itemId: string, data: any) {
  const response = await api.put(`/factory-inventory/items/${itemId}`, data);
  return response.data.data;
}

export async function createFactoryItemTransaction(data: any) {
  const response = await api.post('/factory-inventory/transactions', data);
  return response.data.data;
}

export async function getEquipmentMaintenance(equipmentId?: string) {
  const response = await api.get('/factory-inventory/maintenance', { params: { equipmentId } });
  return response.data.data;
}

export async function createEquipmentMaintenance(data: any) {
  const response = await api.post('/factory-inventory/maintenance', data);
  return response.data.data;
}
