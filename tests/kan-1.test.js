const request = require('supertest');
const app = require('../src/app');

describe('POST /api/v1/auth/logout - Session Invalidation', () => {
  const validToken = 'valid-active-bearer-token';
  const expiredToken = 'expired-bearer-token';
  const nonExistentToken = 'non-existent-bearer-token';
  const malformedToken = 'malformed.token.value';

  describe('3.1 Normal Operation (Event-Driven)', () => {
    it('REQ-LOGOUT-001 & REQ-LOGOUT-002: should invalidate session and return 204 No Content (or 200 OK) with valid Bearer token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 204]).toContain(response.status);

      if (response.status === 204) {
        expect(response.text).toBe('');
      } else if (response.status === 200) {
        expect(response.body).toEqual({});
      }
    });
  });

  describe('3.2 State-Driven Behavior', () => {
    it('REQ-LOGOUT-003: should deny access when using an invalidated Bearer token', async () => {
      const tokenToInvalidate = 'session-token-to-invalidate';

      const initialResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tokenToInvalidate}`);

      expect([200, 204]).toContain(initialResponse.status);

      const subsequentResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tokenToInvalidate}`);

      expect(subsequentResponse.status).toBe(401);
    });
  });

  describe('3.3 Error Handling & Edge Cases (Unwanted Behavior)', () => {
    it('REQ-LOGOUT-004: should reject with 401 Unauthorized if Authorization header is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
    });

    it('REQ-LOGOUT-004: should reject with 401 Unauthorized if Authorization header does not contain Bearer scheme', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Basic dXNlcjpwYXNz');

      expect(response.status).toBe(401);
    });

    it('REQ-LOGOUT-005: should reject with 401 Unauthorized if Bearer token is empty or malformed', async () => {
      const responseEmpty = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer ');

      expect(responseEmpty.status).toBe(401);

      const responseMalformed = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${malformedToken}`);

      expect(responseMalformed.status).toBe(401);
    });

    it('REQ-LOGOUT-005: should reject with 401 Unauthorized if Bearer token is expired', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('REQ-LOGOUT-005: should reject with 401 Unauthorized if Bearer token does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${nonExistentToken}`);

      expect(response.status).toBe(401);
    });

    it('REQ-LOGOUT-006: should return 503 Service Unavailable if session store is unavailable', async () => {
      if (app.locals && app.locals.sessionStore) {
        jest.spyOn(app.locals.sessionStore, 'destroy').mockImplementationOnce((token, callback) => {
          if (callback) return callback(new Error('Session store offline'));
          return Promise.reject(new Error('Session store offline'));
        });
      }

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer trigger-store-unavailable-token');

      expect(response.status).toBe(503);
    });
  });
});