import api from './api';
import type { MetalTransaction } from './metal.service';

/**
 * Inventory categories a vendor can supply. Drives the VendorSelector
 * filter on each Receive form (Metal / Diamond / Real Stone / Stone
 * Packet). Mirrors the backend `DEALS_IN_VALUES` whitelist.
 */
export type VendorDealsCategory = 'METAL' | 'DIAMOND' | 'REAL_STONE' | 'STONE_PACKET';

export const VENDOR_DEALS_CATEGORIES: VendorDealsCategory[] = [
  'METAL',
  'DIAMOND',
  'REAL_STONE',
  'STONE_PACKET',
];

export const VENDOR_DEALS_LABELS: Record<VendorDealsCategory, string> = {
  METAL: 'Metal',
  DIAMOND: 'Diamond',
  REAL_STONE: 'Real Stone',
  STONE_PACKET: 'Stone Packet',
};

export const VENDOR_DEALS_SHORT: Record<VendorDealsCategory, string> = {
  METAL: 'M',
  DIAMOND: 'D',
  REAL_STONE: 'RS',
  STONE_PACKET: 'SP',
};

export interface Vendor {
  id: string;
  name: string;
  uniqueCode: string;
  phone: string | null;
  email?: string | null;
  country?: string | null;
  gstNumber: string | null;
  gstDetails: GstDetails | null;
  address: string | null;
  /**
   * Which inventory categories this vendor supplies. Empty array =
   * soft-archived (won't appear in any Receive form). Optional on the
   * type so older callers/tests that build Vendor objects by hand keep
   * compiling — the API always returns it as an array.
   */
  dealsIn?: VendorDealsCategory[];
  /** Outstanding credit owed back to the vendor (over-payments parked here). */
  creditBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface GstDetails {
  gstin: string;
  pan: string;
  stateCode: string;
  state: string;
  entityNumber: string;
  legalName: string | null;
  tradeName: string | null;
  address: string | null;
  city?: string | null;
  pincode?: string | null;
  status: string | null;
  registrationDate: string | null;
  businessType?: string | null;
  addressParts?: {
    buildingNumber?: string;
    buildingName?: string;
    floorNumber?: string;
    street?: string;
    locality?: string;
    location?: string;
    district?: string;
    stateCode?: string;
    pincode?: string;
  } | null;
  taxType?: string | null;
  natureOfBusinessActivity?: string[] | null;
  eInvoiceStatus?: string | null;
  lastUpdateDate?: string | null;
  cancelledDate?: string | null;
  centerJurisdiction?: string | null;
  stateJurisdiction?: string | null;
  source: 'parsed' | 'gstincheck' | 'mastergst' | 'rapidapi' | 'rapidapi-tool' | 'manual';
  notice?: string | null;
  /** Co-located on the gstDetails JSON blob to avoid a schema migration. */
  email?: string | null;
  /** ISO country name. India for any GST-registered vendor. */
  country?: string | null;
  /** Foreign / international supplier metadata (also stashed on the blob). */
  foreignDetails?: ForeignVendorDetails | null;
}

/**
 * Optional foreign-vendor / international-supplier metadata. Persisted on the
 * `gstDetails.foreignDetails` JSON blob (same pattern as the email/country
 * stash) so we don't need to migrate the Vendor table for every overseas
 * compliance field. Only populated when the vendor's country is not India.
 */
export interface ForeignVendorDetails {
  // Identity
  taxId?: string;          // EIN / VAT / TRN / ABN / generic
  taxIdLabel?: string;     // 'EIN', 'VAT', 'TRN', 'ABN', 'Tax ID'
  companyRegNo?: string;   // Company registration number (CRN, KvK, etc.)
  // Banking
  bankName?: string;
  bankAddress?: string;
  swift?: string;          // SWIFT/BIC (8 or 11 chars)
  iban?: string;           // IBAN where applicable (UK/EU/UAE)
  accountNumber?: string;
  routingCode?: string;    // ABA / Sort Code / BSB / Transit
  beneficiaryName?: string;
  intermediaryBank?: string;
  currency?: string;       // ISO-4217 (USD, EUR, AED, ...)
  // Customs / Shipping
  incoterms?: string;      // EXW / FOB / CIF / CFR / DDP / DAP / FCA / CPT / CIP / DPU / FAS
  defaultHsCode?: string;  // 4-10 digits
  countryOfOrigin?: string;
  // Address detail
  city?: string;
  state?: string;
  postalCode?: string;
  // Compliance (jewellery-specific)
  kpcNumber?: string;      // Kimberley Process Certificate (rough diamonds)
  conflictFreeDeclared?: boolean;
  // Commercial terms
  paymentTerms?: string;   // 'Advance 30%', 'Net 30', 'Net 60', 'LC at sight'
  letterOfCreditRequired?: boolean;
}

/**
 * Default ISO-4217 currency by country. Drives the auto-default in the
 * vendor form when a foreign country is selected; user can always override.
 */
export const CURRENCY_BY_COUNTRY: Record<string, string> = {
  'India': 'INR',
  'United Arab Emirates': 'AED',
  'Singapore': 'SGD',
  'Hong Kong': 'HKD',
  'Thailand': 'THB',
  'United Kingdom': 'GBP',
  'United States': 'USD',
  'Belgium': 'EUR',
  'Switzerland': 'CHF',
  'Sri Lanka': 'LKR',
  'Other': 'USD',
};

/**
 * Suggested Tax ID label by country. Free text on the form so users can
 * override for unusual jurisdictions.
 */
export const TAX_ID_LABEL_BY_COUNTRY: Record<string, string> = {
  'United States': 'EIN',
  'United Kingdom': 'VAT',
  'United Arab Emirates': 'TRN',
  'Singapore': 'GST',
  'Hong Kong': 'BR No.',
  'Thailand': 'Tax ID',
  'Belgium': 'VAT',
  'Switzerland': 'VAT (UID)',
  'Sri Lanka': 'TIN',
  'Other': 'Tax ID',
};

/** Incoterms 2020 - all options the user can pick from. */
export const INCOTERMS_OPTIONS: { value: string; label: string }[] = [
  { value: 'EXW', label: 'EXW \u2014 Ex Works' },
  { value: 'FCA', label: 'FCA \u2014 Free Carrier' },
  { value: 'CPT', label: 'CPT \u2014 Carriage Paid To' },
  { value: 'CIP', label: 'CIP \u2014 Carriage and Insurance Paid' },
  { value: 'DAP', label: 'DAP \u2014 Delivered at Place' },
  { value: 'DPU', label: 'DPU \u2014 Delivered at Place Unloaded' },
  { value: 'DDP', label: 'DDP \u2014 Delivered Duty Paid' },
  { value: 'FAS', label: 'FAS \u2014 Free Alongside Ship (sea)' },
  { value: 'FOB', label: 'FOB \u2014 Free On Board (sea)' },
  { value: 'CFR', label: 'CFR \u2014 Cost and Freight (sea)' },
  { value: 'CIF', label: 'CIF \u2014 Cost, Insurance & Freight (sea)' },
];

/** Common payment-terms presets. Free text input still allowed. */
export const PAYMENT_TERMS_OPTIONS: string[] = [
  '100% Advance',
  '50% Advance, 50% on Delivery',
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Net 90',
  'LC at sight',
  'LC 30 days',
  'LC 60 days',
  'LC 90 days',
];

/**
 * Default HS-code suggestions by inventory category. HS codes are 4\u20106 digit
 * customs classification codes; user can always override.
 */
export const HS_CODE_BY_DEALS: Record<VendorDealsCategory, { code: string; label: string }> = {
  METAL: { code: '7108', label: '7108 \u2014 Gold (incl. plated with platinum), unwrought' },
  DIAMOND: { code: '7102', label: '7102 \u2014 Diamonds, whether or not worked' },
  REAL_STONE: { code: '7103', label: '7103 \u2014 Precious / semi-precious stones' },
  STONE_PACKET: { code: '7103', label: '7103 \u2014 Precious / semi-precious stones (packets)' },
};

export interface ManualVendorDetails {
  legalName?: string;
  tradeName?: string;
  state?: string;
  stateCode?: string;
  pan?: string;
  city?: string;
  pincode?: string;
  address?: string;
}

export interface VendorInput {
  name: string;
  phone?: string;
  email?: string;
  country?: string;
  gstNumber?: string;
  address?: string;
  manualDetails?: ManualVendorDetails;
  /**
   * Inventory categories this vendor supplies. Server treats `undefined`
   * as "default to all 4" on create, and as "don't change" on update.
   * Pass `[]` to soft-archive (vendor stops appearing in Receive forms
   * but stays selectable in Edit modals + transaction history).
   */
  dealsIn?: VendorDealsCategory[];
  /**
   * Optional foreign-vendor metadata (banking, customs, compliance). Only
   * sent when `country !== 'India'`. Pass `null` to clear an existing blob.
   */
  foreignDetails?: ForeignVendorDetails | null;
}

export async function getNextVendorCode(): Promise<string> {
  const r = await api.get('/vendors/next-code');
  return r.data.data.uniqueCode;
}

export async function listVendors(
  search?: string,
  dealsIn?: VendorDealsCategory,
): Promise<Vendor[]> {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (dealsIn) params.dealsIn = dealsIn;
  const r = await api.get('/vendors', { params });
  return r.data.data;
}

export async function createVendor(data: VendorInput): Promise<Vendor> {
  const r = await api.post('/vendors', data);
  return r.data.data;
}

export async function updateVendor(id: string, data: Partial<VendorInput>): Promise<Vendor> {
  const r = await api.put(`/vendors/${id}`, data);
  return r.data.data;
}

export async function deleteVendor(id: string): Promise<void> {
  await api.delete(`/vendors/${id}`);
}

export async function lookupGstin(gstin: string): Promise<GstDetails> {
  const r = await api.get(`/vendors/gst/${encodeURIComponent(gstin)}`);
  return r.data.data;
}

export async function getVendor(id: string): Promise<Vendor> {
  const r = await api.get(`/vendors/${id}`);
  return r.data.data;
}

export interface VendorOutstanding {
  vendorId: string;
  name: string;
  uniqueCode: string;
  totalBillable: number;
  totalPaid: number;
  outstanding: number;
  openCount: number;
}

export async function listVendorOutstanding(): Promise<VendorOutstanding[]> {
  const r = await api.get('/vendors/outstanding');
  return r.data.data;
}

export async function getVendorOutstanding(id: string): Promise<VendorOutstanding | null> {
  try {
    const r = await api.get(`/vendors/${id}/outstanding`);
    return r.data.data ?? null;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

export async function getVendorTransactions(id: string): Promise<MetalTransaction[]> {
  const r = await api.get(`/vendors/${id}/transactions`);
  return r.data.data;
}

export async function getVendorDiamondTransactions(
  id: string
): Promise<import('./diamond.service').DiamondTransaction[]> {
  const r = await api.get(`/vendors/${id}/diamond-transactions`);
  return r.data.data;
}

export async function getVendorRealStoneTransactions(
  id: string
): Promise<import('./stone.service').RealStoneTransaction[]> {
  const r = await api.get(`/vendors/${id}/real-stone-transactions`);
  return r.data.data;
}

export async function getVendorStonePacketTransactions(
  id: string
): Promise<import('./stone.service').StonePacketTransaction[]> {
  const r = await api.get(`/vendors/${id}/stone-packet-transactions`);
  return r.data.data;
}
