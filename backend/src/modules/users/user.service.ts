/**
 * ============================================
 * USER MANAGEMENT SERVICE
 * ============================================
 *
 * Service layer for user CRUD operations.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { PrismaClient, UserRole, DepartmentName } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  CreateUserInput,
  UpdateUserInput,
  UserResponse,
  UserFilters,
  PaginatedUsersResponse,
  UserStats,
} from './user.types';

const prisma = new PrismaClient();

// ============================================
// USER SELECT FIELDS (exclude password)
// ============================================

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  phone: true,
  avatar: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

// ============================================
// SERVICE CLASS
// ============================================

class UserService {
  /**
   * Get all users with filtering and pagination
   */
  async findAll(filters: UserFilters): Promise<PaginatedUsersResponse> {
    const {
      search,
      role,
      department,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (department) {
      where.department = department;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users as UserResponse[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async findById(id: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    return user as UserResponse | null;
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });

    return user as UserResponse | null;
  }

  /**
   * Create new user
   */
  async create(data: CreateUserInput): Promise<UserResponse> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: data.role,
        department: data.department || null,
        phone: data.phone || null,
      },
      select: userSelect,
    });

    return user as UserResponse;
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserInput): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check email uniqueness if updating email
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email.toLowerCase() }),
        ...(data.role && { role: data.role }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      select: userSelect,
    });

    return user as UserResponse;
  }

  /**
   * Toggle user active status
   */
  async toggleStatus(id: string, isActive: boolean): Promise<UserResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: userSelect,
    });

    return user as UserResponse;
  }

  /**
   * Reset user password (admin only)
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Delete user (hard delete - permanently remove)
   */
  async delete(id: string): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Hard delete - permanently remove from database
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<UserStats> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsers, activeUsers, inactiveUsers, recentLogins, roleStats] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({
        where: {
          lastLoginAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);

    // Convert role stats to Record
    const byRole: Record<UserRole, number> = {
      ADMIN: 0,
      OFFICE_STAFF: 0,
      FACTORY_MANAGER: 0,
      DEPARTMENT_WORKER: 0,
    };

    roleStats.forEach((stat) => {
      byRole[stat.role] = stat._count.role;
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      byRole,
      recentLogins,
    };
  }

  /**
   * Get all workers for a department
   */
  async getWorkersByDepartment(department: DepartmentName): Promise<UserResponse[]> {
    const workers = await prisma.user.findMany({
      where: {
        department,
        isActive: true,
        role: { in: ['DEPARTMENT_WORKER', 'FACTORY_MANAGER'] },
      },
      select: userSelect,
      orderBy: { name: 'asc' },
    });

    return workers as UserResponse[];
  }

  /**
   * Get all active workers
   */
  async getAllWorkers(): Promise<UserResponse[]> {
    const workers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ['DEPARTMENT_WORKER', 'FACTORY_MANAGER'] },
      },
      select: userSelect,
      orderBy: { name: 'asc' },
    });

    return workers as UserResponse[];
  }
}

// Export singleton instance
export const userService = new UserService();
