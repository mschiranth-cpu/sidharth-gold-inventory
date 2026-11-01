import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeatureAccessBoundary from '../../components/auth/FeatureAccessBoundary';
const access = vi.hoisted(() => ({ isChecking: false, isError: false, isAdmin: false, canUsePath: vi.fn(), refetch: vi.fn() }));
vi.mock('../../hooks/useFeatures', () => ({ useFeatures: () => access }));
function show(path = '/app/inventory/metal') {
  return render(<MemoryRouter initialEntries={[path]}><FeatureAccessBoundary><p>Private module content</p></FeatureAccessBoundary></MemoryRouter>);
}
beforeEach(() => { access.isChecking = false; access.isError = false; access.isAdmin = false; access.canUsePath.mockReturnValue(true); });
describe('Feature access boundary', () => {
  it('does not mount protected module children before permissions are known', () => {
    access.isChecking = true; show();
    expect(screen.getByRole('status')).toHaveTextContent('Checking module access');
    expect(screen.queryByText('Private module content')).not.toBeInTheDocument();
  });
  it('denies a deep link without mounting module children', () => {
    access.canUsePath.mockReturnValue(false); show('/app/diamonds/purchase-orders/123');
    expect(screen.getByRole('alert')).toHaveTextContent('Module access unavailable');
    expect(screen.queryByText('Private module content')).not.toBeInTheDocument();
  });
  it('preserves administrator recovery and client profile access', () => {
    access.isError = true; access.canUsePath.mockReturnValue(false); access.isAdmin = true;
    const view = show('/app/admin/features'); expect(screen.getByText('Private module content')).toBeInTheDocument(); view.unmount();
    access.isAdmin = false; show('/client/profile'); expect(screen.getByText('Private module content')).toBeInTheDocument();
  });
  it('shows a retry state when checking permissions fails', () => {
    access.isError = true; show();
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to check module access');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('Private module content')).not.toBeInTheDocument();
  });
});
