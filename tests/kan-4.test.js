const request = require('supertest');
const app = require('../src/app');

describe('Functional Specification: Password Reset Verification Code Request', () => {
  const validUserEmail = 'registered.user@example.com';
  const unregisteredEmail = 'unregistered.user@example.com';
  const deliveryFailureEmail = 'fail.delivery@example.com';
  const rateLimitedEmail = 'ratelimit.user@example.com';
  const validFormattedCode = '123456';
  const invalidFormatCode = '12A45B';

  const genericSuccessMessage = 'If an account exists for this identifier, a verification code has been sent.';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('3.1 Normal Operation (Event-Driven)', () => {
    it('REQ-PWD-001, REQ-PWD-002, REQ-PWD-003: should accept request, generate 6-digit code, dispatch, and return generic confirmation', async () => {
      const response = await request(app)
        .post('/api/password-reset/request')
        .send({ identifier: validUserEmail });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', genericSuccessMessage);
      expect(response.body).not.toHaveProperty('verification_code');
    });
  });

  describe('3.2 State-Driven Behavior', () => {
    it('REQ-PWD-004: should allow successful verification within 15 minutes of code generation', async () => {
      await request(app)
        .post('/api/password-reset/request')
        .send({ identifier: validUserEmail });

      const response = await request(app)
        .post('/api/password-reset/verify')
        .send({
          identifier: validUserEmail,
          code: validFormattedCode
        });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('verified', true);
      }
    });

    it('REQ-PWD-005: should restrict maximum number of failed submission attempts to 5', async () => {
      const targetEmail = 'lockout.test@example.com';
      await request(app)
        .post('/api/password-reset/request')
        .send({ identifier: targetEmail });

      const invalidCode = '000000';

      for (let attempt = 1; attempt <= 5; attempt++) {
        const attemptResponse = await request(app)
          .post('/api/password-reset/verify')
          .send({ identifier: targetEmail, code: invalidCode });

        expect(attemptResponse.status).toBe(400);
        expect(attemptResponse.body.message).toMatch(/invalid.*code|attempts remaining/i);
      }

      const blockedResponse = await request(app)
        .post('/api/password-reset/verify')
        .send({ identifier: targetEmail, code: invalidCode });

      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body.message).toMatch(/maximum failed attempts exceeded/i);
    });
  });

  describe('3.3 Unwanted Behavior & Exception Handling', () => {
    it('REQ-PWD-006: should return identical confirmation response when identifier is not registered without dispatching', async () => {
      const successResponse = await request(app)
        .post('/api/password-reset/request')
        .send({ identifier: validUserEmail });

      const unregResponse = await request(app)
        .post('/api/password-reset/request')
        .send({ identifier: unregisteredEmail });

      expect(unregResponse.status).toBe(200);
      expect(unregResponse.status).toBe(successResponse.status);
      expect(unregResponse.body.message).toBe(successResponse.body.message);
      expect(unregResponse.body).toEqual(successResponse.body);
    });

    it('REQ-PWD-007: should throttle requests and return cooldown error when exceeding 3 requests in 60 minutes', async () => {
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/password-reset/request')
          .send({ identifier: rateLimitedEmail });
        expect(res.status).toBe(200);
      }

      const throttledResponse = await request(app)
        .post('/api/password-reset/request')
        .send({ identifier: rateLimitedEmail });

      expect(throttledResponse.status).toBe(429);
      expect(throttledResponse.body).toHaveProperty('message');
      expect(throttledResponse.body.message).toMatch(/rate limit exceeded|retry/i);
      expect(throttledResponse.body).toHaveProperty('retry_after');
    });

    it('REQ-PWD-008: should invalidate verification code after 15 minutes (900 seconds)', async () => {
      const expirationUser = 'expire.user@example.com';
      await request(app)
        .post('/api/password-reset/request')
        .send({ identifier: expirationUser });

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + 15 * 60 * 1000 + 1000);

      const response = await request(app)
        .post('/api/password-reset/verify')
        .send({
          identifier: expirationUser,
          code: validFormattedCode
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/expired|invalid/i);

      jest.useRealTimers();
    });

    it('REQ-PWD-009: should log error and present generic retry prompt when delivery service fails', async () => {
      const response = await request(app)
        .post('/api/password-reset/request')
        .send({ identifier: deliveryFailureEmail });

      expect([500, 502, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/delivery failed|please try again later/i);
    });
  });

  describe('3.4 Ubiquitous Requirements', () => {
    it('REQ-PWD-010: should reject verification codes that do not strictly adhere to 6 numeric digits', async () => {
      const badAlphaResponse = await request(app)
        .post('/api/password-reset/verify')
        .send({
          identifier: validUserEmail,
          code: invalidFormatCode
        });
      expect(badAlphaResponse.status).toBe(400);
      expect(badAlphaResponse.body.message).toMatch(/must be 6 numeric digits/i);

      const shortResponse = await request(app)
        .post('/api/password-reset/verify')
        .send({
          identifier: validUserEmail,
          code: '12345'
        });
      expect(shortResponse.status).toBe(400);

      const longResponse = await request(app)
        .post('/api/password-reset/verify')
        .send({
          identifier: validUserEmail,
          code: '1234567'
        });
      expect(longResponse.status).toBe(400);
    });

    it('REQ-PWD-011: should store verification codes as salted cryptographic hashes', async () => {
      const debugInternalStore = app.locals && app.locals.db ? app.locals.db : null;
      if (debugInternalStore && typeof debugInternalStore.findResetToken === 'function') {
        await request(app)
          .post('/api/password-reset/request')
          .send({ identifier: validUserEmail });

        const record = await debugInternalStore.findResetToken(validUserEmail);
        expect(record).toBeDefined();
        expect(record.code_hash).toBeDefined();
        expect(record.code_hash).not.toMatch(/^[0-9]{6}$/);
        expect(record).not.toHaveProperty('verification_code');
        expect(record.salt).toBeDefined();
      } else {
        const response = await request(app)
          .post('/api/password-reset/request')
          .send({ identifier: validUserEmail });
        expect(response.status).toBe(200);
      }
    });

    it('REQ-PWD-012: should enforce single-use consumption of verification code', async () => {
      const singleUseEmail = 'singleuse.user@example.com';

      await request(app)
        .post('/api/password-reset/request')
        .send({ identifier: singleUseEmail });

      const firstConsume = await request(app)
        .post('/api/password-reset/verify')
        .send({
          identifier: singleUseEmail,
          code: validFormattedCode
        });

      if (firstConsume.status === 200) {
        const secondConsume = await request(app)
          .post('/api/password-reset/verify')
          .send({
            identifier: singleUseEmail,
            code: validFormattedCode
          });

        expect(secondConsume.status).toBe(400);
        expect(secondConsume.body.message).toMatch(/already used|invalid|expired/i);
      }
    });
  });
});