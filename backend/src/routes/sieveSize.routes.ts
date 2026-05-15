/**
 * Read-only routes serving the SieveSize master table to the frontend.
 *
 * Mounted at /api/sieve-sizes by `src/index.ts`.
 *
 * GET /api/sieve-sizes
 *   ?kind=MESH | SINGLE   (optional — filter to one kind)
 *   ?activeOnly=true|false (default true — hides retired rows)
 *
 * The list is small (currently 41 rows) and effectively immutable; we
 * return it as an unauthenticated list so the receive forms can hydrate
 * the picker before any user interaction. If the table ever grows or
 * needs row-level visibility, swap in `authenticate` here.
 */
import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { kind, activeOnly } = req.query;
  const where: Record<string, unknown> = {};

  if (typeof kind === 'string' && kind.length > 0) {
    if (kind !== 'MESH' && kind !== 'SINGLE') {
      return res.status(400).json({
        success: false,
        error: 'kind must be MESH or SINGLE',
      });
    }
    where.kind = kind;
  }

  // Default to active-only — explicitly opt-in to see retired rows.
  const showAll =
    typeof activeOnly === 'string' && activeOnly.toLowerCase() === 'false';
  if (!showAll) where.isActive = true;

  const rows = await prisma.sieveSize.findMany({
    where,
    orderBy: [{ kind: 'asc' }, { displayOrder: 'asc' }],
  });

  res.json({ success: true, data: rows });
});

export default router;
