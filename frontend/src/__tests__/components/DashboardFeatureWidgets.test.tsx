import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventorySnapshotWidget } from '../../modules/dashboard/components/v2/InventorySnapshotWidget';
import { AttendanceTodayWidget } from '../../modules/dashboard/components/v2/AttendanceTodayWidget';
import { WorkerHero } from '../../modules/dashboard/components/v2/WorkerHero';
import { QuickActionsBar } from '../../modules/dashboard/components/v2/QuickActionsBar';
import { MemoryRouter } from 'react-router-dom';
const access = vi.hoisted(() => ({ isChecking: false, isError: false, canUsePath: vi.fn() }));
vi.mock('../../hooks/useFeatures', () => ({ useFeatures: () => access }));
const snapshot = {
  metalStockGrams: 999, diamondPieces: 11, realStonePieces: 22, stonePackets: 333,
  lowStockItems: [{ id: 'hidden-metal', type: 'METAL' as const, label: 'Restricted metal item', quantity: 1, threshold: 2 }, { id: 'visible-diamond', type: 'DIAMOND' as const, label: 'Visible diamond item', quantity: 1, threshold: 2 }],
};
const rates = { gold24k: null, gold22k: null, gold18k: null, silver: null, platinum: null, palladium: null, fetchedAt: null, healthy: false, ageMs: 0 };
beforeEach(() => { access.isChecking = false; access.isError = false; access.canUsePath.mockReturnValue(true); });
describe('Dashboard policy-sensitive widgets', () => {
  it('hides denied inventory fields and low-stock details even from an old cached response', () => {
    access.canUsePath.mockImplementation((path: string) => !path.includes('/metal') && !path.includes('/stone-packets'));
    render(<InventorySnapshotWidget data={snapshot} />);
    expect(screen.queryByText('Metal stock')).not.toBeInTheDocument();
    expect(screen.queryByText('Stone packets')).not.toBeInTheDocument();
    expect(screen.queryByText('Restricted metal item')).not.toBeInTheDocument();
    expect(screen.getByText('Diamonds')).toBeInTheDocument();
    expect(screen.getByText('Visible diamond item')).toBeInTheDocument();
  });
  it('hides the inventory widget and its navigation when no module is readable', () => {
    access.canUsePath.mockReturnValue(false);
    render(<InventorySnapshotWidget data={snapshot} onOpen={vi.fn()} />);
    expect(screen.queryByText('Inventory Pulse')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument();
  });
  it('does not turn redacted inventory fields into a false zero', () => {
    render(<InventorySnapshotWidget data={{ ...snapshot, metalStockGrams: null } as any} />);
    expect(screen.queryByText('Metal stock')).not.toBeInTheDocument();
    expect(screen.getByText('Diamonds')).toBeInTheDocument();
  });
  it('hides denied attendance totals and navigation', () => {
    access.canUsePath.mockReturnValue(false);
    render(<AttendanceTodayWidget data={{ present: 20, absent: 2, onLeave: 1, totalEmployees: 23 }} onOpen={vi.fn()} />);
    expect(screen.queryByText("Today's Attendance")).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument();
  });
  it('keeps the worker greeting and rates while hiding redacted attendance', () => {
    render(<WorkerHero userName="Worker Member" attendance={null as any} department="CAD" rates={rates} generatedAt={null} />);
    expect(screen.getByText('Worker')).toBeInTheDocument();
    expect(screen.queryByText('Not checked in')).not.toBeInTheDocument();
    expect(screen.getByText('Gold 24K')).toBeInTheDocument();
  });
  it('hides the disabled inventory shortcut while preserving general order/report actions', () => {
    access.canUsePath.mockImplementation((path: string) => path !== '/app/inventory');
    render(<MemoryRouter><QuickActionsBar role="OFFICE_STAFF" /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Inventory' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reports' })).toBeInTheDocument();
  });
});
