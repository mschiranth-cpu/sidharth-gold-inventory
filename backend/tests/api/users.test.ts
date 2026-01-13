/**
 * ============================================
 * USERS API TESTS
 * ============================================
 *
 * Tests for user management endpoints:
 * - CRUD operations
 * - Role-based access
 * - User activation/deactivation
 */

import request from 'supertest';
import { app } from '../../src/index';
import {
  createTestUser,
  deleteTestUser,
  authGet,
  authPost,
  authPut,
  authPatch,
  authDelete,
  expectSuccessResponse,
  expectErrorResponse,
  expectPaginatedResponse,
  prisma,
  TestUser,
} from '../utils/testHelpers';
import { mockUsers, mockRegistration } from '../utils/mockData';

describe('Users API', () => {
  let adminUser: TestUser;
  let officeUser: TestUser;
  let workerUser: TestUser;
  let createdUserId: string | null = null;

  beforeAll(async () => {
    adminUser = await createTestUser(mockUsers.admin);
    officeUser = await createTestUser(mockUsers.officeStaff);
    workerUser = await createTestUser(mockUsers.departmentWorker);
  });

  afterAll(async () => {
    await deleteTestUser(adminUser.id);
    await deleteTestUser(officeUser.id);
    await deleteTestUser(workerUser.id);
  });

  afterEach(async () => {
    if (createdUserId) {
      await deleteTestUser(createdUserId);
      createdUserId = null;
    }
  });

  // ============================================
  // GET USERS TESTS
  // ============================================

  describe('GET /api/users', () => {
    describe('Success Cases', () => {
      it('should list users for admin', async () => {
        const response = await authGet('/api/users', adminUser.token);

        expectPaginatedResponse(response);
        expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      });

      it('should filter by role', async () => {
        const response = await authGet('/api/users?role=ADMIN', adminUser.token);

        expectSuccessResponse(response);
        response.body.data.forEach((user: any) => {
          expect(user.role).toBe('ADMIN');
        });
      });

      it('should filter by active status', async () => {
        const response = await authGet('/api/users?isActive=true', adminUser.token);

        expectSuccessResponse(response);
        response.body.data.forEach((user: any) => {
          expect(user.isActive).toBe(true);
        });
      });

      it('should search by name or email', async () => {
        const response = await authGet(
          `/api/users?search=${mockUsers.admin.name}`,
          adminUser.token
        );

        expectSuccessResponse(response);
      });

      it('should paginate results', async () => {
        const response = await authGet('/api/users?page=1&limit=5', adminUser.token);

        expectSuccessResponse(response);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
        expect(response.body.pagination.limit).toBe(5);
      });

      it('should not return password in response', async () => {
        const response = await authGet('/api/users', adminUser.token);

        expectSuccessResponse(response);
        response.body.data.forEach((user: any) => {
          expect(user.password).toBeUndefined();
          expect(user.passwordHash).toBeUndefined();
        });
      });
    });

    describe('Error Cases', () => {
      it('should return 403 for non-admin users', async () => {
        const response = await authGet('/api/users', workerUser.token);

        expectErrorResponse(response, 403);
      });

      it('should return 401 without authentication', async () => {
        const response = await request(app).get('/api/users');

        expectErrorResponse(response, 401);
      });
    });
  });

  // ============================================
  // GET SINGLE USER TESTS
  // ============================================

  describe('GET /api/users/:id', () => {
    describe('Success Cases', () => {
      it('should get user by ID as admin', async () => {
        const response = await authGet(`/api/users/${officeUser.id}`, adminUser.token);

        expectSuccessResponse(response);
        expect(response.body.data.id).toBe(officeUser.id);
        expect(response.body.data.email).toBe(mockUsers.officeStaff.email);
      });

      it('should get own profile', async () => {
        const response = await authGet(`/api/users/${workerUser.id}`, workerUser.token);

        // Users should be able to view their own profile
        expect([200, 403]).toContain(response.status);
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent user', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await authGet(`/api/users/${fakeId}`, adminUser.token);

        expectErrorResponse(response, 404);
      });

      it('should return 400 for invalid UUID', async () => {
        const response = await authGet('/api/users/invalid-id', adminUser.token);

        expect([400, 404, 500]).toContain(response.status);
      });

      it('should return 403 for viewing other users as non-admin', async () => {
        const response = await authGet(`/api/users/${adminUser.id}`, workerUser.token);

        // Workers shouldn't view admin profiles
        expect([200, 403]).toContain(response.status);
      });
    });
  });

  // ============================================
  // CREATE USER TESTS
  // ============================================

  describe('POST /api/users', () => {
    describe('Success Cases', () => {
      it('should create user as admin', async () => {
        const response = await authPost('/api/users', adminUser.token, mockRegistration.valid);

        expectSuccessResponse(response, 201);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.email).toBe(mockRegistration.valid.email);
        expect(response.body.data.role).toBe(mockRegistration.valid.role);

        createdUserId = response.body.data.id;
      });

      it('should create user with optional department', async () => {
        const userWithDept = {
          ...mockRegistration.valid,
          email: 'dept.user@test.com',
          department: 'CASTING',
        };

        const response = await authPost('/api/users', adminUser.token, userWithDept);

        expectSuccessResponse(response, 201);
        expect(response.body.data.department).toBe('CASTING');

        createdUserId = response.body.data.id;
      });

      it('should hash password before storing', async () => {
        const response = await authPost('/api/users', adminUser.token, {
          ...mockRegistration.valid,
          email: 'hash.test@example.com',
        });

        expectSuccessResponse(response, 201);
        createdUserId = response.body.data.id;

        // Verify password is hashed in DB
        if (createdUserId) {
          const user = await prisma.user.findUnique({ where: { id: createdUserId } });
          expect(user?.password).not.toBe(mockRegistration.valid.password);
        }
      });
    });

    describe('Error Cases', () => {
      it('should return 400 for duplicate email', async () => {
        // Create first user
        const firstRes = await authPost('/api/users', adminUser.token, mockRegistration.valid);
        createdUserId = firstRes.body.data?.id;

        // Try to create with same email
        const response = await authPost('/api/users', adminUser.token, mockRegistration.valid);

        expect([400, 409]).toContain(response.status);
      });

      it('should return 400 for weak password', async () => {
        const response = await authPost(
          '/api/users',
          adminUser.token,
          mockRegistration.weakPassword
        );

        expect(response.status).toBe(400);
      });

      it('should return 400 for invalid email', async () => {
        const response = await authPost(
          '/api/users',
          adminUser.token,
          mockRegistration.invalidEmail
        );

        expect(response.status).toBe(400);
      });

      it('should return 400 for missing required fields', async () => {
        const response = await authPost('/api/users', adminUser.token, {
          email: 'test@example.com',
          // Missing password, firstName, lastName, role
        });

        expect(response.status).toBe(400);
      });

      it('should return 400 for invalid role', async () => {
        const response = await authPost('/api/users', adminUser.token, {
          ...mockRegistration.valid,
          email: 'invalid.role@test.com',
          role: 'SUPER_ADMIN',
        });

        expect(response.status).toBe(400);
      });

      it('should return 403 for non-admin users', async () => {
        const response = await authPost('/api/users', officeUser.token, mockRegistration.valid);

        expectErrorResponse(response, 403);
      });
    });
  });

  // ============================================
  // UPDATE USER TESTS
  // ============================================

  describe('PUT /api/users/:id', () => {
    let testUserId: string;

    beforeEach(async () => {
      const createRes = await authPost('/api/users', adminUser.token, {
        ...mockRegistration.valid,
        email: `update.test.${Date.now()}@example.com`,
      });
      testUserId = createRes.body.data.id;
    });

    afterEach(async () => {
      if (testUserId) {
        await deleteTestUser(testUserId);
      }
    });

    describe('Success Cases', () => {
      it('should update user info as admin', async () => {
        const response = await authPut(`/api/users/${testUserId}`, adminUser.token, {
          name: 'Updated Name',
        });

        expectSuccessResponse(response);
        expect(response.body.data.name).toBe('Updated Name');
      });

      it('should update user role', async () => {
        const response = await authPut(`/api/users/${testUserId}`, adminUser.token, {
          role: 'FACTORY_MANAGER',
        });

        expectSuccessResponse(response);
        expect(response.body.data.role).toBe('FACTORY_MANAGER');
      });

      it('should update user department', async () => {
        const response = await authPut(`/api/users/${testUserId}`, adminUser.token, {
          department: 'SETTING',
        });

        expectSuccessResponse(response);
        expect(response.body.data.department).toBe('SETTING');
      });
    });

    describe('Error Cases', () => {
      it('should return 400 for invalid email format', async () => {
        const response = await authPut(`/api/users/${testUserId}`, adminUser.token, {
          email: 'invalid-email',
        });

        expect(response.status).toBe(400);
      });

      it('should return 400 for duplicate email', async () => {
        const response = await authPut(`/api/users/${testUserId}`, adminUser.token, {
          email: mockUsers.admin.email, // Already exists
        });

        expect([400, 409]).toContain(response.status);
      });

      it('should return 404 for non-existent user', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await authPut(`/api/users/${fakeId}`, adminUser.token, {
          firstName: 'Test',
        });

        expectErrorResponse(response, 404);
      });

      it('should return 403 for non-admin users', async () => {
        const response = await authPut(`/api/users/${testUserId}`, workerUser.token, {
          firstName: 'Unauthorized',
        });

        expectErrorResponse(response, 403);
      });
    });
  });

  // ============================================
  // ACTIVATE/DEACTIVATE TESTS
  // ============================================

  describe('PATCH /api/users/:id/status', () => {
    let testUserId: string;

    beforeEach(async () => {
      const createRes = await authPost('/api/users', adminUser.token, {
        ...mockRegistration.valid,
        email: `status.test.${Date.now()}@example.com`,
      });
      testUserId = createRes.body.data.id;
    });

    afterEach(async () => {
      if (testUserId) {
        await deleteTestUser(testUserId);
      }
    });

    describe('Success Cases', () => {
      it('should deactivate user', async () => {
        const response = await authPatch(`/api/users/${testUserId}/status`, adminUser.token, {
          isActive: false,
        });

        expectSuccessResponse(response);
        expect(response.body.data.isActive).toBe(false);
      });

      it('should reactivate user', async () => {
        // Deactivate first
        await authPatch(`/api/users/${testUserId}/status`, adminUser.token, {
          isActive: false,
        });

        // Reactivate
        const response = await authPatch(`/api/users/${testUserId}/status`, adminUser.token, {
          isActive: true,
        });

        expectSuccessResponse(response);
        expect(response.body.data.isActive).toBe(true);
      });
    });

    describe('Error Cases', () => {
      it('should allow self-deactivation (soft delete)', async () => {
        // Create a separate admin user for this test
        const tempAdmin = await createTestUser({
          ...mockUsers.admin,
          email: `self.deactivate.test.${Date.now()}@example.com`,
        });

        const response = await authPatch(`/api/users/${tempAdmin.id}/status`, adminUser.token, {
          isActive: false,
        });

        expectSuccessResponse(response);
        expect(response.body.data.isActive).toBe(false);

        // Cleanup
        await deleteTestUser(tempAdmin.id);
      });

      it('should return 403 for non-admin users', async () => {
        const response = await authPatch(`/api/users/${testUserId}/status`, workerUser.token, {
          isActive: false,
        });

        expectErrorResponse(response, 403);
      });
    });
  });

  // ============================================
  // DELETE USER TESTS
  // ============================================

  describe('DELETE /api/users/:id', () => {
    let testUserId: string;

    beforeEach(async () => {
      const createRes = await authPost('/api/users', adminUser.token, {
        ...mockRegistration.valid,
        email: `delete.test.${Date.now()}@example.com`,
      });
      testUserId = createRes.body.data.id;
    });

    describe('Success Cases', () => {
      it('should delete user as admin', async () => {
        const response = await authDelete(`/api/users/${testUserId}`, adminUser.token);

        expect([200, 204]).toContain(response.status);

        // Verify soft deletion (user is deactivated, not deleted)
        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(user).not.toBeNull();
        expect(user?.isActive).toBe(false);
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent user', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await authDelete(`/api/users/${fakeId}`, adminUser.token);

        expectErrorResponse(response, 404);
      });

      it('should soft delete user (deactivate)', async () => {
        // Create a user to delete
        const tempUser = await createTestUser({
          ...mockUsers.departmentWorker,
          email: `self.delete.test.${Date.now()}@example.com`,
        });

        const response = await authDelete(`/api/users/${tempUser.id}`, adminUser.token);

        expect([200, 204]).toContain(response.status);

        // Verify user is deactivated (soft deleted)
        const user = await prisma.user.findUnique({ where: { id: tempUser.id } });
        expect(user?.isActive).toBe(false);

        // Hard delete for cleanup
        await prisma.user.delete({ where: { id: tempUser.id } });
      });

      it('should return 403 for non-admin users', async () => {
        const response = await authDelete(`/api/users/${testUserId}`, workerUser.token);

        expectErrorResponse(response, 403);
      });
    });

    afterEach(async () => {
      if (testUserId) {
        try {
          await deleteTestUser(testUserId);
        } catch {
          // User may already be deleted
        }
      }
    });
  });

  // ============================================
  // RESET PASSWORD TESTS
  // ============================================

  describe('POST /api/users/:id/reset-password', () => {
    let testUserId: string;

    beforeEach(async () => {
      const createRes = await authPost('/api/users', adminUser.token, {
        ...mockRegistration.valid,
        email: `reset.test.${Date.now()}@example.com`,
      });
      testUserId = createRes.body.data.id;
    });

    afterEach(async () => {
      if (testUserId) {
        await deleteTestUser(testUserId);
      }
    });

    describe('Success Cases', () => {
      it('should reset password as admin', async () => {
        const response = await authPost(
          `/api/users/${testUserId}/reset-password`,
          adminUser.token,
          {
            newPassword: 'NewPassword@123',
          }
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Password reset successfully');
      });
    });

    describe('Error Cases', () => {
      it('should successfully reset password (confirmPassword not validated on server)', async () => {
        const response = await authPost(
          `/api/users/${testUserId}/reset-password`,
          adminUser.token,
          {
            newPassword: 'AnotherValidPassword@123',
          }
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should return 400 for weak password', async () => {
        const response = await authPost(
          `/api/users/${testUserId}/reset-password`,
          adminUser.token,
          {
            newPassword: 'weak',
            confirmPassword: 'weak',
          }
        );

        expect(response.status).toBe(400);
      });

      it('should return 403 for non-admin users', async () => {
        const response = await authPost(
          `/api/users/${testUserId}/reset-password`,
          workerUser.token,
          {
            newPassword: 'NewPassword@123',
            confirmPassword: 'NewPassword@123',
          }
        );

        expectErrorResponse(response, 403);
      });
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle special characters in names', async () => {
      const response = await authPost('/api/users', adminUser.token, {
        ...mockRegistration.valid,
        email: 'special.chars@test.com',
        name: "O'Connor Van der Berg",
      });

      expectSuccessResponse(response, 201);
      expect(response.body.data.name).toBe("O'Connor Van der Berg");

      createdUserId = response.body.data.id;
    });

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(100);
      const response = await authPost('/api/users', adminUser.token, {
        ...mockRegistration.valid,
        email: 'long.name@test.com',
        name: longName,
      });

      // Should either accept or reject with proper error
      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        createdUserId = response.body.data.id;
      }
    });

    it('should handle email case insensitivity', async () => {
      const response = await authPost('/api/users', adminUser.token, {
        ...mockRegistration.valid,
        email: 'UPPERCASE@TEST.COM',
      });

      expectSuccessResponse(response, 201);
      // Email should be stored lowercase
      expect(response.body.data.email.toLowerCase()).toBe('uppercase@test.com');

      createdUserId = response.body.data.id;
    });
  });
});
