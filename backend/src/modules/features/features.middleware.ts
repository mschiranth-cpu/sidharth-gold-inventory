/**
 * ============================================
 * FEATURE TOGGLE MIDDLEWARE
 * ============================================
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import { checkFeatureAccess } from './features.service';
import { logger } from '../../utils/logger';

/**
 * Middleware to check if user has access to a feature
 * Usage: requireFeature('CLIENT_PORTAL')
 */
export function requireFeature(featureName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Check feature access
      const access = await checkFeatureAccess(authReq.user.userId, featureName);

      if (!access.hasAccess) {
        logger.warn('Feature access denied', {
          userId: authReq.user.userId,
          feature: featureName,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'FEATURE_ACCESS_DENIED',
            message: `You do not have access to the ${featureName} feature`,
          },
        });
        return;
      }

      // Attach feature access to request for later use
      (authReq as any).featureAccess = access;

      next();
    } catch (error) {
      logger.error('Feature check error', { error, feature: featureName });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error checking feature access',
        },
      });
    }
  };
}

/**
 * Middleware to check if user has write access to a feature
 */
export function requireFeatureWrite(featureName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const access = await checkFeatureAccess(authReq.user.userId, featureName);

      if (!access.hasAccess || !access.canWrite) {
        logger.warn('Feature write access denied', {
          userId: authReq.user.userId,
          feature: featureName,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'FEATURE_WRITE_DENIED',
            message: `You do not have write access to the ${featureName} feature`,
          },
        });
        return;
      }

      (authReq as any).featureAccess = access;
      next();
    } catch (error) {
      logger.error('Feature write check error', { error, feature: featureName });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error checking feature write access',
        },
      });
    }
  };
}
