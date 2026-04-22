/**
 * ============================================
 * FEATURE TOGGLE SERVICE
 * ============================================
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { logger } from '../../utils/logger';
import {
  CreateFeatureModuleRequest,
  UpdateFeaturePermissionRequest,
  FeatureAccessCheck,
  UserFeatures,
} from './features.types';

const prisma = new PrismaClient();

/**
 * Get all feature modules
 */
export async function getAllFeatureModules() {
  return await prisma.featureModule.findMany({
    include: {
      permissions: true,
    },
    orderBy: {
      displayName: 'asc',
    },
  });
}

/**
 * Get feature module by name
 */
export async function getFeatureModuleByName(name: string) {
  return await prisma.featureModule.findUnique({
    where: { name },
    include: {
      permissions: true,
    },
  });
}

/**
 * Create a new feature module
 */
export async function createFeatureModule(data: CreateFeatureModuleRequest, createdById: string) {
  return await prisma.featureModule.create({
    data: {
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      icon: data.icon,
      isGlobal: data.isGlobal || false,
    },
  });
}

/**
 * Update feature permission for a user/role/department
 */
export async function updateFeaturePermission(
  data: UpdateFeaturePermissionRequest,
  enabledById: string
) {
  const { featureId, userId, role, departmentId, isEnabled, canRead, canWrite, canDelete } = data;

  // Check if permission already exists
  const existing = await prisma.featurePermission.findFirst({
    where: {
      featureId,
      ...(userId && { userId }),
      ...(role && { role }),
      ...(departmentId && { departmentId }),
    },
  });

  if (existing) {
    // Update existing permission
    return await prisma.featurePermission.update({
      where: { id: existing.id },
      data: {
        isEnabled,
        canRead: canRead ?? true,
        canWrite: canWrite ?? false,
        canDelete: canDelete ?? false,
        enabledById,
      },
    });
  } else {
    // Create new permission
    return await prisma.featurePermission.create({
      data: {
        featureId,
        userId,
        role,
        departmentId,
        isEnabled,
        canRead: canRead ?? true,
        canWrite: canWrite ?? false,
        canDelete: canDelete ?? false,
        enabledById,
      },
    });
  }
}

/**
 * Check if a user has access to a feature
 */
export async function checkFeatureAccess(
  userId: string,
  featureName: string
): Promise<FeatureAccessCheck> {
  // Get feature module
  const feature = await prisma.featureModule.findUnique({
    where: { name: featureName },
  });

  if (!feature) {
    return { hasAccess: false, canRead: false, canWrite: false, canDelete: false };
  }

  // If feature is global, everyone has access
  if (feature.isGlobal) {
    return { hasAccess: true, canRead: true, canWrite: false, canDelete: false };
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, department: true },
  });

  if (!user) {
    return { hasAccess: false, canRead: false, canWrite: false, canDelete: false };
  }

  // Check for user-specific permission first
  const userPermission = await prisma.featurePermission.findFirst({
    where: {
      featureId: feature.id,
      userId: userId,
    },
  });

  if (userPermission) {
    return {
      hasAccess: userPermission.isEnabled,
      canRead: userPermission.canRead,
      canWrite: userPermission.canWrite,
      canDelete: userPermission.canDelete,
    };
  }

  // Check for role-based permission
  const rolePermission = await prisma.featurePermission.findFirst({
    where: {
      featureId: feature.id,
      role: user.role,
    },
  });

  if (rolePermission) {
    return {
      hasAccess: rolePermission.isEnabled,
      canRead: rolePermission.canRead,
      canWrite: rolePermission.canWrite,
      canDelete: rolePermission.canDelete,
    };
  }

  // No permission found - deny access
  return { hasAccess: false, canRead: false, canWrite: false, canDelete: false };
}

/**
 * Get all features accessible by a user
 */
export async function getUserFeatures(userId: string): Promise<UserFeatures> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, department: true },
  });

  if (!user) {
    return {};
  }

  // Get all feature modules
  const features = await prisma.featureModule.findMany({
    include: {
      permissions: {
        where: {
          OR: [{ userId: userId }, { role: user.role }],
        },
      },
    },
  });

  const userFeatures: UserFeatures = {};

  for (const feature of features) {
    // If global, grant access
    if (feature.isGlobal) {
      userFeatures[feature.name] = {
        hasAccess: true,
        canRead: true,
        canWrite: false,
        canDelete: false,
      };
      continue;
    }

    // Check user-specific permission first
    const userPerm = feature.permissions.find((p) => p.userId === userId);
    if (userPerm) {
      userFeatures[feature.name] = {
        hasAccess: userPerm.isEnabled,
        canRead: userPerm.canRead,
        canWrite: userPerm.canWrite,
        canDelete: userPerm.canDelete,
      };
      continue;
    }

    // Check role-based permission
    const rolePerm = feature.permissions.find((p) => p.role === user.role);
    if (rolePerm) {
      userFeatures[feature.name] = {
        hasAccess: rolePerm.isEnabled,
        canRead: rolePerm.canRead,
        canWrite: rolePerm.canWrite,
        canDelete: rolePerm.canDelete,
      };
      continue;
    }

    // No permission - deny access
    userFeatures[feature.name] = {
      hasAccess: false,
      canRead: false,
      canWrite: false,
      canDelete: false,
    };
  }

  return userFeatures;
}

/**
 * Get permissions for a specific feature
 */
export async function getFeaturePermissions(featureId: string) {
  return await prisma.featurePermission.findMany({
    where: { featureId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Delete a feature permission
 */
export async function deleteFeaturePermission(permissionId: string) {
  return await prisma.featurePermission.delete({
    where: { id: permissionId },
  });
}
