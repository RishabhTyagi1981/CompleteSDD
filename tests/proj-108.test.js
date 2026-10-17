const request = require('supertest');
const app = require('../src/app');

describe('POST /api/v1/auth/logout', () => {
  const VALID_TOKEN = 'valid-session-token-xyz';
  const INVALID_TOKEN = 'invalid-session-token-000';
  const EXPIRED_TOKEN = 'expired-session-token-999';
  const MALFORMED_TOKEN = 'malformed_token_format';

  describe('Unwanted Behavior / Error Handling Requirements', () => {
    test('REQ-LOGOUT-003: should return 401 Unauthorized if Authorization header is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
    });

    test('REQ-LOGOUT-003: should return 401 Unauthorized if Authorization header lacks Bearer scheme', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Basic user:pass');

      expect(response.status).toBe(401);
    });

    test('REQ-LOGOUT-004: should return 401 Unauthorized with an invalid Bearer token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${INVALID_TOKEN}`);

      expect(response.status).toBe(401);
    });

    test('REQ-LOGOUT-004: should return 401 Unauthorized with a malformed Bearer token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${MALFORMED_TOKEN}`);

      expect(response.status).toBe(401);
    });

    test('REQ-LOGOUT-004: should return 401 Unauthorized with an expired Bearer token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${EXPIRED_TOKEN}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Normal Operation & State-Driven Requirements', () => {
    test('REQ-LOGOUT-001 & REQ-LOGOUT-002: should invalidate session and return 204 No Content with an empty body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(204);
      expect(response.text).toBe('');
      expect(response.body).toEqual({});
    });

    test('REQ-LOGOUT-005: should reject subsequent requests using the invalidated token with 401 Unauthorized', async () => {
      const freshToken = 'session-token-to-be-invalidated';

      const initialResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${freshToken}`);

      expect(initialResponse.status).toBe(204);

      const subsequentResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${freshToken}`);

      expect(subsequentResponse.status).toBe(401);
    });
  });
});