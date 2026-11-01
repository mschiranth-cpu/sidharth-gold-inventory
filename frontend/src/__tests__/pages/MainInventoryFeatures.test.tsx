import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MainInventoryDashboard from '../../pages/inventory/MainInventoryDashboard';
const access = vi.hoisted(() => ({ isChecking: false, isError: false, canUsePath: vi.fn(), refetch: vi.fn() }));
const stock = vi.hoisted(() => vi.fn());
vi.mock('../../hooks/useFeatures', () => ({ useFeatures: () => access }));
vi.mock('../../services/metal.service', () => ({ getMetalStockSummary: stock }));
function show() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><MainInventoryDashboard /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); access.isChecking = false; access.isError = false; access.canUsePath.mockReturnValue(true); stock.mockResolvedValue([]); });
describe('Inventory hub feature visibility', () => {
  it('hides disabled metal navigation and does not request its stock', async () => {
    access.canUsePath.mockImplementation((path: string) => !path.includes('/metal'));
    show(); await screen.findByRole('link', { name: /Diamond Inventory/ });
    expect(screen.queryByRole('link', { name: /Metal Inventory/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Total Metal Stock')).not.toBeInTheDocument();
    expect(screen.queryByText('Metal Types')).not.toBeInTheDocument();
    expect(stock).not.toHaveBeenCalled();
  });
  it('shows an empty state rather than dead links when every module is disabled', () => {
    access.canUsePath.mockReturnValue(false); show();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText(/No inventory modules are enabled/)).toBeInTheDocument();
  });
  it('keeps existing available inventory behavior', async () => {
    show(); await waitFor(() => expect(stock).toHaveBeenCalledTimes(1));
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.getByText('Total Metal Stock')).toBeInTheDocument();
  });
});
