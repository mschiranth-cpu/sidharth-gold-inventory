import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeatureTogglePage from '../../pages/admin/FeatureTogglePage';

const services = vi.hoisted(() => ({
  getAllFeatures: vi.fn(), getFeatureSubjects: vi.fn(), getFeatureAudit: vi.fn(),
  updateFeaturePermission: vi.fn(), bulkUpdateFeaturePermissions: vi.fn(),
}));
vi.mock('../../services/features.service', () => ({ ...services, getFeatureCatalog: services.getAllFeatures }));

const metal = {
  id: 'METAL_INVENTORY', name: 'METAL_INVENTORY', displayName: 'Metal Inventory',
  description: 'Precious metal stock and transactions', isConfigured: false,
  isGlobal: false, override: null, permissions: [],
  effective: { hasAccess: true, canRead: true, canWrite: true, canDelete: true, source: 'default' },
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return { ...render(<QueryClientProvider client={client}><FeatureTogglePage /></QueryClientProvider>), client };
}

beforeEach(() => {
  vi.clearAllMocks();
  services.getAllFeatures.mockResolvedValue([metal]);
  services.getFeatureSubjects.mockResolvedValue({
    roles: ['ADMIN', 'OFFICE_STAFF'],
    users: [{ id: 'staff-1', name: 'Office Member', role: 'OFFICE_STAFF', department: 'CAD' }],
    departments: [{ id: 'CAD', name: 'CAD' }],
  });
  services.getFeatureAudit.mockResolvedValue({ items: [], nextCursor: null });
  services.updateFeaturePermission.mockResolvedValue({});
  services.bulkUpdateFeaturePermissions.mockResolvedValue({});
});

