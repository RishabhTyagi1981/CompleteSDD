const mockQuery = jest.fn();
jest.mock('pg', () => ({ Pool: jest.fn(() => ({ query: mockQuery, end: jest.fn().mockResolvedValue() })) }));
const request = require('supertest');
const app = require('../src/app');

describe('Asynchronous Auth Verification Layer', () => {
    it('should successfully pass login authentication (AC_01)', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, username: 'admin', password_hash: 'Secure123!', role: 'admin' }] });
        const res = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'Secure123!' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
});
