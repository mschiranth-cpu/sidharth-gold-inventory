import { z } from 'zod';

// Create user schema
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER']).optional(),
  department: z
    .enum([
      'CAD',
      'PRINT',
      'CASTING',
      'FILLING',
      'MEENA',
      'POLISH_1',
      'SETTING',
      'POLISH_2',
      'ADDITIONAL',
    ])
    .optional(),
  phone: z.string().optional(),
});

// Update user schema
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER']).optional(),
  department: z
    .enum([
      'CAD',
      'PRINT',
      'CASTING',
      'FILLING',
      'MEENA',
      'POLISH_1',
      'SETTING',
      'POLISH_2',
      'ADDITIONAL',
    ])
    .nullable()
    .optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
