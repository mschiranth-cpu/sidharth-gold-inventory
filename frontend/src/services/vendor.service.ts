import api from './api';
import type { MetalTransaction } from './metal.service';

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
}

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
}

export async function getNextVendorCode(): Promise<string> {
  const r = await api.get('/vendors/next-code');
  return r.data.data.uniqueCode;
}

export async function listVendors(search?: string): Promise<Vendor[]> {
  const r = await api.get('/vendors', { params: search ? { search } : {} });
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
