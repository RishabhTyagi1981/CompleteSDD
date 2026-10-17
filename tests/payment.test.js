const request = require('supertest');
const express = require('express');
const paymentRouter = require('../src/payment');

const app = express();
app.use(express.json());
app.use(paymentRouter);

describe('SDD Automation - Stripe Payment Gateway Tests', () => {
    it('should successfully process a payment payload with valid tokens', async () => {
        const res = await request(app)
            .post('/api/v1/payments/charge')
            .send({ amount: 5000, currency: 'usd', token: 'tok_visa' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('transactionId');
    });

    it('should reject requests missing core body fields with 400 Bad Request', async () => {
        const res = await request(app)
            .post('/api/v1/payments/charge')
            .send({ amount: 5000 }); // Missing token and currency
        expect(res.statusCode).toBe(400);
    });
});