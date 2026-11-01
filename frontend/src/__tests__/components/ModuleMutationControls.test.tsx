import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RateManagementPage from '../../pages/inventory/RateManagementPage';
import DiamondRateManagementPage from '../../pages/inventory/DiamondRateManagementPage';
import RealStoneRateManagementPage from '../../pages/inventory/RealStoneRateManagementPage';
import DiamondLotsPage from '../../pages/inventory/DiamondLotsPage';
import PayrollDashboard from '../../pages/payroll/PayrollDashboard';
import CreatePayrollPeriodPage from '../../pages/payroll/CreatePayrollPeriodPage';
import SalaryStructurePage from '../../pages/payroll/SalaryStructurePage';
import ProcessPayrollPage from '../../pages/payroll/ProcessPayrollPage';
import EmployeeAdvancesPage from '../../pages/payroll/EmployeeAdvancesPage';
import EmployeeLoansPage from '../../pages/payroll/EmployeeLoansPage';

const state = vi.hoisted(() => ({ role: 'ADMIN', write: true, mutate: vi.fn(), canPerform: vi.fn() }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'fixture', role: state.role }, isAuthenticated: true }) }));
vi.mock('../../hooks/useFeatures', () => ({ useFeatures: () => ({ canPerform: state.canPerform }) }));
vi.mock('../../contexts/RefreshIntervalContext', () => ({ useRefreshInterval: () => 0 }));
vi.mock('../../components/LiveMetalRatesCard', () => ({ default: () => null }));
vi.mock('../../components/RefreshIntervalPicker', () => ({ default: () => null }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: any) => ({ data: queryKey[0] === 'salary-structure' ? undefined : queryKey[0] === 'payroll-periods' ? [{ id: 'period', status: 'DRAFT', month: 1, year: 2026, startDate: '2026-01-01', endDate: '2026-01-31', workingDays: 26 }] : [], isLoading: false, isFetching: false, refetch: vi.fn() }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ mutate: state.mutate, isPending: false }),
}));
const show = (Page: React.ComponentType) => render(<MemoryRouter><Page /></MemoryRouter>);
beforeEach(() => { state.role = 'ADMIN'; state.write = true; state.mutate.mockReset(); state.canPerform.mockReset().mockImplementation((_module: string, operation: string) => operation !== 'write' || state.write); });

describe('Inline module mutation controls', () => {
  it.each([
    ['metal rates', RateManagementPage, 'Add Rate'], ['diamond rates', DiamondRateManagementPage, 'Add Rate'],
    ['real-stone rates', RealStoneRateManagementPage, 'Add Rate'], ['diamond lots', DiamondLotsPage, 'Create Lot'],
    ['payroll periods', PayrollDashboard, 'Create Payroll Period'], ['new payroll period', CreatePayrollPeriodPage, 'Create Period'],
    ['salary structure', SalaryStructurePage, 'Save Salary Structure'], ['payroll processing', ProcessPayrollPage, 'Process Payroll'],
    ['advances', EmployeeAdvancesPage, 'Give Advance'], ['loans', EmployeeLoansPage, 'Give Loan'],
  ] as const)('disables %s mutation controls when write access is unavailable', (_label, Page, button) => {
    state.write = false; show(Page);
    expect(screen.getByRole('button', { name: button })).toBeDisabled();
    expect(state.canPerform).toHaveBeenCalledWith(expect.any(String), 'write');
  });
  it.each([DiamondRateManagementPage, RealStoneRateManagementPage])('preserves the backend ADMIN-only rate-editing baseline', (Page) => {
    state.role = 'FACTORY_MANAGER'; show(Page);
    expect(screen.getByRole('button', { name: 'Add Rate' })).toBeDisabled();
  });
  it.each([
    [RateManagementPage, 'Add Rate', 'METAL_INVENTORY'], [DiamondRateManagementPage, 'Add Rate', 'DIAMOND_INVENTORY'],
    [RealStoneRateManagementPage, 'Add Rate', 'REAL_STONE_INVENTORY'], [DiamondLotsPage, 'Create Lot', 'DIAMOND_INVENTORY'],
    [PayrollDashboard, 'Create Payroll Period', 'PAYROLL'],
  ] as const)('keeps an authorized administrator action available for its exact module', (Page, button, module) => {
    show(Page); expect(screen.getByRole('button', { name: button })).toBeEnabled();
    expect(state.canPerform).toHaveBeenCalledWith(module, 'write');
  });
  it('allows Office lot creation but prevents an already-open form from submitting after write access is revoked', () => {
    state.role = 'OFFICE_STAFF'; const view = show(DiamondLotsPage);
    fireEvent.click(screen.getByRole('button', { name: 'Create Lot' }));
    expect(screen.getByText('New Lot')).toBeInTheDocument();
    state.write = false; view.rerender(<MemoryRouter><DiamondLotsPage /></MemoryRouter>);
    expect(screen.queryByText('New Lot')).not.toBeInTheDocument();
    expect(state.mutate).not.toHaveBeenCalled();
  });
  it('retains read filters and export controls while disabling rate changes', () => {
    state.write = false; show(RateManagementPage);
    expect(screen.getByRole('button', { name: 'Refresh rates' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a rate' })).not.toBeInTheDocument();
  });
  it('rejects a forced payroll form submission without write permission', () => {
    state.write = false; const view = show(CreatePayrollPeriodPage);
    fireEvent.submit(view.container.querySelector('form')!);
    expect(state.mutate).not.toHaveBeenCalled();
  });
  it('does not expose payroll mutation actions to a read-only Factory Manager', () => {
    state.role = 'FACTORY_MANAGER'; show(PayrollDashboard);
    expect(screen.getByRole('button', { name: 'Create Payroll Period' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Process Payroll' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'View Details' })).toBeEnabled();
  });
});
