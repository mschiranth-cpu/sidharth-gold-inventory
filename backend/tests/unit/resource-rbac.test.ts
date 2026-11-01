const mockDb: any = {
  payslip: { findUnique: jest.fn() },
  leave: { findMany: jest.fn() },
  client: { update: jest.fn() },
  order: { findUnique: jest.fn(), update: jest.fn() },
  orderComment: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
};
jest.mock('@prisma/client', () => ({ ...jest.requireActual('@prisma/client'), PrismaClient: jest.fn(() => mockDb) }));
jest.mock('../../src/utils/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() } }));

import { getPayslipController } from '../../src/modules/payroll/payroll.controller';
import { getPayslip } from '../../src/modules/payroll/payroll.service';
import { getLeavesController } from '../../src/modules/attendance/attendance.controller';
import { approveClient, approveClientOrder, addOrderComment, getOrderComments, markCommentAsRead } from '../../src/modules/clients/clients.service';
import { addOrderCommentController, getOrderCommentsController, markCommentAsReadController } from '../../src/modules/clients/clients.controller';

const comments = { add: addOrderComment as (...args: any[]) => Promise<any>, get: getOrderComments as (...args: any[]) => Promise<any>, mark: markCommentAsRead as (...args: any[]) => Promise<any> };
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const req = (role: string, userId: string, extra: any = {}) => ({ user: { role, userId }, params: {}, query: {}, ...extra }) as any;
const actor = (role: string, userId: string) => ({ role, userId });
const safeUser = { id: true, name: true, email: true, role: true };

beforeEach(() => {
  jest.resetAllMocks();
  mockDb.payslip.findUnique.mockResolvedValue({ id: 'slip', userId: 'owner', user: { id: 'owner', name: 'Fixture' } });
  mockDb.leave.findMany.mockResolvedValue([]);
  mockDb.client.update.mockResolvedValue({ id: 'client-record' });
  mockDb.order.update.mockResolvedValue({ id: 'order' });
  mockDb.order.findUnique.mockResolvedValue({ id: 'order', client: { userId: 'client-a' }, departmentTracking: [{ assignedToId: 'worker-a' }] });
  mockDb.orderComment.findMany.mockResolvedValue([]);
  mockDb.orderComment.findUnique.mockResolvedValue({ id: 'comment', orderId: 'order', isInternal: false });
  mockDb.orderComment.create.mockResolvedValue({ id: 'created' });
  mockDb.orderComment.update.mockResolvedValue({ id: 'comment' });
});

describe('Payslip ownership and safe projections', () => {
  it.each(['ADMIN', 'FACTORY_MANAGER'])('allows %s to read an employee payslip', async (role) => {
    const res = response(); await getPayslipController(req(role, 'manager', { params: { payslipId: 'slip' } }), res as any);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
  it.each(['OFFICE_STAFF', 'DEPARTMENT_WORKER', 'CLIENT'])('allows %s own payslip but rejects another employee', async (role) => {
    const own = response(); await getPayslipController(req(role, 'owner', { params: { payslipId: 'slip' } }), own as any);
    expect(own.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    const other = response(); await getPayslipController(req(role, 'other', { params: { payslipId: 'slip' } }), other as any);
    expect(other.status).toHaveBeenCalledWith(403);
    expect(other.json).not.toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
  it('does not select stored password hashes in payslip or client-approval responses', async () => {
    await getPayslip('slip');
    expect(mockDb.payslip.findUnique.mock.calls[0][0].include.user).toEqual({ select: safeUser });
    await approveClient({ clientId: 'client-record', approved: true }, 'admin');
    expect(mockDb.client.update.mock.calls[0][0].include.user).toEqual({ select: safeUser });
    await approveClientOrder('order', true, 'admin');
    expect(mockDb.order.update.mock.calls[0][0].include.client.include.user).toEqual({ select: safeUser });
  });
});

describe('Leave history scope', () => {
  it.each(['OFFICE_STAFF', 'DEPARTMENT_WORKER', 'CLIENT'])('defaults %s to own history and rejects an explicit other user', async (role) => {
    const own = response(); await getLeavesController(req(role, 'self'), own as any);
    expect(mockDb.leave.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'self' } }));
    mockDb.leave.findMany.mockClear();
    const other = response(); await getLeavesController(req(role, 'self', { query: { userId: 'other' } }), other as any);
    expect(other.status).toHaveBeenCalledWith(403); expect(mockDb.leave.findMany).not.toHaveBeenCalled();
  });
  it.each(['ADMIN', 'FACTORY_MANAGER'])('preserves %s all-employee history and filtering', async (role) => {
    await getLeavesController(req(role, 'manager'), response() as any);
    expect(mockDb.leave.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: {} }));
    await getLeavesController(req(role, 'manager', { query: { userId: 'employee', status: 'APPROVED' } }), response() as any);
    expect(mockDb.leave.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { userId: 'employee', status: 'APPROVED' } }));
  });
  it('rejects structured query filters without reading any history', async () => {
    for (const query of [{ userId: ['self', 'other'] }, { status: { equals: 'APPROVED' } }]) {
      const res = response(); await getLeavesController(req('ADMIN', 'admin', { query }), res as any);
      expect(res.status).toHaveBeenCalledWith(400);
    }
    expect(mockDb.leave.findMany).not.toHaveBeenCalled();
  });
});

