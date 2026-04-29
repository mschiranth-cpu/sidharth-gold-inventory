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
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Inventory categories a vendor can supply. Drives the VendorSelector
 * filter on each Receive form. Source-of-truth list — referenced from
 * frontend types via mirroring (kept in sync manually — 4 tokens, low
 * churn).
 */
const DEALS_IN_VALUES = ['METAL', 'DIAMOND', 'REAL_STONE', 'STONE_PACKET'] as const;
type DealsInValue = (typeof DEALS_IN_VALUES)[number];
const DEALS_IN_SET = new Set<string>(DEALS_IN_VALUES);

/**
 * Normalises and validates a `dealsIn` array from a request body.
 * Returns:
 *  - `{ ok: true, value: undefined }` when the field was not provided
 *    (caller decides the default — we default to all-4 on POST so new
 *    vendors are visible everywhere out of the box; PUT preserves the
 *    existing value).
 *  - `{ ok: true, value: string[] }` when the field is a valid array
 *    (deduplicated; empty array is allowed — acts as soft-archive).
 *  - `{ ok: false, error }` when the input is malformed or contains
 *    unknown tokens (rejected with 400).
 */
function parseDealsIn(
  raw: unknown,
): { ok: true; value: DealsInValue[] | undefined } | { ok: false; error: string } {
  if (raw === undefined) return { ok: true, value: undefined };
  if (raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw)) {
    return { ok: false, error: 'dealsIn must be an array of category tokens' };
  }
  const cleaned: DealsInValue[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const token = String(item || '').trim().toUpperCase();
    if (!token) continue;
    if (!DEALS_IN_SET.has(token)) {
      return {
        ok: false,
        error: `Invalid dealsIn value '${token}'. Allowed: ${DEALS_IN_VALUES.join(', ')}`,
      };
    }
    if (!seen.has(token)) {
      seen.add(token);
      cleaned.push(token as DealsInValue);
    }
  }
  return { ok: true, value: cleaned };
}

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

// ----------------------------------------------------------------------------
// Foreign vendor (international supplier) details.
//
// When a vendor's country is not India, GSTIN is meaningless and the user
// instead provides export/import compliance + remittance details. We stash
// them on the same `gstDetails` JSON blob under a `foreignDetails` key to
// avoid a schema migration.
// ----------------------------------------------------------------------------
const FOREIGN_INCOTERMS = new Set([
  'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP',
  'FAS', 'FOB', 'CFR', 'CIF',
]);
const SWIFT_REGEX = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
const CURRENCY_REGEX = /^[A-Z]{3}$/;
const HS_CODE_REGEX = /^\d{4,10}$/;

/**
 * Whitelist + sanitize a caller-supplied `foreignDetails` object. Returns
 * `null` if every field is blank so we don't write empty noise. Throws if a
 * structurally-invalid value is provided (caught by the route handler).
 */
