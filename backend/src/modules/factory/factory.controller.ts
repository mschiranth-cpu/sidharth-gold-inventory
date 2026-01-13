/**
 * ============================================
 * FACTORY CONTROLLER
 * ============================================
 *
 * Controller for factory statistics and gold tracking.
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

import { Response, NextFunction } from 'express';
import { factoryService } from './factory.service';
import { apiResponse } from '../../utils/helpers';
import { ApiError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

export class FactoryController {
  /**
   * Get gold inventory (orders in factory)
   */
  async getGoldInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters = {
        departmentId: req.query.departmentId as string,
        status: req.query.status as string,
      };

      const { items, total } = await factoryService.getGoldInventory(page, limit, filters);

      res.json({
        success: true,
        message: 'Gold inventory retrieved successfully',
        data: items,
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
   * Get gold item by order ID
   */
  async getGoldItemById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const item = await factoryService.getGoldItemById(id);

      if (!item) {
        throw new ApiError(404, 'Order not found');
      }

      apiResponse(res, 200, 'Gold item retrieved successfully', item);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get factory statistics
   */
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await factoryService.getStats();
      apiResponse(res, 200, 'Factory statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get gold movements (department tracking history)
   */
  async getGoldMovements(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const orderId = req.query.orderId as string;

      const { movements, total } = await factoryService.getGoldMovements(page, limit, orderId);

      res.json({
        success: true,
        message: 'Gold movements retrieved successfully',
        data: movements,
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
   * Get all departments
   */
  async getDepartments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = [
        { id: 'CAD', name: 'CAD Design' },
        { id: 'PRINT', name: 'Printing' },
        { id: 'CASTING', name: 'Casting' },
        { id: 'FILLING', name: 'Filling' },
        { id: 'MEENA', name: 'Meena' },
        { id: 'POLISH_1', name: 'Polish 1' },
        { id: 'SETTING', name: 'Setting' },
        { id: 'POLISH_2', name: 'Polish 2' },
        { id: 'ADDITIONAL', name: 'Additional' },
      ];

      apiResponse(res, 200, 'Departments retrieved successfully', departments);
    } catch (error) {
      next(error);
    }
  }
}

export const factoryController = new FactoryController();
