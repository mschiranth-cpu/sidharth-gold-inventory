/**
 * ============================================
 * FEATURE TOGGLE TYPES
 * ============================================
 */

import { UserRole } from '@prisma/client';

export interface FeatureModuleData {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeaturePermissionData {
  id: string;
  featureId: string;
  userId?: string;
  role?: UserRole;
  departmentId?: string;
  isEnabled: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  enabledById?: string;
  enabledAt: Date;
}

export interface CreateFeatureModuleRequest {
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  isGlobal?: boolean;
}

export interface UpdateFeaturePermissionRequest {
  featureId: string;
  scope?: FeatureScope;
  userId?: string;
  role?: UserRole;
  departmentId?: string;
  isEnabled?: boolean;
  canRead?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  inherit?: boolean;
}

export interface FeatureScope {
  type: 'role' | 'user' | 'department';
  id: string;
}

export interface BulkFeaturePermissionRequest extends Omit<UpdateFeaturePermissionRequest, 'featureId'> {
  featureIds: string[];
}

export interface FeatureAccessCheck {
  hasAccess: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  source?: 'admin' | 'user' | 'department' | 'role' | 'global' | 'default';
}

export interface UserFeatures {
  [featureName: string]: FeatureAccessCheck;
}
