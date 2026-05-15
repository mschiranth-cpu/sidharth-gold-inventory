/**
 * Diamond Purchase Order routes — mounted at /api/diamond-purchase-orders.
 *
 * Endpoints:
 *   POST   /                  — create PO (DRAFT or PLACED)
 *   GET    /                  — list (filter by vendorId, status)
 *   GET    /:id               — detail with lines + variance
 *   PUT    /:id               — edit notes/dueDate/expectedDelivery; lines only in DRAFT
 *   POST   /:id/place         — DRAFT → PLACED transition
 *   POST   /:id/cancel        — soft-cancel; ?force=true required if receives exist
 *   POST   /:id/receive       — create Diamond + DiamondTransaction rows from PO lines
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate, requireRoles } from '../auth/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  createDiamondPO,
  listDiamondPOs,
  getDiamondPO,
  updateDiamondPO,
  placeDiamondPO,
  cancelDiamondPO,
  receiveAgainstPo,
  PO_STATUSES,
  type PoStatus,
} from './diamondPurchaseOrder.service';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

const requireAdminOrOffice = requireRoles(
  UserRole.ADMIN,
  UserRole.OFFICE_STAFF
);

function getUserId(req: Request): string {
  const id = (req as any).user?.id;
  if (!id) throw new ApiError(401, 'Unauthenticated');
  return id;
}

router.post(
  '/',
  requireAdminOrOffice,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const po = await createDiamondPO(req.body, getUserId(req));
      res.status(201).json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/',
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as PoStatus | undefined;
      if (status && !PO_STATUSES.includes(status as PoStatus)) {
        throw new ApiError(400, `Invalid status: ${status}`);
      }
      const pos = await listDiamondPOs({
        vendorId:
          typeof req.query.vendorId === 'string' ? req.query.vendorId : undefined,
        status,
      });
      res.json({ success: true, data: pos });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const po = await getDiamondPO(req.params.id);
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  requireAdminOrOffice,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const po = await updateDiamondPO(req.params.id, req.body);
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/place',
  requireAdminOrOffice,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const po = await placeDiamondPO(req.params.id);
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/cancel',
  requireAdminOrOffice,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const force = String(req.query.force ?? '').toLowerCase() === 'true';
      const po = await cancelDiamondPO(req.params.id, getUserId(req), {
        reason: req.body?.reason,
        force,
      });
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/receive',
  requireAdminOrOffice,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await receiveAgainstPo(
        req.params.id,
        req.body,
        getUserId(req)
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
