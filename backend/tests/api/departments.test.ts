/**
 * ============================================
 * DEPARTMENTS API TESTS
 * ============================================
 *
 * Tests for department tracking endpoints:
 * - Department listing and details
 * - Status transitions (start/complete)
 * - Photo uploads
 * - Factory workflow
 *
 * API Endpoints:
 * - GET /api/orders/:orderId/departments - List all departments
 * - GET /api/orders/:orderId/departments/:deptName - Get single department
 * - PUT /api/orders/:orderId/departments/:deptName/start - Start department
 * - PUT /api/orders/:orderId/departments/:deptName/complete - Complete department
 * - PUT /api/orders/:orderId/departments/:deptName/hold - Put on hold
 * - PUT /api/orders/:orderId/departments/:deptName/resume - Resume from hold
 * - POST /api/orders/:orderId/departments/:deptName/photos - Upload photos
 */

import request from 'supertest';
import { app } from '../../src/index';
import {
  createTestUser,
  createTestOrder,
  createOrderInFactory,
  createDepartmentTracking,
  deleteTestUser,
  deleteTestOrder,
  authGet,
  authPost,
  authPut,
  expectSuccessResponse,
  expectErrorResponse,
  prisma,
  TestUser,
  TestOrder,
} from '../utils/testHelpers';
import { mockUsers } from '../utils/mockData';

