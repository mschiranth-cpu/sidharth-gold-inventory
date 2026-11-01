import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VendorDetailPage from '../../pages/vendors/VendorDetailPage';
const access = vi.hoisted(() => ({ isChecking: false, isError: false, canUsePath: vi.fn() }));
const api = vi.hoisted(() => ({ getVendor: vi.fn(), getVendorOutstanding: vi.fn(), getVendorAging: vi.fn(), getVendorTransactions: vi.fn(), getVendorDiamondTransactions: vi.fn(), getVendorRealStoneTransactions: vi.fn(), getVendorStonePacketTransactions: vi.fn() }));
vi.mock('../../hooks/useFeatures', () => ({ useFeatures: () => access }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'staff', name: 'Office Member', role: 'OFFICE_STAFF' } }) }));
vi.mock('../../services/vendor.service', () => api);
vi.mock('../../components/SettlePaymentModal', () => ({ default: () => null }));
vi.mock('../../components/GstInfoCard', () => ({ default: () => null }));
beforeEach(() => {
  vi.clearAllMocks(); access.isChecking = false; access.isError = false; access.canUsePath.mockReturnValue(false);
  api.getVendor.mockResolvedValue({ id: 'vendor-1', name: 'Demo Vendor', uniqueCode: 'VEN-001', phone: null, email: null, country: 'India', gstNumber: null, gstDetails: null, address: null, dealsIn: [], creditBalance: 0, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' });
  api.getVendorOutstanding.mockResolvedValue({ outstanding: 80, totalBillable: 100, totalPaid: 20, openCount: 1 });
  api.getVendorAging.mockResolvedValue(null);
  for (const key of ['getVendorTransactions', 'getVendorDiamondTransactions', 'getVendorRealStoneTransactions', 'getVendorStonePacketTransactions'] as const) api[key].mockResolvedValue([]);
});
function show(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/app/vendors/vendor-1']}><Routes><Route path="/app/vendors/:id" element={<VendorDetailPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}
describe('Vendor inventory restrictions', () => {
  it('keeps vendor balance visible without requesting denied purchase ledgers', async () => {
    show(); expect(await screen.findByText('Demo Vendor')).toBeInTheDocument();
    expect(api.getVendorOutstanding).toHaveBeenCalled();
    expect(api.getVendorTransactions).not.toHaveBeenCalled();
    expect(api.getVendorDiamondTransactions).not.toHaveBeenCalled();
    expect(api.getVendorRealStoneTransactions).not.toHaveBeenCalled();
    expect(api.getVendorStonePacketTransactions).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^Metal / })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Diamond / })).not.toBeInTheDocument();
    expect(screen.getByText(/Only transactions from enabled inventory modules/)).toBeInTheDocument();
  });
  it('requests only permitted inventory ledgers', async () => {
    access.canUsePath.mockImplementation((path: string) => path.includes('/diamonds'));
    show(); await screen.findByText('Demo Vendor');
    await waitFor(() => expect(api.getVendorDiamondTransactions).toHaveBeenCalledTimes(1));
    expect(api.getVendorTransactions).not.toHaveBeenCalled();
    expect(api.getVendorRealStoneTransactions).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^Diamond / })).toBeInTheDocument();
  });
  it('does not render cached denied ledger rows from an earlier access state', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['vendor-transactions', 'vendor-1', 'staff', 'OFFICE_STAFF'], [{ id: 'private-purchase', metalType: 'Gold', purity: 22, quantity: 999 }]);
    show(client); await screen.findByText('Demo Vendor');
    expect(screen.queryByText(/Gold 22K/)).not.toBeInTheDocument();
    expect(api.getVendorTransactions).not.toHaveBeenCalled();
  });
});
