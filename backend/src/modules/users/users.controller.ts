import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { generateToken } from '../../middleware/auth';
import { apiResponse } from '../../utils/helpers';
import { ApiError } from '../../middleware/errorHandler';

export class UsersController {
  /**
   * Get all users
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const department = req.query.department as string | undefined;
      const isActive =
        req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const { users, total } = await usersService.findAll(page, limit, {
        search,
        role,
        department,
        isActive,
      });

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersService.findById(id);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      apiResponse(res, 200, 'User retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new user
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.create(req.body);
      apiResponse(res, 201, 'User created successfully', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersService.update(id, req.body);
      apiResponse(res, 200, 'User updated successfully', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await usersService.delete(id);
      apiResponse(res, 200, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * User login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const isValid = await usersService.validatePassword(email, password);
      if (!isValid) {
        throw new ApiError(401, 'Invalid email or password');
      }

      const user = await usersService.findByEmail(email);
      if (!user || !user.isActive) {
        throw new ApiError(401, 'Account is inactive');
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
