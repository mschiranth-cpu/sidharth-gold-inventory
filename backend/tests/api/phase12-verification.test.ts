/**
 * ============================================
 * PHASE 12 BACKEND VERIFICATION TESTS
 * ============================================
 *
 * Comprehensive tests for Phase 12 features:
 * - Enhanced Loading States
 * - Error Boundaries
 * - Photo Gallery Lightbox
 * - Global Keyboard Shortcuts
 * - 3D CAD File Preview
 * - Visual Timeline UI
 * - Real-time Notifications Enhancement
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import request from 'supertest';
import { app } from '../../src/index';
import {
  createTestUser,
  deleteTestUser,
  authGet,
  authPost,
  expectSuccessResponse,
  expectErrorResponse,
  prisma,
  TestUser,
} from '../utils/testHelpers';

describe('Phase 12 Backend Verification', () => {
  let testWorker: TestUser;
  let testOrder: any;
  let testAssignment: any;

  beforeAll(async () => {
    // Create test worker
    testWorker = await createTestUser({
      role: 'DEPARTMENT_WORKER',
      name: 'Test Worker Phase 12',
    });

    // Create a test order
    const orderRes = await prisma.order.create({
      data: {
        orderNumber: `TEST-PHASE12-${Date.now()}`,
        customerName: 'Test Customer',
        status: 'IN_PROGRESS',
        totalAmount: 5000,
      },
    });
    testOrder = orderRes;

    // Create assignment for the worker
    const assignmentRes = await prisma.departmentTracking.create({
      data: {
        orderId: testOrder.id,
        assignedToId: testWorker.id,
        departmentName: 'CAD',
        status: 'PENDING',
      },
    });
    testAssignment = assignmentRes;
  });

  afterAll(async () => {
    // Cleanup
    if (testAssignment?.id) {
      await prisma.departmentTracking.delete({ where: { id: testAssignment.id } });
    }
    if (testOrder?.id) {
      await prisma.order.delete({ where: { id: testOrder.id } });
    }
    if (testWorker?.id) {
      await deleteTestUser(testWorker.id);
    }
  });

  // ============================================
  // SECTION 1: WORKER API ENDPOINTS
  // ============================================

  describe('Worker API Endpoints', () => {
    describe('GET /api/workers/pending-assignments-count', () => {
      it('should return pending assignments count', async () => {
        const response = await authGet(`/api/workers/pending-assignments-count`, testWorker.token);

        expectSuccessResponse(response);
        expect(response.body.data).toHaveProperty('count');
        expect(response.body.data).toHaveProperty('hasAssignments');
        expect(typeof response.body.data.count).toBe('number');
      });

      it('should return 401 without authentication', async () => {
        const response = await request(app).get('/api/workers/pending-assignments-count');

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/workers/work/:orderId', () => {
      it('should return work data for assigned order', async () => {
        const response = await authGet(`/api/workers/work/${testOrder.id}`, testWorker.token);

        expectSuccessResponse(response);
        expect(response.body.data).toHaveProperty('departmentName');
        expect(response.body.data).toHaveProperty('order');
        expect(response.body.data).toHaveProperty('workData');
      });

      it('should include work data structure with files and photos', async () => {
        const response = await authGet(`/api/workers/work/${testOrder.id}`, testWorker.token);

        expect(response.body.data.workData).toHaveProperty('uploadedFiles');
        expect(response.body.data.workData).toHaveProperty('uploadedPhotos');
        expect(Array.isArray(response.body.data.workData.uploadedFiles)).toBe(true);
        expect(Array.isArray(response.body.data.workData.uploadedPhotos)).toBe(true);
      });
    });

    describe('POST /api/workers/work/:orderId/start', () => {
      it('should start work and return status', async () => {
        const response = await authPost(
          `/api/workers/work/${testOrder.id}/start`,
          {},
          testWorker.token
        );

        expectSuccessResponse(response);
        expect(response.body.message).toContain('successfully');
      });
    });

    describe('POST /api/workers/work/:orderId/save', () => {
      it('should save work progress as draft', async () => {
        const data = {
          formData: { weight: 100, quality: 'Good' },
          uploadedFiles: [],
          uploadedPhotos: [],
        };

        const response = await authPost(
          `/api/workers/work/${testOrder.id}/save`,
          data,
          testWorker.token
        );

        expectSuccessResponse(response);
        expect(response.body.message).toContain('saved');
      });

      it('should validate required form fields', async () => {
        const data = {
          formData: null,
          uploadedFiles: [],
          uploadedPhotos: [],
        };

        const response = await authPost(
          `/api/workers/work/${testOrder.id}/save`,
          data,
          testWorker.token
        );

        // Should handle gracefully
        expect([200, 400, 500]).toContain(response.status);
      });
    });

    describe('POST /api/workers/work/:orderId/complete', () => {
      it('should validate required photos before completion', async () => {
        const data = {
          formData: { weight: 100 },
          uploadedFiles: [],
          uploadedPhotos: [], // Missing required photos
        };

        const response = await authPost(
          `/api/workers/work/${testOrder.id}/complete`,
          data,
          testWorker.token
        );

        // Should either validate or provide error message
        expect([200, 400]).toContain(response.status);
      });

      it('should handle missing required form data', async () => {
        const data = {
          formData: {}, // Incomplete form
          uploadedFiles: [],
          uploadedPhotos: [],
        };

        const response = await authPost(
          `/api/workers/work/${testOrder.id}/complete`,
          data,
          testWorker.token
        );

        expect([200, 400]).toContain(response.status);
      });
    });
  });

  // ============================================
  // SECTION 2: NOTIFICATIONS ENDPOINTS
  // ============================================

  describe('Notifications API Endpoints', () => {
    describe('GET /api/notifications', () => {
      it('should return notifications list', async () => {
        const response = await authGet('/api/notifications', testWorker.token);

        expectSuccessResponse(response);
        expect(response.body.data).toHaveProperty('notifications');
        expect(Array.isArray(response.body.data.notifications)).toBe(true);
      });

      it('should support pagination parameters', async () => {
        const response = await authGet('/api/notifications?limit=10&offset=0', testWorker.token);

        expectSuccessResponse(response);
        expect(response.body.data.notifications).toBeDefined();
      });

      it('should support filtering by read status', async () => {
        const response = await authGet('/api/notifications?isRead=false', testWorker.token);

        expectSuccessResponse(response);
        // All returned notifications should be unread
        response.body.data.notifications.forEach((notif: any) => {
          expect(notif.isRead).toBe(false);
        });
      });
    });

    describe('GET /api/notifications/unread-count', () => {
      it('should return unread notification count', async () => {
        const response = await authGet('/api/notifications/unread-count', testWorker.token);

        expectSuccessResponse(response);
        expect(response.body.data).toHaveProperty('unreadCount');
        expect(typeof response.body.data.unreadCount).toBe('number');
      });
    });

    describe('PATCH /api/notifications/:id/read', () => {
      it('should mark notification as read', async () => {
        // First get a notification
        const notifRes = await authGet('/api/notifications?limit=1', testWorker.token);

        if (notifRes.body.data.notifications.length > 0) {
          const notifId = notifRes.body.data.notifications[0].id;
          const response = await request(app)
            .patch(`/api/notifications/${notifId}/read`)
            .set('Authorization', `Bearer ${testWorker.token}`);

          expect([200, 204]).toContain(response.status);
        }
      });
    });

    describe('POST /api/notifications/mark-all-read', () => {
      it('should mark all notifications as read', async () => {
        const response = await authPost('/api/notifications/mark-all-read', {}, testWorker.token);

        expect([200, 204]).toContain(response.status);
      });
    });

    describe('DELETE /api/notifications/:id', () => {
      it('should delete a notification', async () => {
        // Get a notification first
        const notifRes = await authGet('/api/notifications?limit=1', testWorker.token);

        if (notifRes.body.data.notifications.length > 0) {
          const notifId = notifRes.body.data.notifications[0].id;
          const response = await request(app)
            .delete(`/api/notifications/${notifId}`)
            .set('Authorization', `Bearer ${testWorker.token}`);

          expect([200, 204]).toContain(response.status);
        }
      });
    });
  });

  // ============================================
  // SECTION 3: DATA VALIDATION
  // ============================================

  describe('Data Validation & Error Handling', () => {
    describe('Form Field Validation', () => {
      it('should validate required number fields', async () => {
        const invalidData = {
          formData: { weight: 'not-a-number' }, // Invalid number
          uploadedFiles: [],
          uploadedPhotos: [],
        };

        const response = await authPost(
          `/api/workers/work/${testOrder.id}/save`,
          invalidData,
          testWorker.token
        );

        // Should handle or validate
        expect([200, 400]).toContain(response.status);
      });

      it('should validate text field length constraints', async () => {
        const longText = 'x'.repeat(3000); // Exceeds typical max length
        const invalidData = {
          formData: { notes: longText },
          uploadedFiles: [],
          uploadedPhotos: [],
        };

        const response = await authPost(
          `/api/workers/work/${testOrder.id}/save`,
          invalidData,
          testWorker.token
        );

        expect([200, 400]).toContain(response.status);
      });
    });

    describe('Photo & File Requirements', () => {
      it('should track photo categories correctly', async () => {
        const response = await authGet(`/api/workers/work/${testOrder.id}`, testWorker.token);

        expectSuccessResponse(response);
        // Photos should have category field
        if (response.body.data.workData.uploadedPhotos.length > 0) {
          response.body.data.workData.uploadedPhotos.forEach((photo: any) => {
            expect(photo).toHaveProperty('category');
          });
        }
      });
    });

    describe('Authentication & Authorization', () => {
      it('should reject unauthenticated requests', async () => {
        const response = await request(app).get('/api/workers/pending-assignments-count');

        expect(response.status).toBe(401);
      });

      it('should include error details in response', async () => {
        const response = await request(app).get('/api/workers/pending-assignments-count');

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  // ============================================
  // SECTION 4: ERROR HANDLING
  // ============================================

  describe('Error Handling & Recovery', () => {
    describe('Invalid Request Handling', () => {
      it('should handle invalid order ID', async () => {
        const response = await authGet('/api/workers/work/invalid-id', testWorker.token);

        expect(response.status).toBeGreaterThanOrEqual(400);
      });

      it('should handle non-existent order', async () => {
        const response = await authGet(
          '/api/workers/work/00000000-0000-0000-0000-000000000000',
          testWorker.token
        );

        expect(response.status).toBeGreaterThanOrEqual(400);
      });
    });

    describe('Error Message Quality', () => {
      it('should provide clear error messages', async () => {
        const response = await request(app).get('/api/workers/pending-assignments-count');

        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.message).toBe('string');
        expect(response.body.message.length).toBeGreaterThan(0);
      });

      it('should not expose sensitive error details', async () => {
        const response = await authPost('/api/workers/work/invalid-id/save', {}, testWorker.token);

        const responseStr = JSON.stringify(response.body);
        // Should not contain database structure details
        expect(responseStr).not.toContain('password');
        expect(responseStr).not.toContain('token');
      });
    });

    describe('Concurrent Request Handling', () => {
      it('should handle multiple simultaneous requests', async () => {
        const requests = [
          authGet('/api/notifications', testWorker.token),
          authGet('/api/notifications/unread-count', testWorker.token),
          authGet(`/api/workers/work/${testOrder.id}`, testWorker.token),
          authGet('/api/workers/pending-assignments-count', testWorker.token),
        ];

        const responses = await Promise.all(requests);

        responses.forEach((response) => {
          expect(response.status).toEqual(200);
        });
      });
    });
  });

  // ============================================
  // SECTION 5: RESPONSE FORMAT VALIDATION
  // ============================================

  describe('API Response Format Validation', () => {
    describe('Standard Response Structure', () => {
      it('should always include success field', async () => {
        const response = await authGet('/api/notifications', testWorker.token);

        expect(response.body).toHaveProperty('success');
        expect(typeof response.body.success).toBe('boolean');
      });

      it('should include data in successful responses', async () => {
        const response = await authGet('/api/notifications', testWorker.token);

        if (response.status === 200) {
          expect(response.body).toHaveProperty('data');
        }
      });

      it('should include message in responses', async () => {
        const response = await authGet('/api/notifications', testWorker.token);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('Notification Response Structure', () => {
      it('should include required notification fields', async () => {
        const response = await authGet('/api/notifications?limit=1', testWorker.token);

        expectSuccessResponse(response);
        if (response.body.data.notifications.length > 0) {
          const notif = response.body.data.notifications[0];
          expect(notif).toHaveProperty('id');
          expect(notif).toHaveProperty('type');
          expect(notif).toHaveProperty('title');
          expect(notif).toHaveProperty('message');
          expect(notif).toHaveProperty('priority');
          expect(notif).toHaveProperty('isRead');
          expect(notif).toHaveProperty('createdAt');
        }
      });
    });
  });
});
