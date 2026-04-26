import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { getDashboardOverview, getWorkerOverview } from './dashboard.service';
import type { DashboardRange } from './dashboard.types';

const VALID_RANGES: DashboardRange[] = ['today', '7d', '30d', 'custom'];

export const handleGetOverview = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const rangeParam = (req.query.range as string) || 'today';
    if (!VALID_RANGES.includes(rangeParam as DashboardRange)) {
      return res.status(400).json({ success: false, message: `Invalid range. Use one of: ${VALID_RANGES.join(', ')}` });
    }
    const data = await getDashboardOverview(
      rangeParam as DashboardRange,
      req.query.from as string | undefined,
      req.query.to as string | undefined,
      req.user.userId
    );
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Dashboard overview failed', { error: error?.message });
    if (error?.message?.includes('Invalid') || error?.message?.includes('before')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to load dashboard overview' });
  }
};

export const handleGetWorkerOverview = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const data = await getWorkerOverview(req.user.userId);
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Worker overview failed', { error: error?.message });
    return res.status(500).json({ success: false, message: 'Failed to load worker overview' });
  }
};