describe('Feature management', () => {
  it('shows an unconfigured catalog with inheritance and no internal setup commands', async () => {
    renderPage();
    expect(await screen.findByText('Metal Inventory')).toBeInTheDocument();
    expect(screen.getByText('Using inherited permissions')).toBeInTheDocument();
    expect(screen.queryByText(/seed-modules|Debug:|npx/)).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Metal Inventory access' })).toBeDisabled();
    expect(screen.getByText(/Administrator access stays available/)).toBeInTheDocument();
  });

  it('edits the exact selected user scope and keeps permission bits coherent', async () => {
    const user = userEvent.setup(); renderPage();
    await screen.findByText('Metal Inventory');
    await user.click(screen.getByRole('button', { name: 'Users' }));
    await user.selectOptions(screen.getByLabelText('User'), 'staff-1');
    await user.click(screen.getByRole('checkbox', { name: 'Metal Inventory read' }));
    await waitFor(() => expect(services.updateFeaturePermission.mock.calls[0]?.[0]).toEqual({
      featureId: 'METAL_INVENTORY', scope: { type: 'user', id: 'staff-1' },
      isEnabled: true, canRead: false, canWrite: false, canDelete: false,
    }));
  });

  it('can restore a department override to inherited permissions', async () => {
    services.getAllFeatures.mockResolvedValue([{ ...metal, override: {
      id: 'override-1', featureId: metal.id, departmentId: 'CAD', isEnabled: false,
      canRead: true, canWrite: false, canDelete: false,
    } }]);
    const user = userEvent.setup(); renderPage();
    await screen.findByText('Metal Inventory');
    await user.click(screen.getByRole('button', { name: 'Departments' }));
    await user.selectOptions(screen.getByLabelText('Department'), 'CAD');
    await user.click(screen.getByRole('button', { name: 'Use inherited permissions for Metal Inventory' }));
    await waitFor(() => expect(services.updateFeaturePermission.mock.calls[0]?.[0]).toEqual({
      featureId: 'METAL_INVENTORY', scope: { type: 'department', id: 'CAD' }, inherit: true,
    }));
  });

  it('requires confirmation before disabling all selected scope modules', async () => {
    const user = userEvent.setup(); renderPage();
    await screen.findByText('Metal Inventory');
    await user.selectOptions(screen.getByLabelText('Role'), 'OFFICE_STAFF');
    await user.click(screen.getByRole('button', { name: 'Disable all' }));
    expect(services.bulkUpdateFeaturePermissions).not.toHaveBeenCalled();
    const confirm = screen.getByRole('group', { name: 'Confirm bulk permission change' });
    await user.click(within(confirm).getByRole('button', { name: 'Confirm disable all' }));
    await waitFor(() => expect(services.bulkUpdateFeaturePermissions.mock.calls[0]?.[0]).toEqual({
      scope: { type: 'role', id: 'OFFICE_STAFF' }, featureIds: ['METAL_INVENTORY'],
      isEnabled: false,
    }));
  });

  it('shows audit actor and reset changes without exposing raw internal objects', async () => {
    services.getFeatureAudit.mockResolvedValue({ items: [{
      id: 'audit-1', actorName: 'Administrator', action: 'FEATURE_PERMISSION_UPDATED',
      createdAt: '2026-11-01T07:00:00Z', oldValues: {},
      newValues: { featureName: 'METAL_INVENTORY', scope: { type: 'role', id: 'OFFICE_STAFF' }, permission: null },
    }], nextCursor: null });
    renderPage();
    expect(await within(screen.getByRole('region', { name: 'Permission activity' })).findByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText(/Restored inheritance/)).toBeInTheDocument();
  });

  it('keeps a mutation error visible and offers retry for loading failures', async () => {
    services.getAllFeatures.mockRejectedValue(new Error('Network unavailable'));
    const user = userEvent.setup(); renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load feature permissions');
    services.getAllFeatures.mockResolvedValue([metal]);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Metal Inventory')).toBeInTheDocument();
  });

  it('refreshes an unconfirmed save and prevents scope changes while it is pending', async () => {
    let rejectSave: (error: Error) => void = () => {};
    services.updateFeaturePermission.mockImplementation(() => new Promise((_resolve, reject) => { rejectSave = reject; }));
    const user = userEvent.setup(); renderPage();
    await screen.findByText('Metal Inventory');
    await user.selectOptions(screen.getByLabelText('Role'), 'OFFICE_STAFF');
    await user.click(screen.getByRole('checkbox', { name: 'Metal Inventory access' }));
    expect(screen.getByRole('button', { name: 'Users' })).toBeDisabled();
    expect(screen.getByLabelText('Role')).toBeDisabled();
    services.getAllFeatures.mockResolvedValue([{ ...metal, override: { isEnabled: false, canRead: true, canWrite: false, canDelete: false } }]);
    rejectSave(new Error('Response lost after commit'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Save could not be confirmed');
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Metal Inventory access' })).not.toBeChecked());
    expect(screen.getByLabelText('Role')).toHaveValue('OFFICE_STAFF');
  });

  it('disables bulk controls if a cached catalog cannot be refreshed', async () => {
    const user = userEvent.setup(); const view = renderPage();
    await screen.findByText('Metal Inventory');
    await user.selectOptions(screen.getByLabelText('Role'), 'OFFICE_STAFF');
    await screen.findByRole('checkbox', { name: 'Metal Inventory access' });
    services.getAllFeatures.mockRejectedValue(new Error('Refresh failed'));
    await view.client.invalidateQueries({ queryKey: ['features'] });
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load feature permissions');
    expect(screen.getByRole('button', { name: 'Enable all' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Disable all' })).toBeDisabled();
  });

  it('distinguishes catalog configuration from permission changes in activity', async () => {
    services.getFeatureAudit.mockResolvedValue({ items: [{ id: 'configured', action: 'CONFIGURE', actorName: 'Administrator', createdAt: '2026-11-01T07:00:00Z', newValues: { featureName: 'METAL_INVENTORY' } }], nextCursor: null });
    renderPage();
    expect(await screen.findByText(/Configured module/)).toBeInTheDocument();
    expect(screen.getByText('Catalog configuration saved')).toBeInTheDocument();
    expect(screen.queryByText(/Updated permissions/)).not.toBeInTheDocument();
  });
});