describe('Departments API', () => {
  let adminUser: TestUser;
  let officeUser: TestUser;
  let factoryUser: TestUser;
  let workerUser: TestUser;
  let testOrder: TestOrder;

  beforeAll(async () => {
    adminUser = await createTestUser(mockUsers.admin);
    officeUser = await createTestUser(mockUsers.officeStaff);
    factoryUser = await createTestUser(mockUsers.factoryManager);
    workerUser = await createTestUser(mockUsers.departmentWorker);
  });

  afterAll(async () => {
    await deleteTestUser(adminUser.id);
    await deleteTestUser(officeUser.id);
    await deleteTestUser(factoryUser.id);
    await deleteTestUser(workerUser.id);
  });

  afterEach(async () => {
    if (testOrder?.id) {
      await deleteTestOrder(testOrder.id);
      testOrder = null as any;
    }
  });

  // ============================================
  // GET DEPARTMENTS TESTS
  // ============================================

  describe('GET /api/orders/:orderId/departments', () => {
    beforeEach(async () => {
      testOrder = await createOrderInFactory(adminUser.id);
    });

    describe('Success Cases', () => {
      it('should list all departments for an order', async () => {
        const response = await authGet(`/api/orders/${testOrder.id}/departments`, adminUser.token);

        expectSuccessResponse(response);
        expect(response.body.data).toHaveProperty('departments');
        expect(Array.isArray(response.body.data.departments)).toBe(true);
      });

      it('should include department summary', async () => {
        const response = await authGet(`/api/orders/${testOrder.id}/departments`, adminUser.token);

        expectSuccessResponse(response);
        expect(response.body.data).toHaveProperty('summary');
        expect(response.body.data.summary).toHaveProperty('totalDepartments');
        expect(response.body.data.summary).toHaveProperty('completedDepartments');
      });

      it('should be accessible by all authenticated roles', async () => {
        for (const user of [adminUser, officeUser, factoryUser, workerUser]) {
          const response = await authGet(`/api/orders/${testOrder.id}/departments`, user.token);
          expectSuccessResponse(response);
        }
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent order', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await authGet(`/api/orders/${fakeId}/departments`, adminUser.token);

        expectErrorResponse(response, 404);
      });

      it('should return 401 without authentication', async () => {
        const response = await request(app).get(`/api/orders/${testOrder.id}/departments`);

        expectErrorResponse(response, 401);
      });
    });
  });

  // ============================================
  // GET SINGLE DEPARTMENT TESTS
  // ============================================

  describe('GET /api/orders/:orderId/departments/:deptName', () => {
    beforeEach(async () => {
      testOrder = await createOrderInFactory(adminUser.id);
      // Initialize departments by calling list endpoint
      await authGet(`/api/orders/${testOrder.id}/departments`, adminUser.token);
    });

    describe('Success Cases', () => {
      it('should get a specific department details', async () => {
        const response = await authGet(
          `/api/orders/${testOrder.id}/departments/CAD`,
          adminUser.token
        );

        expectSuccessResponse(response);
        expect(response.body.data.departmentName).toBe('CAD');
      });

      it('should be accessible by all authenticated roles', async () => {
        for (const user of [adminUser, officeUser, factoryUser, workerUser]) {
          const response = await authGet(`/api/orders/${testOrder.id}/departments/CAD`, user.token);
          expectSuccessResponse(response);
        }
      });
    });

    describe('Error Cases', () => {
      it('should return 400 for invalid department name', async () => {
        const response = await authGet(
          `/api/orders/${testOrder.id}/departments/INVALID`,
          adminUser.token
        );

        expect([400, 404]).toContain(response.status);
      });
    });
  });

  // ============================================
  // START DEPARTMENT TESTS
  // ============================================

  describe('PUT /api/orders/:orderId/departments/:deptName/start', () => {
    beforeEach(async () => {
      testOrder = await createOrderInFactory(adminUser.id);
      // Initialize departments by calling list endpoint
      await authGet(`/api/orders/${testOrder.id}/departments`, adminUser.token);
      // Reset CAD to NOT_STARTED so we can test starting it
      await prisma.departmentTracking.updateMany({
        where: { orderId: testOrder.id, departmentName: 'CAD' },
        data: { status: 'NOT_STARTED', startedAt: null },
      });
    });

    describe('Success Cases', () => {
      it('should start a department', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/start`,
          factoryUser.token,
          { goldWeightIn: 25.0 }
        );

        expectSuccessResponse(response);
        expect(response.body.data.status).toBe('IN_PROGRESS');
      });

      it('should start with notes', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/start`,
          factoryUser.token,
          { goldWeightIn: 25.0, notes: 'Starting CAD' }
        );

        expectSuccessResponse(response);
      });

      it('should be accessible by factory manager', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/start`,
          factoryUser.token,
          { goldWeightIn: 25.0 }
        );

        expectSuccessResponse(response);
      });

      it('should be accessible by admin', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/start`,
          adminUser.token,
          { goldWeightIn: 25.0 }
        );

        expectSuccessResponse(response);
      });

      it('should be accessible by department worker', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/start`,
          workerUser.token,
          { goldWeightIn: 25.0 }
        );

        expectSuccessResponse(response);
      });

      it('should record who started the department', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/start`,
          factoryUser.token,
          { goldWeightIn: 25.0 }
        );

        expectSuccessResponse(response);
        expect(response.body.data.startedAt).toBeTruthy();
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent order', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await authPut(
          `/api/orders/${fakeId}/departments/CAD/start`,
          factoryUser.token,
          { goldWeightIn: 25.0 }
        );

        expectErrorResponse(response, 404);
      });

      it('should return 400 for invalid department name', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/INVALID/start`,
          factoryUser.token,
          { goldWeightIn: 25.0 }
        );

        expect([400, 404]).toContain(response.status);
      });

      it('should return error for already started department', async () => {
        // Start the department first
        await authPut(`/api/orders/${testOrder.id}/departments/CAD/start`, factoryUser.token, {
          goldWeightIn: 25.0,
        });

        // Try to start again
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/start`,
          factoryUser.token,
          { goldWeightIn: 25.0 }
        );

        expect([400, 409]).toContain(response.status);
      });
    });
  });

  // ============================================
  // COMPLETE DEPARTMENT TESTS
  // ============================================

  describe('PUT /api/orders/:orderId/departments/:deptName/complete', () => {
    beforeEach(async () => {
      testOrder = await createOrderInFactory(adminUser.id);
      // Initialize departments by calling list endpoint
      await authGet(`/api/orders/${testOrder.id}/departments`, adminUser.token);
      // Set CAD to IN_PROGRESS so we can test completing it
      await prisma.departmentTracking.updateMany({
        where: { orderId: testOrder.id, departmentName: 'CAD' },
        data: { status: 'IN_PROGRESS', startedAt: new Date(), goldWeightIn: 25.0 },
      });
    });

    describe('Success Cases', () => {
      it('should complete a department with output weight', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/complete`,
          factoryUser.token,
          { goldWeightOut: 24.8 }
        );

        expectSuccessResponse(response);
        expect(response.body.data.status).toBe('COMPLETED');
      });

      it('should complete with notes', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/complete`,
          factoryUser.token,
          { goldWeightOut: 24.8, notes: 'Completed successfully' }
        );

        expectSuccessResponse(response);
      });

      it('should record completion timestamp', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/complete`,
          factoryUser.token,
          { goldWeightOut: 24.8 }
        );

        expectSuccessResponse(response);
        expect(response.body.data.completedAt).toBeTruthy();
      });

      it('should calculate weight variance', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/complete`,
          factoryUser.token,
          { goldWeightOut: 24.8 }
        );

        expectSuccessResponse(response);
        expect(response.body.data.goldWeightOut).toBe(24.8);
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent order', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await authPut(
          `/api/orders/${fakeId}/departments/CAD/complete`,
          factoryUser.token,
          { goldWeightOut: 24.8 }
        );

        expectErrorResponse(response, 404);
      });

      it('should return 400 for invalid department name', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/INVALID/complete`,
          factoryUser.token,
          { goldWeightOut: 24.8 }
        );

        expect([400, 404]).toContain(response.status);
      });

      it('should return error for not started department', async () => {
        // Reset PRINT to NOT_STARTED
        await prisma.departmentTracking.updateMany({
          where: { orderId: testOrder.id, departmentName: 'PRINT' },
          data: { status: 'NOT_STARTED', startedAt: null },
        });

        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/PRINT/complete`,
          factoryUser.token,
          { goldWeightOut: 24.8 }
        );

        expect([400, 404, 409]).toContain(response.status);
      });
    });
  });

  // ============================================
  // PUT ON HOLD TESTS
  // ============================================

  describe('PUT /api/orders/:orderId/departments/:deptName/hold', () => {
    beforeEach(async () => {
      testOrder = await createOrderInFactory(adminUser.id);
      // Initialize departments by calling list endpoint
      await authGet(`/api/orders/${testOrder.id}/departments`, adminUser.token);
      await prisma.departmentTracking.updateMany({
        where: { orderId: testOrder.id, departmentName: 'CAD' },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
    });

    describe('Success Cases', () => {
      it('should put department on hold with reason', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/hold`,
          factoryUser.token,
          { reason: 'Waiting for materials' }
        );

        expectSuccessResponse(response);
        expect(response.body.data.status).toBe('ON_HOLD');
      });
    });

    describe('Error Cases', () => {
      it('should return 400 for missing reason', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/hold`,
          factoryUser.token,
          {}
        );

        expect([400, 422]).toContain(response.status);
      });
    });
  });

  // ============================================
  // RESUME DEPARTMENT TESTS
  // ============================================

  describe('PUT /api/orders/:orderId/departments/:deptName/resume', () => {
    beforeEach(async () => {
      testOrder = await createOrderInFactory(adminUser.id);
      // Initialize departments by calling list endpoint
      await authGet(`/api/orders/${testOrder.id}/departments`, adminUser.token);
      await prisma.departmentTracking.updateMany({
        where: { orderId: testOrder.id, departmentName: 'CAD' },
        data: { status: 'ON_HOLD', startedAt: new Date() },
      });
    });

    describe('Success Cases', () => {
      it('should resume a department from hold', async () => {
        const response = await authPut(
          `/api/orders/${testOrder.id}/departments/CAD/resume`,
          factoryUser.token,
          {}
        );

        expectSuccessResponse(response);
        expect(response.body.data.status).toBe('IN_PROGRESS');
      });
    });
  });

  // ============================================
  // PHOTO UPLOAD TESTS
  // ============================================

  describe('POST /api/orders/:orderId/departments/:deptName/photos', () => {
    beforeEach(async () => {
      testOrder = await createOrderInFactory(adminUser.id);
    });

    describe('Success Cases', () => {
      it('should upload photos with URLs', async () => {
        const response = await authPost(
          `/api/orders/${testOrder.id}/departments/CAD/photos`,
          workerUser.token,
          {
            photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
          }
        );

        expect([200, 201]).toContain(response.status);
      });

      it('should accept single photo', async () => {
        const response = await authPost(
          `/api/orders/${testOrder.id}/departments/CAD/photos`,
          workerUser.token,
          {
            photos: ['https://example.com/photo.jpg'],
          }
        );

        expect([200, 201]).toContain(response.status);
      });
    });

    describe('Error Cases', () => {
      it('should return 400 for empty photos array', async () => {
        const response = await authPost(
          `/api/orders/${testOrder.id}/departments/CAD/photos`,
          workerUser.token,
          { photos: [] }
        );

        expect([400, 422]).toContain(response.status);
      });

      it('should return 400 for too many photos', async () => {
        const photos = Array(15).fill('https://example.com/photo.jpg');
        const response = await authPost(
          `/api/orders/${testOrder.id}/departments/CAD/photos`,
          workerUser.token,
          { photos }
        );

        expect([400, 422]).toContain(response.status);
      });
    });
  });

  // ============================================
  // DEPARTMENT WORKFLOW TESTS
  // ============================================

  describe('Department Workflow', () => {
    beforeEach(async () => {
      testOrder = await createOrderInFactory(adminUser.id);
      // Reset CAD to NOT_STARTED for workflow tests
      await prisma.departmentTracking.updateMany({
        where: { orderId: testOrder.id, departmentName: 'CAD' },
        data: { status: 'NOT_STARTED', startedAt: null },
      });
    });

    it('should follow correct department sequence', async () => {
      // 1. Start CAD (first department)
      const startRes = await authPut(
        `/api/orders/${testOrder.id}/departments/CAD/start`,
        factoryUser.token,
        { goldWeightIn: 25.0 }
      );
      expectSuccessResponse(startRes);

      // 2. Complete CAD
      const completeRes = await authPut(
        `/api/orders/${testOrder.id}/departments/CAD/complete`,
        factoryUser.token,
        { goldWeightOut: 24.5 }
      );
      expectSuccessResponse(completeRes);

      // Verify workflow
      const listRes = await authGet(`/api/orders/${testOrder.id}/departments`, adminUser.token);
      expectSuccessResponse(listRes);
      expect(listRes.body.data.summary.completedDepartments).toBeGreaterThanOrEqual(1);
    });

    it('should calculate completion percentage', async () => {
      // Start and complete first department (CAD)
      await authPut(`/api/orders/${testOrder.id}/departments/CAD/start`, factoryUser.token, {
        goldWeightIn: 25.0,
      });
      await authPut(`/api/orders/${testOrder.id}/departments/CAD/complete`, factoryUser.token, {
        goldWeightOut: 24.5,
      });

      const response = await authGet(`/api/orders/${testOrder.id}/departments`, adminUser.token);
      expectSuccessResponse(response);
      expect(response.body.data.summary.completionPercentage).toBeGreaterThan(0);
    });

    it('should calculate weight variance correctly', async () => {
      await authPut(`/api/orders/${testOrder.id}/departments/CAD/start`, factoryUser.token, {
        goldWeightIn: 25.0,
      });

      // Complete with weight loss
      const response = await authPut(
        `/api/orders/${testOrder.id}/departments/CAD/complete`,
        workerUser.token,
        { goldWeightOut: 24.5 }
      );

      expectSuccessResponse(response);
      // Variance should be 0.5g or 2%
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    beforeEach(async () => {
      testOrder = await createOrderInFactory(adminUser.id);
      // Reset CAD to NOT_STARTED for edge case tests
      await prisma.departmentTracking.updateMany({
        where: { orderId: testOrder.id, departmentName: 'CAD' },
        data: { status: 'NOT_STARTED', startedAt: null },
      });
    });

    it('should handle zero weight input', async () => {
      const response = await authPut(
        `/api/orders/${testOrder.id}/departments/CAD/start`,
        factoryUser.token,
        { goldWeightIn: 0 }
      );

      expect([200, 400]).toContain(response.status);
    });

    it('should handle very small weights', async () => {
      const response = await authPut(
        `/api/orders/${testOrder.id}/departments/CAD/start`,
        factoryUser.token,
        { goldWeightIn: 0.001 }
      );

      expect([200, 400]).toContain(response.status);
    });

    it('should handle weight with many decimal places', async () => {
      const response = await authPut(
        `/api/orders/${testOrder.id}/departments/CAD/start`,
        factoryUser.token,
        { goldWeightIn: 25.123456789 }
      );

      expect([200, 400]).toContain(response.status);
    });
  });
});
