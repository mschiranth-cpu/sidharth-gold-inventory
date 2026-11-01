const mockDb: any = {
  featureModule: { findMany: jest.fn(), upsert: jest.fn() },
  featurePermission: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  auditLog: { create: jest.fn(), findMany: jest.fn() },
  metalTransaction: { findMany: jest.fn() }, diamondTransaction: { findMany: jest.fn() },
  realStoneTransaction: { findMany: jest.fn() }, stonePacketTransaction: { findMany: jest.fn() },
  vendor: { findMany: jest.fn() },
  $transaction: jest.fn(),
};
const mockOwnProfile = jest.fn();
const mockUpdateClient = jest.fn();

jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
  PrismaClient: jest.fn(() => mockDb),
}));
jest.mock('../../src/utils/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn() } }));
jest.mock('../../src/config', () => ({ config: { nodeEnv: 'test' } }));
jest.mock('../../src/config/security.config', () => ({ securityConfig: {} }));
jest.mock('../../src/modules/clients/clients.service', () => ({ getClientByUserId: mockOwnProfile, updateClient: mockUpdateClient }));
jest.mock('../../src/modules/auth/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if (!req.headers['x-test-user']) return res.status(401).json({ success: false });
    req.user = { userId: req.headers['x-test-user'], role: req.headers['x-test-role'] };
    next();
  },
  requireRoles: (...roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ success: false });
    next();
  },
}));

import express from 'express';
import request from 'supertest';
import {
  getAllFeatureModules, getUserFeatures, updateFeaturePermission,
  bulkUpdateFeaturePermissions, getFeatureSubjects, getFeatureAudit,
} from '../../src/modules/features/features.service';
import { requireFeature } from '../../src/modules/features/features.middleware';
import featuresRouter from '../../src/modules/features/features.routes';
import clientsRouter from '../../src/modules/clients/clients.routes';
import vendorsRouter from '../../src/routes/vendors.routes';

const admin = { id: 'admin', name: 'Admin', role: 'ADMIN', department: null, isActive: true };
const worker = { id: 'worker', name: 'Worker', role: 'DEPARTMENT_WORKER', department: 'CAD', isActive: true };
const row = (permission: any = {}) => ({ id: 'permission', featureId: 'stored-metal', userId: null, role: null, departmentId: null, isEnabled: true, canRead: true, canWrite: true, canDelete: true, ...permission });
const moduleRow = (permissions: any[] = [], extra: any = {}) => ({ id: 'stored-metal', name: 'metal_inventory', displayName: 'Metal Inventory', isGlobal: false, permissions, ...extra });

beforeEach(() => {
  jest.resetAllMocks();
  mockDb.featureModule.findMany.mockResolvedValue([]);
  mockDb.user.findUnique.mockImplementation(({ where }: any) => Promise.resolve(where.id === 'admin' ? admin : where.id === 'worker' ? worker : where.id === 'office' ? { ...worker, id: 'office', role: 'OFFICE_STAFF' } : where.id === 'client' ? { ...worker, id: 'client', role: 'CLIENT', department: null } : null));
  mockDb.user.findMany.mockResolvedValue([admin, worker]);
  mockDb.$transaction.mockImplementation((callback: any) => callback(mockDb));
  mockDb.featureModule.upsert.mockImplementation(({ create }: any) => Promise.resolve({ id: 'new-module', ...create, permissions: [] }));
  mockDb.featurePermission.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'created', ...data }));
  mockDb.featurePermission.update.mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data }));
  mockDb.featurePermission.deleteMany.mockResolvedValue({ count: 1 });
  mockDb.auditLog.create.mockResolvedValue({ id: 'audit' });
  mockOwnProfile.mockResolvedValue({ id: 'own-client', userId: 'client', businessName: 'Own business' });
  mockUpdateClient.mockImplementation((id, data) => Promise.resolve({ id, ...data }));
  for (const model of ['metalTransaction', 'diamondTransaction', 'realStoneTransaction', 'stonePacketTransaction', 'vendor']) mockDb[model].findMany.mockResolvedValue([]);
});