function buildForeignDetails(input: any): any | null {
  if (!input || typeof input !== 'object') return null;
  const str = (v: any) => (v === undefined || v === null ? undefined : String(v).trim() || undefined);
  const upper = (v: any) => {
    const s = str(v);
    return s ? s.toUpperCase() : undefined;
  };
  const bool = (v: any) =>
    v === true || v === false ? v : undefined;

  const swift = upper(input.swift);
  if (swift && !SWIFT_REGEX.test(swift)) {
    throw new Error('Invalid SWIFT/BIC code format');
  }
  const iban = upper(input.iban);
  if (iban && !IBAN_REGEX.test(iban)) {
    throw new Error('Invalid IBAN format');
  }
  const currency = upper(input.currency);
  if (currency && !CURRENCY_REGEX.test(currency)) {
    throw new Error('Currency must be a 3-letter ISO code (e.g. USD, EUR, AED)');
  }
  const incoterms = upper(input.incoterms);
  if (incoterms && !FOREIGN_INCOTERMS.has(incoterms)) {
    throw new Error(`Incoterms must be one of ${[...FOREIGN_INCOTERMS].join(', ')}`);
  }
  const defaultHsCode = str(input.defaultHsCode);
  if (defaultHsCode && !HS_CODE_REGEX.test(defaultHsCode)) {
    throw new Error('HS code must be 4–10 digits');
  }

  const out: Record<string, any> = {
    // Identity
    taxId: str(input.taxId),
    taxIdLabel: str(input.taxIdLabel),
    companyRegNo: str(input.companyRegNo),
    // Banking
    bankName: str(input.bankName),
    bankAddress: str(input.bankAddress),
    swift,
    iban,
    accountNumber: str(input.accountNumber),
    routingCode: str(input.routingCode),
    beneficiaryName: str(input.beneficiaryName),
    intermediaryBank: str(input.intermediaryBank),
    currency,
    // Customs / Shipping
    incoterms,
    defaultHsCode,
    countryOfOrigin: str(input.countryOfOrigin),
    // Address detail
    city: str(input.city),
    state: str(input.state),
    postalCode: str(input.postalCode),
    // Compliance
    kpcNumber: str(input.kpcNumber),
    conflictFreeDeclared: bool(input.conflictFreeDeclared),
    // Commercial terms
    paymentTerms: str(input.paymentTerms),
    letterOfCreditRequired: bool(input.letterOfCreditRequired),
  };
  // Strip undefined keys so the JSON blob stays small.
  const compact: Record<string, any> = {};
  for (const [k, v] of Object.entries(out)) {
    if (v !== undefined && v !== '') compact[k] = v;
  }
  return Object.keys(compact).length > 0 ? compact : null;
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

// GET /api/vendors  (list, optional ?search= and ?dealsIn=)
router.get('/', async (req: Request, res: Response) => {
  const search = String(req.query.search || '').trim();
  // ?dealsIn=METAL  filters to vendors flagged for that category. Single
  // value only (each Receive page is single-category). Unknown values are
  // rejected with 400 so the caller catches typos early.
  const rawDealsIn = req.query.dealsIn;
  let dealsInFilter: string | undefined;
  if (rawDealsIn !== undefined) {
    const token = String(rawDealsIn).trim().toUpperCase();
    if (token) {
      if (!DEALS_IN_SET.has(token)) {
        return res.status(400).json({
          success: false,
          error: `Invalid dealsIn '${token}'. Allowed: ${DEALS_IN_VALUES.join(', ')}`,
        });
      }
      dealsInFilter = token;
    }
  }
  const filters: any[] = [];
  if (search) {
    filters.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { uniqueCode: { contains: search, mode: 'insensitive' as const } },
        { gstNumber: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
      ],
    });
  }
  if (dealsInFilter) {
    filters.push({ dealsIn: { has: dealsInFilter } });
  }
  const where = filters.length === 0 ? {} : filters.length === 1 ? filters[0] : { AND: filters };
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
  // `is_billable` is now a pure tax-classification tag (used in Excel exports);
  // both billable and non-billable PURCHASE rows count toward what the vendor
  // is owed. Sums BOTH metal AND diamond purchases — vendors are cross-domain.
  const rows = await prisma.$queryRaw<VendorOutstandingRow[]>`
    WITH unified AS (
      SELECT vendor_id, total_value, amount_paid, payment_status
        FROM metal_transactions
        WHERE transaction_type = 'PURCHASE' AND vendor_id IS NOT NULL
      UNION ALL
      SELECT vendor_id, total_value, amount_paid, payment_status
        FROM diamond_transactions
        WHERE transaction_type = 'PURCHASE' AND vendor_id IS NOT NULL
      UNION ALL
      SELECT vendor_id, total_value, amount_paid, payment_status
        FROM real_stone_transactions
        WHERE transaction_type = 'PURCHASE' AND vendor_id IS NOT NULL
      UNION ALL
      SELECT vendor_id, total_value, amount_paid, payment_status
        FROM stone_packet_transactions
        WHERE transaction_type = 'PURCHASE' AND vendor_id IS NOT NULL
    )
    SELECT v.id AS "vendorId", v.name, v.unique_code AS "uniqueCode",
      COALESCE(SUM(u.total_value), 0)::float AS "totalBillable",
      COALESCE(SUM(COALESCE(u.amount_paid,0)), 0)::float AS "totalPaid",
      COALESCE(SUM(COALESCE(u.total_value,0) - COALESCE(u.amount_paid,0)), 0)::float AS "outstanding",
      COUNT(CASE WHEN u.payment_status IN ('HALF','PENDING') THEN 1 END)::int AS "openCount"
    FROM vendors v
    LEFT JOIN unified u ON u.vendor_id = v.id
    GROUP BY v.id, v.name, v.unique_code
    ORDER BY "outstanding" DESC, v.name ASC
  `;
  res.json({ success: true, data: rows });
});

