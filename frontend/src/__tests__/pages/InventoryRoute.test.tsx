import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
const auth = vi.hoisted(() => ({ user: { id: 'staff', name: 'Office Member', role: 'OFFICE_STAFF' }, isAuthenticated: true, isLoading: false, logout: vi.fn() }));
vi.mock('../../contexts/AuthContext', () => ({ AuthProvider: ({ children }: { children: ReactNode }) => children, useAuth: () => auth }));
vi.mock('../../components/layout/MainLayout', () => ({ default: () => <Outlet /> }));
vi.mock('../../components/layout/ClientPortalLayout', () => ({ default: () => <Outlet /> }));
vi.mock('../../components/common/NavigationLoader', () => ({ default: () => null }));
vi.mock('../../components/WorkerNotification', () => ({ WorkerNotification: () => null }));
vi.mock('../../components/NotificationPermissionPrompt', () => ({ default: () => null }));
vi.mock('../../components/common/AuthShell', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('../../hooks/useFeatures', () => ({ useFeatures: () => ({ isChecking: false, isError: false, canUsePath: () => false, refetch: vi.fn() }) }));
vi.mock('../../services/metal.service', () => ({ getMetalStockSummary: vi.fn().mockResolvedValue([]) }));
vi.mock('../../services/features.service', () => ({
  getFeatureCatalog: vi.fn().mockResolvedValue([]),
  getFeatureSubjects: vi.fn().mockResolvedValue({ roles: ['ADMIN'], users: [], departments: [] }),
  getFeatureAudit: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  updateFeaturePermission: vi.fn(), bulkUpdateFeaturePermissions: vi.fn(),
}));
beforeEach(() => { auth.user.role = 'OFFICE_STAFF'; });
function show(path = '/app/inventory') { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></QueryClientProvider>); }
describe('Actual inventory route', () => {
  it('loads the real safe inventory hub through the existing office route', async () => {
    show();
    expect(await screen.findByRole('heading', { name: 'Main Inventory' })).toBeInTheDocument();
    expect(screen.getByText(/No inventory modules are enabled/)).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
  it('does not broaden the inventory hub role guard to factory managers', async () => {
    auth.user.role = 'FACTORY_MANAGER'; show();
    expect(await screen.findByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Main Inventory' })).not.toBeInTheDocument();
  });
  it('keeps the actual administrator feature-management route available for recovery', async () => {
    auth.user.role = 'ADMIN'; show('/app/admin/features');
    expect(await screen.findByRole('heading', { name: 'Feature Toggle Management' })).toBeInTheDocument();
  });
});
