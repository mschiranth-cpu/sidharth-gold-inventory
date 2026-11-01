import type { Request, Response } from 'express';

const mockQuery = jest.fn();

jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
  PrismaClient: jest.fn(() => ({ $queryRawUnsafe: mockQuery })),
}));
jest.mock('../../src/modules/auth/auth.middleware', () => ({
  authenticate: jest.fn(),
  requireRoles: jest.fn(() => jest.fn()),
}));
jest.mock('../../src/utils/logger', () => ({ logger: { error: jest.fn() } }));
jest.mock('../../src/config', () => ({ config: { nodeEnv: 'test' } }));
jest.mock('../../src/config/security.config', () => ({ securityConfig: {} }));

import router from '../../src/routes/vendors.routes';

function handlerFor(path: string) {
  return router.stack.find((layer: any) => layer.route?.path === path)!.route.stack[0].handle;
}

async function invoke(path: string) {
  const req = { params: { id: 'vendor-test' }, query: {} } as unknown as Request;
  const res = { json: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  const next = jest.fn();
  await handlerFor(path)(req, res as unknown as Response, next);
  // asyncHandler forwards a rejected route promise to Express's error middleware.
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('vendor aging routes', () => {
  beforeEach(() => mockQuery.mockReset());

  it.each(['/aging', '/:id/aging'])('forwards a failed summary query for %s', async (path) => {
    const error = new Error('database query failed');
    mockQuery.mockRejectedValueOnce(error);
    const { res, next } = await invoke(path);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('forwards a failed line-item query without leaving an unhandled rejection', async () => {
    const error = new Error('line-item query failed');
    mockQuery.mockResolvedValueOnce([{ vendorId: 'vendor-test' }]).mockRejectedValueOnce(error);
    const { res, next } = await invoke('/:id/aging');
    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('returns the aggregate aging response', async () => {
    const rows = [{ vendorId: 'vendor-test', totalOpen: 42 }];
    mockQuery.mockResolvedValueOnce(rows);
    const { res, next } = await invoke('/aging');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: rows });
    expect(next).not.toHaveBeenCalled();
  });

  it('keeps per-vendor parameters and response shape', async () => {
    const summary = { vendorId: 'vendor-test', totalOpen: 42 };
    const lineItems = [{ id: 'transaction-test', balance: 42 }];
    mockQuery.mockResolvedValueOnce([summary]).mockResolvedValueOnce(lineItems);
    const { res, next } = await invoke('/:id/aging');
    expect(mockQuery).toHaveBeenNthCalledWith(1, expect.any(String), 'vendor-test');
    expect(mockQuery).toHaveBeenNthCalledWith(2, expect.any(String), 'vendor-test');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { ...summary, lineItems } });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 without querying line items for an unknown vendor', async () => {
    mockQuery.mockResolvedValueOnce([]);
    const { res, next } = await invoke('/:id/aging');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Vendor not found' });
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });
});