// GET /api/vendors/:id/outstanding  — single vendor totals.
router.get('/:id/outstanding', async (req: Request, res: Response) => {
  const rows = await prisma.$queryRaw<VendorOutstandingRow[]>`
    WITH unified AS (
      SELECT vendor_id, total_value, amount_paid, payment_status
        FROM metal_transactions
        WHERE transaction_type = 'PURCHASE' AND vendor_id = ${req.params.id}
      UNION ALL
      SELECT vendor_id, total_value, amount_paid, payment_status
        FROM diamond_transactions
        WHERE transaction_type = 'PURCHASE' AND vendor_id = ${req.params.id}
      UNION ALL
      SELECT vendor_id, total_value, amount_paid, payment_status
        FROM real_stone_transactions
        WHERE transaction_type = 'PURCHASE' AND vendor_id = ${req.params.id}
      UNION ALL
      SELECT vendor_id, total_value, amount_paid, payment_status
        FROM stone_packet_transactions
        WHERE transaction_type = 'PURCHASE' AND vendor_id = ${req.params.id}
    )
    SELECT v.id AS "vendorId", v.name, v.unique_code AS "uniqueCode",
      COALESCE(SUM(u.total_value), 0)::float AS "totalBillable",
      COALESCE(SUM(COALESCE(u.amount_paid,0)), 0)::float AS "totalPaid",
      COALESCE(SUM(COALESCE(u.total_value,0) - COALESCE(u.amount_paid,0)), 0)::float AS "outstanding",
      COUNT(CASE WHEN u.payment_status IN ('HALF','PENDING') THEN 1 END)::int AS "openCount"
    FROM vendors v
    LEFT JOIN unified u ON u.vendor_id = v.id
    WHERE v.id = ${req.params.id}
    GROUP BY v.id, v.name, v.unique_code
  `;
  if (rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Vendor not found' });
  }
  res.json({ success: true, data: rows[0] });
});

// GET /api/vendors/:id/transactions  — vendor's full purchase history
// (billable + non-billable; isBillable is a tax-classification tag).
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

