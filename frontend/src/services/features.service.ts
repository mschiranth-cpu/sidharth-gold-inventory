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
export async function getAllFeatures(): Promise<FeatureCatalogItem[]> {
  const response = await api.get('/features');
  return response.data.data;
}

/**
 * Update feature permission (Admin only)
 */
export async function updateFeaturePermission(data: {
  featureId: string;
  scope?: FeatureScope;
  userId?: string;
  role?: string;
  departmentId?: string;
  inherit?: boolean;
  isEnabled?: boolean;
  canRead?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
}) {
  const response = await api.post('/features/permissions', data);
  return response.data.data;
}

export type FeatureScope = { type: 'role' | 'user' | 'department'; id: string };
export type FeatureAccessSource = 'admin' | 'user' | 'department' | 'role' | 'global' | 'default';
export type FeatureCapabilities = { isEnabled: boolean; canRead: boolean; canWrite: boolean; canDelete: boolean };
export type ScopedFeaturePermission = FeaturePermission & { departmentId?: string };
export interface FeatureCatalogItem {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  isGlobal: boolean;
  isConfigured: boolean;
  permissions: ScopedFeaturePermission[];
  override: ScopedFeaturePermission | null;
  effective: UserFeatures[string] & { source: FeatureAccessSource };
}
export interface FeatureSubjects {
  roles: string[];
  users: { id: string; name: string; role: string; department: string | null }[];
  departments: { id: string; name: string }[];
}
export interface FeatureAuditValues {
  featureName?: string;
  scope?: FeatureScope;
  permission?: FeatureCapabilities | null;
}
export interface FeatureAuditItem {
  id: string;
  action: string;
  actorName?: string;
  userId?: string;
  createdAt: string;
  oldValues?: FeatureAuditValues | null;
  newValues?: FeatureAuditValues | null;
}
export interface FeatureAuditPage { items: FeatureAuditItem[]; nextCursor: string | null }

export async function getFeatureCatalog(scope: FeatureScope): Promise<FeatureCatalogItem[]> {
  const response = await api.get('/features', { params: { scope: scope.type, target: scope.id } });
  return response.data.data;
}

export async function getFeatureSubjects(): Promise<FeatureSubjects> {
  const response = await api.get('/features/subjects');
  return response.data.data;
}

export async function bulkUpdateFeaturePermissions(data: {
  scope: FeatureScope;
  featureIds: string[];
  inherit?: boolean;
  isEnabled?: boolean;
  canRead?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
}) {
  const response = await api.post('/features/permissions/bulk', data);
  return response.data.data;
}

export async function getFeatureAudit(cursor?: string): Promise<FeatureAuditPage> {
  const response = await api.get('/features/audit', { params: { limit: 25, ...(cursor ? { cursor } : {}) } });
  return response.data.data;
}

/**
 * Get permissions for a feature (Admin only)
 */
export async function getFeaturePermissions(featureId: string) {
  const response = await api.get(`/features/${featureId}/permissions`);
  return response.data.data;
}
