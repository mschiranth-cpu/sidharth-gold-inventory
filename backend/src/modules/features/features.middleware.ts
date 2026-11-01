import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../auth/auth.types';
import { checkFeatureAccess, getRoleFeatureAccess } from './features.service';
import { logger } from '../../utils/logger';

/** Additional module restriction: does not replace authentication, RBAC or ownership. */
export function requireFeature(featureName: string, options: { publicRole?: UserRole; capability?: 'canWrite' } = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user && !options.publicRole) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
        return;
      }
      const access = user ? await checkFeatureAccess(user.userId, featureName) : await getRoleFeatureAccess(options.publicRole!, featureName);
      const capability = options.capability ?? (req.method === 'DELETE' ? 'canDelete' : ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? 'canRead' : 'canWrite');
      if (!access.hasAccess || !access[capability]) {
        res.status(403).json({ success: false, error: { code: 'FEATURE_ACCESS_DENIED', message: 'This module or operation is disabled for your account.' } });
        return;
      }
      (req as AuthenticatedRequest & { featureAccess: typeof access }).featureAccess = access;
      next();
    } catch (error) {
      logger.error('Feature access check failed', { error });
      res.status(500).json({ success: false, error: { code: 'FEATURE_CHECK_FAILED', message: 'Unable to check module access. Please try again.' } });
    }
  };
}

export function requireFeatureWrite(featureName: string) {
  return requireFeature(featureName, { capability: 'canWrite' });
}
