import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MetalTransactionsPage from '../../pages/inventory/MetalTransactionsPage';
import DiamondTransactionsPage from '../../pages/inventory/DiamondTransactionsPage';
import RealStoneTransactionsPage from '../../pages/inventory/RealStoneTransactionsPage';
import StonePacketTransactionsPage from '../../pages/inventory/StonePacketTransactionsPage';

const policy = vi.hoisted(() => ({ role: 'OFFICE_STAFF', write: false, delete: false }));
const fixture = vi.hoisted(() => ({
  id: 'synthetic-transaction', referenceNumber: 'SYNTHETIC-REF', transactionType: 'PURCHASE',
  createdAt: '2026-11-01T08:00:00.000Z', metalType: 'GOLD', purity: 22, grossWeight: 1,
  caratWeight: 1, quantity: 1, totalValue: 100, amountPaid: 0, paymentStatus: 'PENDING',
  isBillable: true, vendor: { id: 'synthetic-vendor', name: 'Synthetic Vendor', uniqueCode: 'V001' },
  diamond: { stockNumber: 'D001', shape: 'ROUND' }, stone: { stockNumber: 'R001', stoneType: 'RUBY' },
  packet: { packetNumber: 'P001', stoneType: 'CZ', quality: 'AAA', unit: 'PCS' },
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user', role: policy.role } }) }));
vi.mock('../../hooks/useFeatures', () => ({ useFeatures: () => ({ canPerform: (_feature: string, operation: string) => policy.role === 'ADMIN' || (operation === 'delete' ? policy.delete : policy.write) }) }));
vi.mock('../../services/metal.service', () => ({ getAllMetalTransactions: vi.fn(async () => [fixture]), deleteMetalTransaction: vi.fn(), settleMetalPayment: vi.fn(), exportMetalTransactionsXlsx: vi.fn() }));
vi.mock('../../services/diamond.service', () => ({ getAllDiamondTransactions: vi.fn(async () => [fixture]), deleteDiamondTransaction: vi.fn(), settleDiamondPayment: vi.fn(), exportDiamondTransactionsXlsx: vi.fn() }));
vi.mock('../../services/stone.service', () => ({ getAllRealStoneTransactions: vi.fn(async () => [fixture]), getAllStonePacketTransactions: vi.fn(async () => [fixture]), deleteRealStoneTransaction: vi.fn(), deleteStonePacketTransaction: vi.fn(), settleRealStonePayment: vi.fn(), settleStonePacketPayment: vi.fn(), exportRealStoneTransactionsXlsx: vi.fn(), exportStonePacketTransactionsXlsx: vi.fn() }));
vi.mock('../../components/SettlePaymentModal', () => ({ default: () => <div data-testid="settle-dialog">Settlement dialog</div> }));
vi.mock('../../components/EditMetalTransactionModal', () => ({ default: () => <div data-testid="edit-dialog">Edit dialog</div> }));
vi.mock('../../components/EditDiamondTransactionModal', () => ({ default: () => <div data-testid="edit-dialog">Edit dialog</div> }));
vi.mock('../../components/EditRealStoneTransactionModal', () => ({ default: () => <div data-testid="edit-dialog">Edit dialog</div> }));
vi.mock('../../components/EditStonePacketTransactionModal', () => ({ default: () => <div data-testid="edit-dialog">Edit dialog</div> }));

const pages = [MetalTransactionsPage, DiamondTransactionsPage, RealStoneTransactionsPage, StonePacketTransactionsPage];
function mount(Page: (typeof pages)[number]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const element = () => <QueryClientProvider client={client}><MemoryRouter><Page /></MemoryRouter></QueryClientProvider>;
  const result = render(element());
  return { ...result, refresh: () => result.rerender(element()) };
}
beforeEach(() => { policy.role = 'OFFICE_STAFF'; policy.write = false; policy.delete = false; });

describe('Inventory transaction action permissions', () => {
  it.each(pages.map((Page) => [Page.name, Page] as const))('keeps %s readable while hiding denied row, bulk and receive actions', async (_name, Page) => {
    mount(Page);
    const select = await screen.findByRole('checkbox', { name: 'Select transaction SYNTHETIC-REF' });
    expect(screen.getByText('Synthetic Vendor')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit', exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Settle/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^(Receive|Issue|Transfer)$/ })).not.toBeInTheDocument();
    fireEvent.click(select);
    expect(screen.queryByRole('button', { name: /Settle selected|Delete selected/ })).not.toBeInTheDocument();
  });

  it.each(pages.map((Page) => [Page.name, Page] as const))('allows office edits with a write grant and closes the open form when revoked in %s', async (_name, Page) => {
    policy.write = true;
    const view = mount(Page);
    const edit = await screen.findByRole('button', { name: 'Edit', exact: true });
    expect(screen.queryByRole('button', { name: 'Delete', exact: true })).not.toBeInTheDocument();
    fireEvent.click(edit);
    expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
    policy.write = false; view.refresh();
    await waitFor(() => expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument());
    policy.write = true; view.refresh();
    expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument();
  });

  it.each(pages.map((Page) => [Page.name, Page] as const))('preserves factory-manager baseline read-only actions despite broad feature grants in %s', async (_name, Page) => {
    policy.role = 'FACTORY_MANAGER'; policy.write = true; policy.delete = true;
    mount(Page);
    await screen.findByRole('checkbox', { name: 'Select transaction SYNTHETIC-REF' });
    expect(screen.queryByRole('button', { name: /^(Edit|Delete|.*Settle)$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^(Receive|Issue|Transfer)$/ })).not.toBeInTheDocument();
  });

  it.each(pages.map((Page) => [Page.name, Page] as const))('preserves administrator edit and delete recovery in %s', async (_name, Page) => {
    policy.role = 'ADMIN';
    mount(Page);
    await screen.findByRole('button', { name: 'Edit', exact: true });
    expect(screen.getByRole('button', { name: 'Delete', exact: true })).toBeInTheDocument();
  });
});
