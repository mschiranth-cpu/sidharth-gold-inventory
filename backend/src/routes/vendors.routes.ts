/**
 * ============================================
 * VENDORS ROUTES (CRUD + GST realtime lookup)
 * ============================================
 */
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRoles } from '../modules/auth/auth.middleware';
import { UserRole } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ---------- Helpers ----------
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli', '27': 'Maharashtra', '28': 'Andhra Pradesh',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman and Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh', '97': 'Other Territory', '99': 'Centre Jurisdiction',
};

/**
 * Lookup GSTIN. Tries external provider if `GST_API_KEY` is set,
 * otherwise returns structurally parsed info derived from the GSTIN itself
 * (state, embedded PAN, entity type) — always available offline.
 */
async function lookupGstin(gstin: string) {
  const clean = gstin.trim().toUpperCase();
  if (!GSTIN_REGEX.test(clean)) {
    return { ok: false, error: 'Invalid GSTIN format' };
  }

  const stateCode = clean.substring(0, 2);
  const pan = clean.substring(2, 12);
  const entityNumber = clean.substring(12, 13);

  const parsed = {
    gstin: clean,
    pan,
    stateCode,
    state: STATE_CODES[stateCode] || 'Unknown',
    entityNumber,
    legalName: null as string | null,
    tradeName: null as string | null,
    address: null as string | null,
    status: null as string | null,
    registrationDate: null as string | null,
    source: 'parsed' as 'parsed' | 'gstincheck' | 'mastergst',
  };

  // External provider (gstincheck.co.in) — only if API key configured.
  const apiKey = process.env.GST_API_KEY;
  const provider = process.env.GST_API_PROVIDER || 'gstincheck';
  if (apiKey) {
    try {
      const url =
        provider === 'mastergst'
          ? `https://commonapi.mastergst.com/commonapis/searchgstin?gstin=${clean}`
          : `https://sheet.gstincheck.co.in/check/${apiKey}/${clean}`;
      const headers: Record<string, string> =
        provider === 'mastergst' ? { 'client-id': apiKey, 'client-secret': apiKey } : {};
      const r = await fetch(url, { headers });
      if (r.ok) {
        const j: any = await r.json();
        const d = j.data || j.result || j;
        if (d) {
          parsed.legalName = d.lgnm || d.legalName || d.legal_name || null;
          parsed.tradeName = d.tradeNam || d.tradeName || d.trade_name || null;
          parsed.status = d.sts || d.status || null;
          parsed.registrationDate = d.rgdt || d.registrationDate || null;
          const addr = d.pradr?.adr || d.address || null;
          parsed.address = typeof addr === 'string' ? addr : null;
          parsed.source = provider as any;
        }
      }
    } catch (_e) {
      // Fallback silently to parsed info
    }
  }

  return { ok: true, data: parsed };
}

/**
 * Generate the next vendor unique code in the form `VEN-001`, `VEN-002`, …
 * Reads the highest existing numeric suffix and increments by 1.
 */
async function generateNextCode(): Promise<string> {
  const latest = await prisma.vendor.findMany({
    where: { uniqueCode: { startsWith: 'VEN-' } },
    select: { uniqueCode: true },
  });
  let max = 0;
  for (const v of latest) {
    const m = v.uniqueCode.match(/^VEN-(\d+)$/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return `VEN-${String(max + 1).padStart(3, '0')}`;
}

// ---------- Routes ----------

// All routes require auth
router.use(authenticate);

// GET /api/vendors  (list, optional ?search=)
router.get('/', async (req: Request, res: Response) => {
  const search = String(req.query.search || '').trim();
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { uniqueCode: { contains: search, mode: 'insensitive' as const } },
          { gstNumber: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }
    : {};
  const vendors = await prisma.vendor.findMany({ where, orderBy: { name: 'asc' } });
  res.json({ success: true, data: vendors });
});

// GET /api/vendors/next-code  (preview the next auto-generated unique code)
router.get('/next-code', async (_req: Request, res: Response) => {
  const code = await generateNextCode();
  res.json({ success: true, data: { uniqueCode: code } });
});

// GET /api/vendors/gst/:gstin  (realtime GST info — must precede /:id)
router.get('/gst/:gstin', async (req: Request, res: Response) => {
  const result = await lookupGstin(req.params.gstin);
  if (!result.ok) return res.status(400).json({ success: false, error: result.error });
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ success: true, data: result.data });
});

// GET /api/vendors/:id
router.get('/:id', async (req: Request, res: Response) => {
  const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
  if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });
  res.json({ success: true, data: vendor });
});

// POST /api/vendors
router.post(
  '/',
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  async (req: Request, res: Response) => {
    const { name, phone, gstNumber, address } = req.body || {};
    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }
    if (gstNumber && !GSTIN_REGEX.test(String(gstNumber).toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Invalid GSTIN format' });
    }
    let gstDetails: any = undefined;
    if (gstNumber) {
      const r = await lookupGstin(gstNumber);
      if (r.ok) gstDetails = r.data;
    }
    // Auto-generate unique code (with retry on the rare race condition)
    for (let attempt = 0; attempt < 5; attempt++) {
      const uniqueCode = await generateNextCode();
      try {
        const vendor = await prisma.vendor.create({
          data: {
            name: String(name).trim(),
            uniqueCode,
            phone: phone ? String(phone).trim() : null,
            gstNumber: gstNumber ? String(gstNumber).toUpperCase().trim() : null,
            gstDetails,
            address: address ? String(address).trim() : null,
          },
        });
        return res.status(201).json({ success: true, data: vendor });
      } catch (e: any) {
        if (e?.code === 'P2002' && attempt < 4) continue; // retry on collision
        throw e;
      }
    }
    return res.status(500).json({ success: false, error: 'Could not generate unique code' });
  }
);

// PUT /api/vendors/:id  (uniqueCode is immutable — ignored if sent)
router.put(
  '/:id',
  requireRoles(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  async (req: Request, res: Response) => {
    const { name, phone, gstNumber, address } = req.body || {};
    if (gstNumber && !GSTIN_REGEX.test(String(gstNumber).toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Invalid GSTIN format' });
    }
    let gstDetails: any = undefined;
    if (gstNumber) {
      const r = await lookupGstin(gstNumber);
      if (r.ok) gstDetails = r.data;
    }
    try {
      const vendor = await prisma.vendor.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined ? { name: String(name).trim() } : {}),
          ...(phone !== undefined ? { phone: phone ? String(phone).trim() : null } : {}),
          ...(gstNumber !== undefined
            ? {
                gstNumber: gstNumber ? String(gstNumber).toUpperCase().trim() : null,
                gstDetails: gstDetails ?? null,
              }
            : {}),
          ...(address !== undefined ? { address: address ? String(address).trim() : null } : {}),
        },
      });
      res.json({ success: true, data: vendor });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        return res.status(409).json({ success: false, error: 'Unique code already exists' });
      }
      if (e?.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Vendor not found' });
      }
      throw e;
    }
  }
);

// DELETE /api/vendors/:id
router.delete(
  '/:id',
  requireRoles(UserRole.ADMIN),
  async (req: Request, res: Response) => {
    try {
      await prisma.vendor.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e: any) {
      if (e?.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Vendor not found' });
      }
      throw e;
    }
  }
);

export default router;