describe('feature catalog and inheritance', () => {
  it('returns all eight virtual modules without writes when the database is empty', async () => {
    const modules = await getAllFeatureModules();
    expect(modules).toHaveLength(8);
    expect(modules.map((m: any) => m.name)).toEqual(expect.arrayContaining(['CLIENT_PORTAL', 'METAL_INVENTORY', 'REAL_STONE_INVENTORY', 'STONE_INVENTORY']));
    expect(modules.some((m: any) => m.name.includes('PARTY'))).toBe(false);
    expect(modules.every((m: any) => !m.isConfigured)).toBe(true);
    expect(mockDb.featureModule.upsert).not.toHaveBeenCalled();
    expect(mockDb.featurePermission.create).not.toHaveBeenCalled();
  });

  it('keeps current access when no feature policy is configured', async () => {
    const features = await getUserFeatures('worker');
    expect(features.METAL_INVENTORY).toMatchObject({ hasAccess: true, canRead: true, canWrite: true, canDelete: true, source: 'default' });
  });

  it('resolves a user override before department and role overrides', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([
      row({ id: 'role', role: 'DEPARTMENT_WORKER', isEnabled: false }),
      row({ id: 'department', departmentId: 'CAD', isEnabled: false }),
      row({ id: 'user', userId: 'worker', canWrite: false, canDelete: false }),
    ])]);
    const features = await getUserFeatures('worker');
    expect(features.METAL_INVENTORY).toMatchObject({ hasAccess: true, canRead: true, canWrite: false, source: 'user' });
  });

  it('preserves a legacy user override carrying a role without applying it to that role', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ userId: 'worker', role: 'DEPARTMENT_WORKER', isEnabled: false })])]);
    expect((await getUserFeatures('worker')).METAL_INVENTORY).toMatchObject({ hasAccess: false, source: 'user' });
    const catalog = await getAllFeatureModules({ type: 'role', id: 'DEPARTMENT_WORKER' });
    expect(catalog.find((feature) => feature.name === 'METAL_INVENTORY')).toMatchObject({ override: null, effective: { hasAccess: true, source: 'default' } });
  });

  it('resolves a department override before a role override', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([
      row({ role: 'DEPARTMENT_WORKER' }), row({ departmentId: 'CAD', isEnabled: false }),
    ])]);
    expect((await getUserFeatures('worker')).METAL_INVENTORY).toMatchObject({ hasAccess: false, canRead: false, canWrite: false, canDelete: false, source: 'department' });
  });

  it('resolves legacy duplicate department rows by latest change, independently of database row order', async () => {
    const older = row({ id: 'older', departmentId: 'CAD', isEnabled: true, enabledAt: new Date('2026-01-01') });
    const newer = row({ id: 'newer', departmentId: 'CAD', isEnabled: false, enabledAt: new Date('2026-02-01') });
    for (const permissions of [[older, newer], [newer, older]]) {
      mockDb.featureModule.findMany.mockResolvedValue([moduleRow(permissions)]);
      expect((await getUserFeatures('worker')).METAL_INVENTORY).toMatchObject({ hasAccess: false, source: 'department' });
    }
    expect(mockDb.featurePermission.deleteMany).not.toHaveBeenCalled();
  });

  it('keeps admin recovery even if old stored data contains an admin denial', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ role: 'ADMIN', isEnabled: false })])]);
    expect((await getUserFeatures('admin')).METAL_INVENTORY).toMatchObject({ hasAccess: true, canRead: true, canWrite: true, canDelete: true, source: 'admin' });
    expect(mockDb.featureModule.findMany).not.toHaveBeenCalled();
  });

  it('merges aliases without duplicate catalog rows and retains the existing permission', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ role: 'OFFICE_STAFF', canDelete: false })])]);
    const modules = await getAllFeatureModules({ type: 'role', id: 'OFFICE_STAFF' });
    const metal = modules.find((m: any) => m.name === 'METAL_INVENTORY')!;
    expect(modules).toHaveLength(8);
    expect(metal).toMatchObject({ id: 'METAL_INVENTORY', isConfigured: true, override: { id: 'permission' }, effective: { canDelete: false, source: 'role' } });
  });
});

