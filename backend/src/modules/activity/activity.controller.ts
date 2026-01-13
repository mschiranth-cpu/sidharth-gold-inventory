/**
 * ============================================
 * ACTIVITY CONTROLLER
 * ============================================
 *
 * Controller for activity log endpoints
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import activityService from '../../services/activity.service';
import { logger } from '../../utils/logger';

/**
 * Get all activities for an order
 */
export const getOrderActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const activities = await activityService.getOrderActivities(orderId);

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    logger.error('Error fetching order activities', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
    });
  }
};

/**
 * Get activity summary for an order
 */
export const getActivitySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const summary = await activityService.getActivitySummary(orderId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Error fetching activity summary', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activity summary',
    });
  }
};
