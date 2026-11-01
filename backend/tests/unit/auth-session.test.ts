import { Request, Response, NextFunction } from 'express';

jest.mock('../../src/config', () => ({ config: { jwtSecret: 'unit-only', jwtExpiresIn: '15m' } }));
jest.mock('../../src/utils/logger', () => ({ logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('../../src/modules/auth/auth.service', () => ({ verifyAccessToken: jest.fn(), getUserById: jest.fn(), checkRateLimit: jest.fn(), recordLoginAttempt: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ __esModule: true, default: { verify: jest.fn(), TokenExpiredError: class extends Error {}, JsonWebTokenError: class extends Error {} } }));

import jwt from 'jsonwebtoken';
import { authenticate as currentAuthenticate, optionalAuth } from '../../src/modules/auth/auth.middleware';
import { authenticate as legacyAuthenticate } from '../../src/middleware/auth';
import { getUserById, verifyAccessToken } from '../../src/modules/auth/auth.service';

const claims = { userId: 'synthetic-user', id: 'synthetic-user', email: 'old@example.invalid', role: 'ADMIN' };
const currentUser = { id: 'synthetic-user', email: 'current@example.invalid', role: 'DEPARTMENT_WORKER', isActive: true };

function harness() {
  const req = { headers: { authorization: 'Bearer unit-session' }, path: '/test' } as unknown as Request;
  const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  const next = jest.fn() as jest.Mock & NextFunction;
  return { req, res, next };
}

beforeEach(() => {
  jest.clearAllMocks();
  (verifyAccessToken as jest.Mock).mockReturnValue(claims);
  (jwt.verify as jest.Mock).mockReturnValue(claims);
  (getUserById as jest.Mock).mockResolvedValue(currentUser);
});

describe.each([['current', currentAuthenticate], ['legacy', legacyAuthenticate], ['optional', optionalAuth]] as const)('%s session authentication', (_name, middleware) => {
  test('uses current database role and email after a session is demoted', async () => {
    const { req, res, next } = harness();
    await middleware(req, res, next);
    expect(getUserById).toHaveBeenCalledWith(claims.userId);
    expect((req as any).user).toMatchObject({ userId: currentUser.id, email: currentUser.email, role: currentUser.role });
    expect(next).toHaveBeenCalledWith();
  });

  test('rejects an existing session immediately after account deactivation', async () => {
    (getUserById as jest.Mock).mockResolvedValue({ ...currentUser, isActive: false });
    const { req, res, next } = harness();
    await middleware(req, res, next);
    expect((req as any).user).toBeUndefined();
    const status = (res.status as jest.Mock).mock.calls[0]?.[0] ?? next.mock.calls[0]?.[0]?.statusCode;
    expect(status).toBe(403);
  });

  test('rejects a deleted account instead of trusting its signed claims', async () => {
    (getUserById as jest.Mock).mockResolvedValue(null);
    const { req, res, next } = harness();
    await middleware(req, res, next);
    expect((req as any).user).toBeUndefined();
    const status = (res.status as jest.Mock).mock.calls[0]?.[0] ?? next.mock.calls[0]?.[0]?.statusCode;
    expect(status).toBe(401);
  });

  test('fails closed when current account status cannot be checked', async () => {
    (getUserById as jest.Mock).mockRejectedValue(new Error('lookup unavailable'));
    const { req, res, next } = harness();
    await middleware(req, res, next);
    expect((req as any).user).toBeUndefined();
    expect(next).not.toHaveBeenCalledWith();
    expect((res.status as jest.Mock).mock.calls[0]?.[0] === 500 || next.mock.calls[0]?.[0] instanceof Error).toBe(true);
  });
});

test('optional authentication still allows an anonymous request', async () => {
  const { req, res, next } = harness();
  req.headers = {};
  await optionalAuth(req, res, next);
  expect(getUserById).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith();
});

test('optional authentication ignores a malformed token without granting an identity', async () => {
  (verifyAccessToken as jest.Mock).mockImplementation(() => { throw new Error('invalid signature'); });
  const { req, res, next } = harness();
  await optionalAuth(req, res, next);
  expect((req as any).user).toBeUndefined();
  expect(getUserById).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith();
});