describe('scoped and bulk changes', () => {
  it('rejects a non-admin actor before writing', async () => {
    await expect(updateFeaturePermission({ featureId: 'METAL_INVENTORY', scope: { type: 'role', id: 'OFFICE_STAFF' }, isEnabled: false }, 'worker')).rejects.toMatchObject({ status: 403 });
    expect(mockDb.featureModule.upsert).not.toHaveBeenCalled();
  });

  it.each([
    { featureId: 'METAL_INVENTORY', role: 'OFFICE_STAFF', userId: 'worker', isEnabled: true },
    { featureId: 'METAL_INVENTORY', scope: { type: 'role', id: 'INVALID' }, isEnabled: true },
    { featureId: 'PARTY_METAL_INVENTORY', scope: { type: 'role', id: 'OFFICE_STAFF' }, isEnabled: true },
    { featureId: 'METAL_INVENTORY', scope: { type: 'department', id: 'INVALID' }, isEnabled: true },
    { featureId: 'METAL_INVENTORY', scope: { type: 'role', id: 'OFFICE_STAFF' }, isEnabled: 'true' },
    { featureId: 'METAL_INVENTORY', scope: { type: 'role', id: 'OFFICE_STAFF' }, isEnabled: true, canRead: false, canWrite: true },
  ])('rejects malformed changes before writes: %p', async (data) => {
    await expect(updateFeaturePermission(data as any, 'admin')).rejects.toMatchObject({ status: 400 });
    expect(mockDb.featurePermission.create).not.toHaveBeenCalled();
  });

  it('materializes only the requested feature and records the scoped change atomically', async () => {
    await updateFeaturePermission({ featureId: 'METAL_INVENTORY', scope: { type: 'role', id: 'OFFICE_STAFF' }, isEnabled: false, canRead: true, canWrite: true, canDelete: false }, 'admin');
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockDb.featureModule.upsert).toHaveBeenCalledTimes(1);
    expect(mockDb.featurePermission.create).toHaveBeenCalledWith({ data: expect.objectContaining({ featureId: 'new-module', userId: null, role: 'OFFICE_STAFF', departmentId: null, isEnabled: false, canWrite: true }) });
    expect(mockDb.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ entityType: 'FeaturePermission', userId: 'admin', newValues: expect.objectContaining({ featureName: 'METAL_INVENTORY', scope: { type: 'role', id: 'OFFICE_STAFF' } }) }) });
  });

  it('preserves an existing alias module id and omitted capability bits', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ role: 'OFFICE_STAFF', canWrite: false, canDelete: false })])]);
    await updateFeaturePermission({ featureId: 'stored-metal', role: 'OFFICE_STAFF', isEnabled: false }, 'admin');
    expect(mockDb.featureModule.upsert).not.toHaveBeenCalled();
    expect(mockDb.featurePermission.update).toHaveBeenCalledWith({ where: { id: 'permission' }, data: expect.objectContaining({ isEnabled: false, canWrite: false, canDelete: false }) });
  });

  it('resets only the exact scope including aliases, leaving user overrides intact', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ role: 'OFFICE_STAFF' }), row({ id: 'specific', userId: 'worker' })])]);
    await updateFeaturePermission({ featureId: 'METAL_INVENTORY', scope: { type: 'role', id: 'OFFICE_STAFF' }, inherit: true }, 'admin');
    expect(mockDb.featurePermission.deleteMany).toHaveBeenCalledWith({ where: { featureId: { in: ['stored-metal'] }, role: 'OFFICE_STAFF', userId: null, departmentId: null } });
    expect(mockDb.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: 'RESET', newValues: expect.objectContaining({ permission: null }) }) });
  });

  it('does not materialize a catalog row when resetting an inherited feature', async () => {
    await updateFeaturePermission({ featureId: 'METAL_INVENTORY', role: 'OFFICE_STAFF', inherit: true }, 'admin');
    expect(mockDb.featureModule.upsert).not.toHaveBeenCalled();
    expect(mockDb.featurePermission.create).not.toHaveBeenCalled();
  });

  it('can reset a legacy user-plus-role row without deleting the separate role policy', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ userId: 'worker', role: 'DEPARTMENT_WORKER', isEnabled: false })])]);
    await updateFeaturePermission({ featureId: 'METAL_INVENTORY', userId: 'worker', inherit: true }, 'admin');
    expect(mockDb.featurePermission.deleteMany).toHaveBeenCalledWith({ where: { featureId: { in: ['stored-metal'] }, userId: 'worker' } });
  });

  it.each([{ type: 'role', id: 'ADMIN' }, { type: 'user', id: 'admin' }])('protects admin recovery: %p', async (scope) => {
    await expect(updateFeaturePermission({ featureId: 'METAL_INVENTORY', scope: scope as any, isEnabled: false }, 'admin')).rejects.toMatchObject({ status: 400 });
    expect(mockDb.featurePermission.create).not.toHaveBeenCalled();
  });

  it('validates every bulk feature before writing any item', async () => {
    await expect(bulkUpdateFeaturePermissions({ featureIds: ['METAL_INVENTORY', 'INVALID'], scope: { type: 'role', id: 'OFFICE_STAFF' }, isEnabled: false }, 'admin')).rejects.toMatchObject({ status: 400 });
    expect(mockDb.featurePermission.create).not.toHaveBeenCalled();
  });

  it('rejects the same feature twice even when supplied through an alias', async () => {
    await expect(bulkUpdateFeaturePermissions({ featureIds: ['METAL_INVENTORY', 'metal_inventory'], scope: { type: 'role', id: 'OFFICE_STAFF' }, isEnabled: false }, 'admin')).rejects.toMatchObject({ status: 400 });
    expect(mockDb.featurePermission.create).not.toHaveBeenCalled();
  });

  it('serializes department writes despite the legacy schema lacking a department unique key', async () => {
    await updateFeaturePermission({ featureId: 'METAL_INVENTORY', departmentId: 'CAD', isEnabled: false }, 'admin');
    expect(mockDb.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'Serializable' }));
    expect(mockDb.featurePermission.create).toHaveBeenCalledWith({ data: expect.objectContaining({ departmentId: 'CAD', role: null, userId: null }) });
  });

  it('uses one transaction for a valid multi-feature change and audits each change', async () => {
    await bulkUpdateFeaturePermissions({ featureIds: ['METAL_INVENTORY', 'DIAMOND_INVENTORY'], scope: { type: 'role', id: 'OFFICE_STAFF' }, isEnabled: false }, 'admin');
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockDb.featurePermission.create).toHaveBeenCalledTimes(2);
    expect(mockDb.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it('preserves each feature capability vector when bulk-disabling without capability values', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([
      moduleRow([row({ id: 'metal-permission', role: 'OFFICE_STAFF', canWrite: false, canDelete: false })]),
      moduleRow([row({ id: 'diamond-permission', featureId: 'stored-diamond', role: 'OFFICE_STAFF', canWrite: true, canDelete: false })], { id: 'stored-diamond', name: 'DIAMOND_INVENTORY' }),
    ]);
    await bulkUpdateFeaturePermissions({ featureIds: ['METAL_INVENTORY', 'DIAMOND_INVENTORY'], scope: { type: 'role', id: 'OFFICE_STAFF' }, isEnabled: false }, 'admin');
    expect(mockDb.featurePermission.update).toHaveBeenNthCalledWith(1, { where: { id: 'metal-permission' }, data: expect.objectContaining({ isEnabled: false, canRead: true, canWrite: false, canDelete: false }) });
    expect(mockDb.featurePermission.update).toHaveBeenNthCalledWith(2, { where: { id: 'diamond-permission' }, data: expect.objectContaining({ isEnabled: false, canRead: true, canWrite: true, canDelete: false }) });
  });

  it('rejects the transaction if its audit write fails', async () => {
    mockDb.auditLog.create.mockRejectedValue(new Error('audit unavailable'));
    await expect(updateFeaturePermission({ featureId: 'METAL_INVENTORY', role: 'OFFICE_STAFF', isEnabled: false }, 'admin')).rejects.toThrow('audit unavailable');
  });
});

