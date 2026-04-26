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

// In-memory LRU-ish cache for live GST API hits (saves provider quota).
// Only caches successful enriched responses; parsed-only is cheap to recompute.
// TTL: 24h. Capacity: 500 entries (FIFO eviction).
const GST_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const GST_CACHE_MAX = 500;
const gstCache = new Map<string, { expiresAt: number; data: any }>();
function gstCacheGet(key: string): any | null {
  const e = gstCache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { gstCache.delete(key); return null; }
  // refresh recency
  gstCache.delete(key);
  gstCache.set(key, e);
  return e.data;
}
function gstCacheSet(key: string, data: any) {
  if (gstCache.size >= GST_CACHE_MAX) {
    const firstKey = gstCache.keys().next().value;
    if (firstKey !== undefined) gstCache.delete(firstKey);
  }
  gstCache.set(key, { expiresAt: Date.now() + GST_CACHE_TTL_MS, data });
}

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

  const provider = process.env.GST_API_PROVIDER || 'gstincheck';
  const cacheKey = `${provider}:${clean}`;
  const cached = gstCacheGet(cacheKey);
  if (cached) return { ok: true, data: cached };

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
    city: null as string | null,
    pincode: null as string | null,
    status: null as string | null,
    registrationDate: null as string | null,
    businessType: null as string | null,
    addressParts: null as null | {
      buildingNumber?: string;
      buildingName?: string;
      floorNumber?: string;
      street?: string;
      locality?: string;
      location?: string;
      district?: string;
      stateCode?: string;
      pincode?: string;
    },
    // Compliance / classification
    taxType: null as string | null,
    natureOfBusinessActivity: null as string[] | null,
    eInvoiceStatus: null as string | null,
    lastUpdateDate: null as string | null,
    cancelledDate: null as string | null,
    centerJurisdiction: null as string | null,
    stateJurisdiction: null as string | null,
    source: 'parsed' as 'parsed' | 'gstincheck' | 'mastergst' | 'rapidapi' | 'rapidapi-tool' | 'manual',
    notice: undefined as string | undefined,
  };

  // External provider — only if API key configured.
  // Supported: gstincheck (default), mastergst, rapidapi (GST Insights API),
  //            rapidapi-tool (Powerful GSTIN Tool API)
  const apiKey = process.env.GST_API_KEY;
  if (apiKey) {
    try {
      if (provider === 'rapidapi-tool') {
        const rapidHost = 'powerful-gstin-tool.p.rapidapi.com';
        const url = `https://${rapidHost}/v1/gstin/${clean}/details`;
        const r = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': rapidHost,
          },
          signal: AbortSignal.timeout(15000),
        });
        if (r.status === 401 || r.status === 403) {
          console.warn('[GST] rapidapi-tool auth failed', r.status);
          parsed.notice = 'GST API authentication failed — showing structural data';
        } else if (r.status === 429) {
          console.warn('[GST] rapidapi-tool rate-limited');
          parsed.notice = 'GST API quota exhausted — showing structural data';
        } else if (r.ok) {
          const j: any = await r.json();
          const d = j?.data;
          if (d && typeof d === 'object') {
            parsed.legalName = d.legal_name || null;
            parsed.tradeName = d.trade_name || d.legal_name || null;
            parsed.status = d.status || null;
            parsed.registrationDate = d.registration_date || null;
            parsed.businessType = d.business_constitution || null;
            parsed.taxType = d.type || null;
            parsed.natureOfBusinessActivity = Array.isArray(d.business_activity_nature)
              ? d.business_activity_nature.filter(Boolean)
              : null;
            parsed.cancelledDate = d.cancellation_date || null;
            parsed.centerJurisdiction = d.centre_jurisdiction || d.centre_jurisdiction_code || null;
            parsed.stateJurisdiction = d.state_jurisdiction || d.state_jurisdiction_code || null;
            const addr = (d?.place_of_business_principal?.address || {}) as Record<string, string>;
            const ap: typeof parsed.addressParts = {
              buildingNumber: addr.door_num || undefined,
              buildingName: addr.building_name || undefined,
              floorNumber: addr.floor_num || undefined,
              street: addr.street || undefined,
              locality: addr.location || undefined,
              location: addr.location || undefined,
              district: addr.district || undefined,
              stateCode: addr.state || undefined,
              pincode: addr.pin_code || undefined,
            };
            parsed.addressParts = ap;
            const flat = [
              addr.door_num,
              addr.building_name,
              addr.floor_num,
              addr.street,
              addr.location,
              addr.district,
              addr.state,
              addr.pin_code,
            ]
              .filter(Boolean)
              .join(', ');
            parsed.address = flat || null;
            parsed.city = addr.district || addr.location || null;
            parsed.pincode = addr.pin_code || null;
            parsed.source = 'rapidapi-tool';
          }
        }
      } else if (provider === 'rapidapi') {
        const rapidHost = 'gst-insights-api.p.rapidapi.com';
        const url = `https://${rapidHost}/getGSTDetailsUsingGST/${clean}`;
        const r = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': rapidHost,
          },
          signal: AbortSignal.timeout(15000),
        });
        if (r.status === 401 || r.status === 403) {
          console.warn('[GST] RapidAPI auth failed', r.status);
          parsed.notice = 'GST API authentication failed — showing structural data';
        } else if (r.status === 429) {
          console.warn('[GST] RapidAPI rate-limited');
          parsed.notice = 'GST API quota exhausted — showing structural data';
        } else if (r.ok) {
          const j: any = await r.json();
          if (j?.success && Array.isArray(j.data) && j.data[0]) {
            const d = j.data[0];
            parsed.legalName = d.legalName || null;
            parsed.tradeName = d.tradeName || d.legalName || null;
            parsed.status = d.status || null;
            parsed.registrationDate = d.registrationDate || null;
            parsed.businessType = d.constitutionOfBusiness || null;
            parsed.taxType = d.taxType || null;
            parsed.natureOfBusinessActivity = Array.isArray(d.natureOfBusinessActivity)
              ? d.natureOfBusinessActivity.filter(Boolean)
              : null;
            parsed.eInvoiceStatus = d.eInvoiceStatus || null;
            parsed.lastUpdateDate = d.lastUpdateDate || null;
            parsed.cancelledDate = d.cancelledDate || null;
            parsed.centerJurisdiction = d.centerJurisdiction || d.centerJurisdictionCode || null;
            parsed.stateJurisdiction = d.stateJurisdiction || d.stateJurisdictionCode || null;
            const addr = (d?.principalAddress?.address || {}) as Record<string, string>;
            const ap: typeof parsed.addressParts = {
              buildingNumber: addr.buildingNumber || undefined,
              buildingName: addr.buildingName || undefined,
              floorNumber: addr.floorNumber || undefined,
              street: addr.street || undefined,
              locality: addr.locality || undefined,
              location: addr.location || undefined,
              district: addr.district || undefined,
              stateCode: addr.stateCode || undefined,
              pincode: addr.pincode || undefined,
            };
            parsed.addressParts = ap;
            const flat = [
              addr.buildingNumber,
              addr.buildingName,
              addr.floorNumber,
              addr.street,
              addr.locality,
              addr.location,
              addr.district,
              addr.stateCode,
              addr.pincode,
            ]
              .filter(Boolean)
              .join(', ');
            parsed.address = flat || null;
            parsed.city = addr.district || addr.location || null;
            parsed.pincode = addr.pincode || null;
            parsed.source = 'rapidapi';
          }
        }
      } else {
        const url =
          provider === 'mastergst'
            ? `https://commonapi.mastergst.com/commonapis/searchgstin?gstin=${clean}`
            : `https://sheet.gstincheck.co.in/check/${apiKey}/${clean}`;
        const headers: Record<string, string> =
          provider === 'mastergst' ? { 'client-id': apiKey, 'client-secret': apiKey } : {};
        const r = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
        if (r.ok) {
          const j: any = await r.json();
          const d = j.data || j.result || j;
          if (d) {
            parsed.legalName = d.lgnm || d.legalName || d.legal_name || null;
            parsed.tradeName = d.tradeNam || d.tradeName || d.trade_name || null;
            parsed.status = d.sts || d.status || null;
            parsed.registrationDate = d.rgdt || d.registrationDate || null;
            parsed.businessType = d.ctb || d.constitutionOfBusiness || null;
            const addrSrc = d.pradr?.adr || d.address || null;
            parsed.address = typeof addrSrc === 'string' ? addrSrc : null;
            parsed.source = provider as any;
          }
        } else if (r.status === 401 || r.status === 403) {
          console.warn('[GST] provider auth failed', r.status);
          parsed.notice = 'GST API authentication failed — showing structural data';
        } else if (r.status === 429) {
          console.warn('[GST] provider rate-limited');
          parsed.notice = 'GST API quota exhausted — showing structural data';
        }
      }
    } catch (e: any) {
      console.warn('[GST] provider error:', e?.message || e);
      // Fall through to parsed info
    }
  }

  // Cache only successful enriched responses (don't waste cache on parsed-only).
  if (parsed.source !== 'parsed') gstCacheSet(cacheKey, parsed);

  return { ok: true, data: parsed };
}