describe('Client comment ownership and internal visibility', () => {
  it.each(['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'])('keeps %s staff access to all order comments', async (role) => {
    await comments.get('order', actor(role, 'staff'), true);
    expect(mockDb.orderComment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { orderId: 'order' } }));
    await comments.add(actor(role, 'staff'), { orderId: 'order', message: 'Fixture', isInternal: true });
    expect(mockDb.orderComment.create).toHaveBeenCalled();
  });
  it('allows own client orders but never returns internal comments', async () => {
    await comments.get('order', actor('CLIENT', 'client-a'), true);
    expect(mockDb.orderComment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { orderId: 'order', isInternal: false } }));
  });
  it('rejects another client on read, post and mark-read before writing', async () => {
    const other = actor('CLIENT', 'client-b');
    await expect(comments.get('order', other)).rejects.toMatchObject({ status: 403 });
    await expect(comments.add(other, { orderId: 'order', message: 'Fixture' })).rejects.toMatchObject({ status: 403 });
    await expect(comments.mark('comment', other)).rejects.toMatchObject({ status: 403 });
    expect(mockDb.orderComment.findMany).not.toHaveBeenCalled(); expect(mockDb.orderComment.create).not.toHaveBeenCalled(); expect(mockDb.orderComment.update).not.toHaveBeenCalled();
  });
  it('allows only assigned workers and keeps their comments public', async () => {
    await comments.get('order', actor('DEPARTMENT_WORKER', 'worker-a'));
    await expect(comments.get('order', actor('DEPARTMENT_WORKER', 'worker-b'))).rejects.toMatchObject({ status: 403 });
    await expect(comments.add(actor('DEPARTMENT_WORKER', 'worker-a'), { orderId: 'order', message: 'Fixture', isInternal: true })).rejects.toMatchObject({ status: 403 });
    expect(mockDb.orderComment.create).not.toHaveBeenCalled();
  });
  it.each([['CLIENT', 'client-a'], ['DEPARTMENT_WORKER', 'worker-a']])('prevents %s from marking an internal comment', async (role, userId) => {
    mockDb.orderComment.findUnique.mockResolvedValue({ id: 'comment', orderId: 'order', isInternal: true });
    await expect(comments.mark('comment', actor(role, userId))).rejects.toMatchObject({ status: 403 });
    expect(mockDb.orderComment.update).not.toHaveBeenCalled();
  });
  it('does not let clients create hidden staff-only comments', async () => {
    await expect(comments.add(actor('CLIENT', 'client-a'), { orderId: 'order', message: 'Fixture', isInternal: true })).rejects.toMatchObject({ status: 403 });
    expect(mockDb.orderComment.create).not.toHaveBeenCalled();
  });
  it.each([['CLIENT', 'client-a'], ['DEPARTMENT_WORKER', 'worker-a']])('keeps %s public comment posting and read acknowledgments available', async (role, userId) => {
    await comments.add(actor(role, userId), { orderId: 'order', message: 'Fixture' });
    expect(mockDb.orderComment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId, isInternal: false }) }));
    await comments.mark('comment', actor(role, userId));
    expect(mockDb.orderComment.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'comment' }, data: expect.objectContaining({ isRead: true }) }));
  });
  it('reports missing orders and comments without mutation', async () => {
    mockDb.order.findUnique.mockResolvedValue(null);
    await expect(comments.add(actor('CLIENT', 'client-a'), { orderId: 'missing', message: 'Fixture' })).rejects.toMatchObject({ status: 404 });
    mockDb.orderComment.findUnique.mockResolvedValue(null);
    await expect(comments.mark('missing', actor('CLIENT', 'client-a'))).rejects.toMatchObject({ status: 404 });
    expect(mockDb.orderComment.create).not.toHaveBeenCalled(); expect(mockDb.orderComment.update).not.toHaveBeenCalled();
  });
  it('rejects invalid comments without looking up business records or writing', async () => {
    for (const data of [null, { orderId: 'order', message: '' }, { orderId: 'order', message: 'Fixture', isInternal: 'true' }, { orderId: 'order', message: 'Fixture', attachments: [{}] }]) {
      await expect(comments.add(actor('CLIENT', 'client-a'), data)).rejects.toMatchObject({ status: 400 });
    }
    expect(mockDb.order.findUnique).not.toHaveBeenCalled(); expect(mockDb.orderComment.create).not.toHaveBeenCalled();
  });
  it('returns controlled authorization statuses through all three HTTP controllers', async () => {
    const a = response(); await addOrderCommentController(req('CLIENT', 'client-b', { body: { orderId: 'order', message: 'Fixture' } }), a as any); expect(a.status).toHaveBeenCalledWith(403);
    const b = response(); await getOrderCommentsController(req('CLIENT', 'client-b', { params: { orderId: 'order' } }), b as any); expect(b.status).toHaveBeenCalledWith(403);
    const c = response(); await markCommentAsReadController(req('CLIENT', 'client-b', { params: { commentId: 'comment' } }), c as any); expect(c.status).toHaveBeenCalledWith(403);
  });
});
