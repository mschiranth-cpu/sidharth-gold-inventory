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
  userId?: string;
  role?: UserRole;
  departmentId?: string;
  isEnabled: boolean;
  canRead?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
}

export interface FeatureAccessCheck {
  hasAccess: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export interface UserFeatures {
  [featureName: string]: FeatureAccessCheck;
}