describe('feature guard enforcement', () => {
  it.each([['GET', 'canRead'], ['POST', 'canWrite'], ['PATCH', 'canWrite'], ['DELETE', 'canDelete']])('checks %s against %s', async (method, capability) => {
    const flags = { canRead: true, canWrite: true, canDelete: true, [capability]: false };
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ userId: 'worker', ...flags })])]);
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }; const next = jest.fn();
    await requireFeature('METAL_INVENTORY')({ user: { userId: 'worker', role: 'DEPARTMENT_WORKER' }, method } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(403); expect(next).not.toHaveBeenCalled();
  });

  it('does not authenticate a previously public registration but respects CLIENT policy', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ role: 'CLIENT', isEnabled: false })], { name: 'CLIENT_PORTAL' })]);
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }; const next = jest.fn();
    await requireFeature('CLIENT_PORTAL', { publicRole: 'CLIENT' as any })({ method: 'POST' } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(403); expect(next).not.toHaveBeenCalled();
  });

  it('leaves existing role and ownership middleware in charge when no override exists', async () => {
    const next = jest.fn(); const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await requireFeature('METAL_INVENTORY')({ user: { userId: 'worker', role: 'DEPARTMENT_WORKER' }, method: 'POST' } as any, res, next);
    expect(next).toHaveBeenCalledTimes(1); expect(res.status).not.toHaveBeenCalled();
  });

  it('fails closed if the policy query fails, without leaving an unhandled rejection', async () => {
    mockDb.featureModule.findMany.mockRejectedValue(new Error('policy unavailable'));
    const next = jest.fn(); const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await requireFeature('METAL_INVENTORY')({ user: { userId: 'worker', role: 'DEPARTMENT_WORKER' }, method: 'GET' } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(500); expect(next).not.toHaveBeenCalled();
  });
});

