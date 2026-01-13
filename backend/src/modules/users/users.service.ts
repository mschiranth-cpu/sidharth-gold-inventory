import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CreateUserInput, UpdateUserInput, UserResponse } from './users.types';
import { ApiError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export class UsersService {
  /**
   * Get all users
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      role?: string;
      department?: string;
      isActive?: boolean;
    }
  ): Promise<{ users: UserResponse[]; total: number }> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.department) {
      where.department = filters.department;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users: users as UserResponse[], total };
  }

  /**
   * Get user by ID
   */
  async findById(id: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user as UserResponse | null;
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserInput): Promise<UserResponse> {
    // Check if email already exists
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ApiError(400, 'Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        department: data.department,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user as UserResponse;
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserInput): Promise<UserResponse> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }

    // If updating password, hash it
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
        department: data.department,
        phone: data.phone,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user as UserResponse;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }

    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Validate password
   */
  async validatePassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) return false;

    return bcrypt.compare(password, user.password);
  }
}

export const usersService = new UsersService();
