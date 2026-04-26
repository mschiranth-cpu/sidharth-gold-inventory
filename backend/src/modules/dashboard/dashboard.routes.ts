import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { handleGetOverview, handleGetWorkerOverview } from './dashboard.controller';

const router = Router();

router.get(
  '/overview',
  authenticate,
  authorize('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'),
  handleGetOverview
);
router.get(
  '/worker-overview',
  authenticate,
  authorize('DEPARTMENT_WORKER'),
  handleGetWorkerOverview
);

export default router;