describe('subjects and audit', () => {
  it('exposes only minimal subject fields and canonical departments', async () => {
    const subjects = await getFeatureSubjects();
    expect(subjects.departments.some((d: any) => d.id === 'CAD')).toBe(true);
    expect(mockDb.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ select: { id: true, name: true, role: true, department: true } }));
  });

  it('bounds audit reads and returns actor names without emails', async () => {
    mockDb.auditLog.findMany.mockResolvedValue([{ id: 'a', userId: 'admin', action: 'UPDATE', createdAt: new Date(), oldValues: null, newValues: {} }]);
    const history = await getFeatureAudit({ limit: 25 });
    expect(history.items[0]).toMatchObject({ id: 'a', actorName: 'Admin' });
    expect(history.nextCursor).toBeNull();
    expect(mockDb.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 26 }));
  });
});

describe('feature API authorization and failure responses', () => {
  const app = express();
  app.use(express.json());
  app.use('/features', featuresRouter);
  const change = { featureId: 'METAL_INVENTORY', scope: { type: 'role', id: 'OFFICE_STAFF' }, isEnabled: false };

  it('requires authentication even for effective-feature reads', async () => {
    expect((await request(app).get('/features/my-features')).status).toBe(401);
    expect(mockDb.user.findUnique).not.toHaveBeenCalled();
  });

  it('allows own feature reads but rejects management by non-admins', async () => {
    const mine = await request(app).get('/features/my-features').set('x-test-user', 'worker').set('x-test-role', 'DEPARTMENT_WORKER');
    expect(mine.status).toBe(200); expect(Object.keys(mine.body.data)).toHaveLength(8);
    expect((await request(app).get('/features').set('x-test-user', 'worker').set('x-test-role', 'DEPARTMENT_WORKER')).status).toBe(403);
    expect((await request(app).post('/features/permissions/bulk').set('x-test-user', 'worker').set('x-test-role', 'DEPARTMENT_WORKER').send({ ...change, featureIds: ['METAL_INVENTORY'] })).status).toBe(403);
    expect(mockDb.featurePermission.create).not.toHaveBeenCalled();
  });

  it('returns a controlled 400 for malformed changes and never writes them', async () => {
    const response = await request(app).post('/features/permissions').set('x-test-user', 'admin').set('x-test-role', 'ADMIN').send({ ...change, isEnabled: 'yes' });
    expect(response.status).toBe(400); expect(response.body.error.code).toBe('INVALID_FEATURE_REQUEST');
    expect(mockDb.featurePermission.create).not.toHaveBeenCalled();
  });

  it('reports a serialization conflict without retrying or reporting success', async () => {
    mockDb.$transaction.mockRejectedValue({ code: 'P2034' });
    const response = await request(app).post('/features/permissions').set('x-test-user', 'admin').set('x-test-role', 'ADMIN').send(change);
    expect(response.status).toBe(409); expect(response.body.error.code).toBe('FEATURE_CONFLICT');
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('client profile recovery with portal disabled', () => {
  const app = express();
  app.use(express.json());
  app.use('/clients', clientsRouter);
  beforeEach(() => mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ role: 'CLIENT', isEnabled: false })], { name: 'CLIENT_PORTAL' })]));

  it('keeps profile reads and the actual profile update route accessible to the owning client', async () => {
    const read = await request(app).get('/clients/profile').set('x-test-user', 'client').set('x-test-role', 'CLIENT');
    expect(read.status).toBe(200);
    const update = await request(app).put('/clients/profile/own-client').set('x-test-user', 'client').set('x-test-role', 'CLIENT').send({ businessName: 'Updated own business' });
    expect(update.status).toBe(200);
    expect(mockUpdateClient).toHaveBeenCalledWith('own-client', { businessName: 'Updated own business' });
  });

  it('rejects another client profile id without writing', async () => {
    const response = await request(app).put('/clients/profile/another-client').set('x-test-user', 'client').set('x-test-role', 'CLIENT').send({ businessName: 'Changed' });
    expect(response.status).toBe(403); expect(mockUpdateClient).not.toHaveBeenCalled();
  });

  it.each([{ userId: 'another-user' }, { approvalStatus: 'APPROVED' }])('does not allow profile recovery to reassign ownership or self-approve: %p', async (body) => {
    const response = await request(app).put('/clients/profile/own-client').set('x-test-user', 'client').set('x-test-role', 'CLIENT').send(body);
    expect(response.status).toBe(400); expect(mockUpdateClient).not.toHaveBeenCalled();
  });

  it('keeps existing client-role authorization and still blocks disabled portal operations', async () => {
    expect((await request(app).put('/clients/profile/own-client').set('x-test-user', 'worker').set('x-test-role', 'DEPARTMENT_WORKER').send({ businessName: 'Changed' })).status).toBe(403);
    expect((await request(app).get('/clients/orders').set('x-test-user', 'client').set('x-test-role', 'CLIENT')).status).toBe(403);
    expect(mockUpdateClient).not.toHaveBeenCalled();
  });
});