// GET /api/vendors/:id/diamond-transactions  — vendor's diamond purchase history.
router.get('/:id/diamond-transactions', async (req: Request, res: Response) => {
  const transactions = await prisma.diamondTransaction.findMany({
    where: { vendorId: req.params.id, transactionType: 'PURCHASE' },
    include: {
      vendor: { select: { id: true, name: true, uniqueCode: true } },
      diamond: {
        select: {
          id: true,
          stockNumber: true,
          category: true,
          shape: true,
          color: true,
          clarity: true,
        },
      },
      payments: {
        include: { recordedBy: { select: { id: true, name: true } } },
        orderBy: { recordedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: transactions });
});

// GET /api/vendors/:id/real-stone-transactions  — vendor's real-stone purchase history.
router.get('/:id/real-stone-transactions', async (req: Request, res: Response) => {
  const transactions = await prisma.realStoneTransaction.findMany({
    where: { vendorId: req.params.id, transactionType: 'PURCHASE' },
    include: {
      vendor: { select: { id: true, name: true, uniqueCode: true } },
      stone: {
        select: {
          id: true,
          stockNumber: true,
          stoneType: true,
          shape: true,
          color: true,
          clarity: true,
        },
      },
      payments: {
        include: { recordedBy: { select: { id: true, name: true } } },
        orderBy: { recordedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: transactions });
});

// GET /api/vendors/:id/stone-packet-transactions  — vendor's stone-packet purchase history.
router.get('/:id/stone-packet-transactions', async (req: Request, res: Response) => {
  const transactions = await prisma.stonePacketTransaction.findMany({
    where: { vendorId: req.params.id, transactionType: 'PURCHASE' },
    include: {
      vendor: { select: { id: true, name: true, uniqueCode: true } },
      packet: {
        select: {
          id: true,
          packetNumber: true,
          stoneType: true,
          size: true,
          color: true,
          quality: true,
          unit: true,
        },
      },
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
    const { name, phone, email, country, gstNumber, address, manualDetails, foreignDetails: foreignInput } = req.body || {};
    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ success: false, error: 'phone is required' });
    }
    if (gstNumber && !GSTIN_REGEX.test(String(gstNumber).toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Invalid GSTIN format' });
    }
    const cleanedEmail = email ? String(email).trim().toLowerCase() : '';
    if (cleanedEmail && !EMAIL_REGEX.test(cleanedEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }
    let foreignDetails: any = null;
    try {
      foreignDetails = buildForeignDetails(foreignInput);
    } catch (e: any) {
      return res.status(400).json({ success: false, error: e?.message || 'Invalid foreignDetails' });
    }
    const dealsInResult = parseDealsIn(req.body?.dealsIn);
    if (!dealsInResult.ok) {
      return res.status(400).json({ success: false, error: dealsInResult.error });
    }
    // POST default: when caller omitted the field, ship all 4 categories
    // so the new vendor is visible in every Receive form (matches the
    // form's pre-checked default and the migration backfill).
    const dealsIn: DealsInValue[] =
      dealsInResult.value === undefined ? [...DEALS_IN_VALUES] : dealsInResult.value;
    // GSTIN starts with a 2-digit Indian state code — if a GSTIN is supplied,
    // the vendor is Indian-registered. Coerce country to keep data consistent.
    const cleanedCountry = gstNumber ? 'India' : (country ? String(country).trim() : '');
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
    // Stash email + country on the gstDetails JSON blob so we don't need a
    // schema migration for these optional contact fields.
    if (cleanedEmail || cleanedCountry) {
      gstDetails = {
        ...(gstDetails || {}),
        ...(cleanedEmail ? { email: cleanedEmail } : {}),
        ...(cleanedCountry ? { country: cleanedCountry } : {}),
      };
    }
    // Stash foreign-vendor details on the same blob (foreignDetails key) so
    // international suppliers don't require a separate schema column.
    if (foreignDetails) {
      gstDetails = { ...(gstDetails || {}), foreignDetails };
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
            dealsIn,
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
    const { name, phone, email, country, gstNumber, address, manualDetails, foreignDetails: foreignInput } = req.body || {};
    if (phone !== undefined && (!phone || !String(phone).trim())) {
      return res.status(400).json({ success: false, error: 'phone is required' });
    }
    if (gstNumber && !GSTIN_REGEX.test(String(gstNumber).toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Invalid GSTIN format' });
    }
    const cleanedEmail = email !== undefined ? String(email || '').trim().toLowerCase() : undefined;
    if (cleanedEmail && !EMAIL_REGEX.test(cleanedEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }
    // Foreign details are optional on PUT — undefined means "don't change",
    // null means "clear them", an object means "replace".
    let foreignDetails: any = undefined;
    if (foreignInput !== undefined) {
      try {
        foreignDetails = foreignInput === null ? null : buildForeignDetails(foreignInput);
      } catch (e: any) {
        return res.status(400).json({ success: false, error: e?.message || 'Invalid foreignDetails' });
      }
    }
    const dealsInResult = parseDealsIn(req.body?.dealsIn);
    if (!dealsInResult.ok) {
      return res.status(400).json({ success: false, error: dealsInResult.error });
    }
    // PUT semantics: only update `dealsIn` if the caller sent it.
    // `[]` is a valid value (soft-archive — vendor stops appearing in any
    // Receive form but stays selectable in Edit modals + transaction history).
    const dealsInUpdate: DealsInValue[] | undefined = dealsInResult.value;
    const cleanedCountry =
      gstNumber
        ? 'India'
        : country !== undefined
        ? String(country || '').trim()
        : undefined;
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
    // Merge email + country onto whichever gstDetails we're about to write,
    // OR onto the existing blob if neither GST nor manual fields were touched
    // (so a vendor can be updated with email/country alone).
    const emailOrCountryChanged = cleanedEmail !== undefined || cleanedCountry !== undefined;
    if (emailOrCountryChanged) {
      const base: any = gstDetails ?? existingDetails ?? {};
      gstDetails = {
        ...base,
        ...(cleanedEmail !== undefined ? { email: cleanedEmail || null } : {}),
        ...(cleanedCountry !== undefined ? { country: cleanedCountry || null } : {}),
      };
    }
    // Foreign details: caller can pass {} or a full object to replace, or
    // null to clear. Merge onto whichever blob we're about to write so we
    // don't lose email/country/GST data.
    if (foreignDetails !== undefined) {
      const base: any = gstDetails ?? existingDetails ?? {};
      if (foreignDetails === null) {
        // Drop foreignDetails from the blob entirely.
        const { foreignDetails: _drop, ...rest } = base;
        gstDetails = rest;
      } else {
        gstDetails = { ...base, foreignDetails };
      }
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
            : emailOrCountryChanged || foreignDetails !== undefined
            ? { gstDetails: gstDetails ?? null }
            : {}),
          ...(address !== undefined ? { address: address ? String(address).trim() : null } : {}),
          ...(dealsInUpdate !== undefined ? { dealsIn: dealsInUpdate } : {}),
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
