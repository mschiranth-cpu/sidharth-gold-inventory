import { UserRole } from '../../../types';

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  departmentId?: string;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  departmentId?: string | null;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}
