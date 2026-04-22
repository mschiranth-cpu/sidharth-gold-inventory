import api from './api';

export interface Vendor {
  id: string;
  name: string;
  uniqueCode: string;
  phone: string | null;
  gstNumber: string | null;
  gstDetails: GstDetails | null;
  address: string | null;
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
  status: string | null;
  registrationDate: string | null;
  source: 'parsed' | 'gstincheck' | 'mastergst';
}

export interface VendorInput {
  name: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
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
