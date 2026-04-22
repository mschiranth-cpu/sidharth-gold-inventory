/**
 * ============================================
 * FEATURE TOGGLE SERVICE
 * ============================================
 */

import api from './api';

export interface FeatureModule {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturePermission {
  id: string;
  featureId: string;
  userId?: string;
  role?: string;
  isEnabled: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export interface UserFeatures {
  [featureName: string]: {
    hasAccess: boolean;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
}

/**
 * Get current user's accessible features
 */
export async function getMyFeatures(): Promise<UserFeatures> {
  const response = await api.get('/features/my-features');
  return response.data.data;
}

/**
 * Get all feature modules (Admin only)
 */
export async function getAllFeatures(): Promise<FeatureModule[]> {
  const response = await api.get('/features');
  return response.data.data;
}

/**
 * Update feature permission (Admin only)
 */
export async function updateFeaturePermission(data: {
  featureId: string;
  userId?: string;
  role?: string;
  isEnabled: boolean;
  canRead?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
}) {
  const response = await api.post('/features/permissions', data);
  return response.data.data;
}

/**
 * Get permissions for a feature (Admin only)
 */
export async function getFeaturePermissions(featureId: string) {
  const response = await api.get(`/features/${featureId}/permissions`);
  return response.data.data;
}
