import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Sidebar from '../../components/layout/Sidebar';
const state = vi.hoisted(() => ({ user: { id: 'staff', name: 'Office Member', role: 'OFFICE_STAFF' }, logout: vi.fn() }));
const allowed = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => state }));
vi.mock('../../hooks/useFeatures', () => ({ useFeatures: () => ({ canUsePath: allowed }) }));
beforeEach(() => { state.user.role = 'OFFICE_STAFF'; allowed.mockReturnValue(true); });
function show() { return render(<MemoryRouter><Sidebar sidebarOpen={false} setSidebarOpen={vi.fn()} /></MemoryRouter>); }
describe('Feature-aware sidebar', () => {
  it('keeps existing role exclusions even when all feature flags allow access', () => {
    show();
    expect(screen.queryByRole('link', { name: /Factory Inventory/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Users/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Orders/ })).toBeInTheDocument();
  });
  it('removes an empty inventory group when its feature children are all denied', () => {
    allowed.mockImplementation((path: string) => !path.startsWith('/app/inventory') && !path.startsWith('/app/diamonds'));
    show();
    expect(screen.queryByRole('link', { name: /Main Inventory/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Orders/ })).toBeInTheDocument();
  });
});