/**
 * Build a `gstDetails`-shaped payload from user-supplied manual fields when
 * the vendor has no GSTIN. Lets the rest of the app render the same rich
 * card / list pills regardless of source.
 */
function buildManualGstDetails(input: any): any | null {
  if (!input || typeof input !== 'object') return null;
  const m: any = {
    gstin: '',
    pan: input.pan ? String(input.pan).toUpperCase().trim() : null,
    stateCode: input.stateCode ? String(input.stateCode).trim() : null,
    state: input.state ? String(input.state).trim() : null,
    entityNumber: null,
    legalName: input.legalName ? String(input.legalName).trim() : null,
    tradeName: input.tradeName ? String(input.tradeName).trim() : null,
    address: input.address ? String(input.address).trim() : null,
    city: input.city ? String(input.city).trim() : null,
    pincode: input.pincode ? String(input.pincode).trim() : null,
    status: null,
    registrationDate: null,
    businessType: null,
    addressParts: null,
    taxType: null,
    natureOfBusinessActivity: null,
    eInvoiceStatus: null,
    lastUpdateDate: null,
    cancelledDate: null,
    centerJurisdiction: null,
    stateJurisdiction: null,
    source: 'manual',
  };
  // Drop entirely if all key fields blank.
  const hasAny = m.legalName || m.tradeName || m.state || m.pan || m.city || m.pincode;
  return hasAny ? m : null;
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

// ---------- Outstanding / per-vendor reporting (must precede /:id) ----------

interface VendorOutstandingRow {
  vendorId: string;
  name: string;
  uniqueCode: string;
  totalBillable: number;
  totalPaid: number;
  outstanding: number;
  openCount: number;
}

// GET /api/vendors/outstanding  — aggregate across all vendors.
router.get('/outstanding', async (_req: Request, res: Response) => {
  const rows = await prisma.$queryRaw<VendorOutstandingRow[]>`
    SELECT v.id AS "vendorId", v.name, v.unique_code AS "uniqueCode",
      COALESCE(SUM(CASE WHEN mt.is_billable=true THEN mt.total_value ELSE 0 END), 0)::float AS "totalBillable",
      COALESCE(SUM(CASE WHEN mt.is_billable=true THEN COALESCE(mt.amount_paid,0) ELSE 0 END), 0)::float AS "totalPaid",
      COALESCE(SUM(CASE WHEN mt.is_billable=true THEN COALESCE(mt.total_value,0) - COALESCE(mt.amount_paid,0) ELSE 0 END), 0)::float AS "outstanding",
      COUNT(CASE WHEN mt.is_billable=true AND mt.payment_status IN ('HALF','PENDING') THEN 1 END)::int AS "openCount"
    FROM vendors v
    LEFT JOIN metal_transactions mt
      ON mt.vendor_id = v.id AND mt.transaction_type = 'PURCHASE'
    GROUP BY v.id, v.name, v.unique_code
    ORDER BY "outstanding" DESC, v.name ASC
  `;
  res.json({ success: true, data: rows });
});

// GET /api/vendors/:id/outstanding  — single vendor totals.
router.get('/:id/outstanding', async (req: Request, res: Response) => {
  const rows = await prisma.$queryRaw<VendorOutstandingRow[]>`
    SELECT v.id AS "vendorId", v.name, v.unique_code AS "uniqueCode",
      COALESCE(SUM(CASE WHEN mt.is_billable=true THEN mt.total_value ELSE 0 END), 0)::float AS "totalBillable",
      COALESCE(SUM(CASE WHEN mt.is_billable=true THEN COALESCE(mt.amount_paid,0) ELSE 0 END), 0)::float AS "totalPaid",
      COALESCE(SUM(CASE WHEN mt.is_billable=true THEN COALESCE(mt.total_value,0) - COALESCE(mt.amount_paid,0) ELSE 0 END), 0)::float AS "outstanding",
      COUNT(CASE WHEN mt.is_billable=true AND mt.payment_status IN ('HALF','PENDING') THEN 1 END)::int AS "openCount"
    FROM vendors v
    LEFT JOIN metal_transactions mt
      ON mt.vendor_id = v.id AND mt.transaction_type = 'PURCHASE'
    WHERE v.id = ${req.params.id}
    GROUP BY v.id, v.name, v.unique_code
  `;
  if (rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Vendor not found' });
  }
  res.json({ success: true, data: rows[0] });
});

// GET /api/vendors/:id/transactions  — vendor's billable purchase history.
router.get('/:id/transactions', async (req: Request, res: Response) => {
  const transactions = await prisma.metalTransaction.findMany({
    where: { vendorId: req.params.id, transactionType: 'PURCHASE' },
    include: {
      vendor: { select: { id: true, name: true, uniqueCode: true } },
      payments: {
        include: { recordedBy: { select: { id: true, name: true } } },
        orderBy: { recordedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: transactions });
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
    const { name, phone, gstNumber, address, manualDetails } = req.body || {};
    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ success: false, error: 'phone is required' });
    }
    if (gstNumber && !GSTIN_REGEX.test(String(gstNumber).toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Invalid GSTIN format' });
    }
    // Reject duplicate GSTIN (case-insensitive).
    if (gstNumber) {
      const cleanedGstin = String(gstNumber).toUpperCase().trim();
      const dupe = await prisma.vendor.findFirst({
        where: { gstNumber: cleanedGstin },
        select: { id: true, name: true, uniqueCode: true },
      });
      if (dupe) {
        return res.status(409).json({
          success: false,
          error: `Vendor with GSTIN ${cleanedGstin} already exists: ${dupe.name} (${dupe.uniqueCode})`,
        });
      }
    }
    let gstDetails: any = undefined;
    if (gstNumber) {
      const r = await lookupGstin(gstNumber);
      if (r.ok) gstDetails = r.data;
    } else {
      gstDetails = buildManualGstDetails(manualDetails);
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
    const { name, phone, gstNumber, address, manualDetails } = req.body || {};
    if (phone !== undefined && (!phone || !String(phone).trim())) {
      return res.status(400).json({ success: false, error: 'phone is required' });
    }
    if (gstNumber && !GSTIN_REGEX.test(String(gstNumber).toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Invalid GSTIN format' });
    }
    // Reject duplicate GSTIN (case-insensitive), excluding this vendor.
    if (gstNumber) {
      const cleanedGstin = String(gstNumber).toUpperCase().trim();
      const dupe = await prisma.vendor.findFirst({
        where: { gstNumber: cleanedGstin, NOT: { id: req.params.id } },
        select: { id: true, name: true, uniqueCode: true },
      });
      if (dupe) {
        return res.status(409).json({
          success: false,
          error: `Vendor with GSTIN ${cleanedGstin} already exists: ${dupe.name} (${dupe.uniqueCode})`,
        });
      }
    }
    let gstDetails: any = undefined;
    if (gstNumber) {
      const r = await lookupGstin(gstNumber);
      if (r.ok) gstDetails = r.data;
    } else if (manualDetails !== undefined) {
      gstDetails = buildManualGstDetails(manualDetails);
    }
    // B1 fix: don't downgrade existing rich gstDetails to parsed-only on
    // transient API failures when the GSTIN hasn't changed.
    const existing = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      select: { gstDetails: true, gstNumber: true },
    });
    const cleanedNewGstin = gstNumber ? String(gstNumber).toUpperCase().trim() : '';
    const sameGstin = (existing?.gstNumber || '') === cleanedNewGstin;
    const existingDetails: any = existing?.gstDetails ?? null;
    if (
      sameGstin &&
      gstDetails?.source === 'parsed' &&
      existingDetails &&
      existingDetails.source &&
      existingDetails.source !== 'parsed'
    ) {
      gstDetails = existingDetails;
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
            : manualDetails !== undefined
            ? { gstDetails: gstDetails ?? null }
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
