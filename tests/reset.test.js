const request = require('supertest');
const app = require('../src/app');

describe('SDD Automated Validation Suite - KAN-1 Reset Engine', () => {
    it('should generate a valid 6-digit numeric verification code (AC_01)', async () => {
        const res = await request(app)
            .post('/api/v1/auth/reset-request')
            .send({ username: 'admin' });
        expect(res.statusCode).toBe(200);
        expect(res.body.code).toMatch(/^\d{6}$/); // Enforces absolute 6-digit number constraint
    });

    it('should short-circuit and return 400 if username is missing (AC_02)', async () => {
        const res = await request(app).post('/api/v1/auth/reset-request').send({});
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Username is required");
    });
});
