const mockFeatures = jest.fn();
const mockOverview = jest.fn();
const mockWorkerOverview = jest.fn();
jest.mock('../../src/modules/features/features.service', () => ({ getUserFeatures: mockFeatures }));
jest.mock('../../src/modules/dashboard/dashboard.service', () => ({ getDashboardOverview: mockOverview, getWorkerOverview: mockWorkerOverview }));
jest.mock('../../src/utils/logger', () => ({ logger: { error: jest.fn() } }));

import { filterDashboardFeatures, filterWorkerDashboardFeatures } from '../../src/modules/features/features.dashboard';
import { handleGetOverview, handleGetWorkerOverview } from '../../src/modules/dashboard/dashboard.controller';
import type { DashboardOverview, WorkerDashboardOverview } from '../../src/modules/dashboard/dashboard.types';

const permission = { hasAccess: true, canRead: true, canWrite: true, canDelete: true };
const allowed = Object.fromEntries(['METAL_INVENTORY', 'DIAMOND_INVENTORY', 'REAL_STONE_INVENTORY', 'STONE_INVENTORY', 'ATTENDANCE'].map((key) => [key, permission]));
const snapshot = {
  metalStockGrams: 10, diamondPieces: 20, realStonePieces: 30, stonePackets: 40,
  lowStockItems: [
    { id: 'm', type: 'METAL', label: 'Metal', quantity: 1, threshold: 2 },
    { id: 'd', type: 'DIAMOND', label: 'Diamond', quantity: 1, threshold: 2 },
    { id: 's', type: 'STONE_PACKET', label: 'Stone', quantity: 1, threshold: 2 },
  ],
};
const data = {
  kpis: { totalOrders: 5 }, metalsInProcess: { gold: 7 }, vendorOutstanding: [{ vendorId: 'fixture' }],
  inventorySnapshot: snapshot, attendanceToday: { present: 1, absent: 2, onLeave: 3, totalEmployees: 6 },
  meta: { cached: true },
} as unknown as DashboardOverview;
const worker = { myMetrics: { total: 4 }, myAttendanceToday: { status: 'PRESENT', checkInTime: '2026-01-01T09:00:00Z', checkOutTime: null }, meta: { cached: true } } as unknown as WorkerDashboardOverview;

beforeEach(() => {
  jest.resetAllMocks(); mockFeatures.mockResolvedValue(allowed); mockOverview.mockResolvedValue(data); mockWorkerOverview.mockResolvedValue(worker);
});

describe('dashboard feature projection', () => {
  it('keeps all allowed values unchanged', () => {
    expect(filterDashboardFeatures(data, allowed)).toEqual(data);
    expect(filterWorkerDashboardFeatures(worker, allowed)).toEqual(worker);
  });

  it.each([
    ['METAL_INVENTORY', 'metalStockGrams', 'METAL'],
    ['DIAMOND_INVENTORY', 'diamondPieces', 'DIAMOND'],
    ['REAL_STONE_INVENTORY', 'realStonePieces', null],
    ['STONE_INVENTORY', 'stonePackets', 'STONE_PACKET'],
  ])('redacts only %s fields and resource alerts', (feature, field, alertType) => {
    const result = filterDashboardFeatures(data, { ...allowed, [feature!]: { ...permission, canRead: false } });
    expect(result.inventorySnapshot[field as keyof typeof result.inventorySnapshot]).toBeNull();
    if (alertType) expect(result.inventorySnapshot.lowStockItems.some((item) => item.type === alertType)).toBe(false);
    expect(result.kpis).toEqual(data.kpis); expect(result.metalsInProcess).toEqual(data.metalsInProcess); expect(result.vendorOutstanding).toEqual(data.vendorOutstanding);
    expect(data.inventorySnapshot[field as keyof typeof snapshot]).not.toBeNull();
  });

  it('redacts staff and worker attendance when attendance is disabled', () => {
    const flags = { ...allowed, ATTENDANCE: { ...permission, hasAccess: false } };
    expect(filterDashboardFeatures(data, flags).attendanceToday).toBeNull();
    expect(filterWorkerDashboardFeatures(worker, flags).myAttendanceToday).toBeNull();
    expect(worker.myAttendanceToday).not.toBeNull();
  });

  it('fails closed for missing policy entries without changing shared cached objects', () => {
    const result = filterDashboardFeatures(data, {});
    expect(result.inventorySnapshot).toMatchObject({ metalStockGrams: null, diamondPieces: null, realStonePieces: null, stonePackets: null, lowStockItems: [] });
    expect(result.attendanceToday).toBeNull(); expect(data.inventorySnapshot).toEqual(snapshot);
  });
});

describe('dashboard response enforcement after cached aggregation', () => {
  const req: any = { query: {}, user: { userId: 'worker' } };
  const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  it('uses fresh policy on every response even when the aggregate is cached', async () => {
    const first = response(); await handleGetOverview(req, first as any, jest.fn());
    mockFeatures.mockResolvedValue({ ...allowed, METAL_INVENTORY: { ...permission, canRead: false } });
    const second = response(); await handleGetOverview(req, second as any, jest.fn());
    expect(first.json.mock.calls[0][0].data.inventorySnapshot.metalStockGrams).toBe(10);
    expect(second.json.mock.calls[0][0].data.inventorySnapshot.metalStockGrams).toBeNull();
    expect(mockFeatures).toHaveBeenCalledTimes(2); expect(data.inventorySnapshot.metalStockGrams).toBe(10);
  });

  it('does not return cached data if fresh policy lookup fails', async () => {
    mockFeatures.mockRejectedValue(new Error('policy unavailable'));
    const res = response(); await handleGetOverview(req, res as any, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500); expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('also enforces attendance policy on the cached worker response', async () => {
    mockFeatures.mockResolvedValue({ ...allowed, ATTENDANCE: { ...permission, canRead: false } });
    const res = response(); await handleGetWorkerOverview(req, res as any, jest.fn());
    expect(res.json.mock.calls[0][0].data.myAttendanceToday).toBeNull();
  });
});