describe('vendor resource policy paths', () => {
  const app = express();
  app.use('/vendors', vendorsRouter);

  it.each([
    ['transactions', 'METAL_INVENTORY', 'metalTransaction'],
    ['diamond-transactions', 'DIAMOND_INVENTORY', 'diamondTransaction'],
    ['real-stone-transactions', 'REAL_STONE_INVENTORY', 'realStoneTransaction'],
    ['stone-packet-transactions', 'STONE_INVENTORY', 'stonePacketTransaction'],
  ])('protects the alternate %s read path', async (path, feature, model) => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ role: 'OFFICE_STAFF', isEnabled: false })], { name: feature })]);
    const response = await request(app).get('/vendors/vendor/' + path).set('x-test-user', 'office').set('x-test-role', 'OFFICE_STAFF');
    expect(response.status).toBe(403); expect(mockDb[model].findMany).not.toHaveBeenCalled();
  });

  it('preserves allowed module reads and general vendor access when a different module is disabled', async () => {
    mockDb.featureModule.findMany.mockResolvedValue([moduleRow([row({ role: 'OFFICE_STAFF', isEnabled: false })])]);
    const diamond = await request(app).get('/vendors/vendor/diamond-transactions').set('x-test-user', 'office').set('x-test-role', 'OFFICE_STAFF');
    expect(diamond.status).toBe(200); expect(mockDb.diamondTransaction.findMany).toHaveBeenCalledTimes(1);
    const vendors = await request(app).get('/vendors').set('x-test-user', 'office').set('x-test-role', 'OFFICE_STAFF');
    expect(vendors.status).toBe(200); expect(mockDb.vendor.findMany).toHaveBeenCalledTimes(1);
  });
});
