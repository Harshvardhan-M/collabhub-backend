const request = require('supertest');
require('./setup');
const app = require('../src/app');

describe('Rate limiting (test-env bypass)', () => {
  it('allows many rapid login attempts in the test environment without 429', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Rate Test',
      email: 'ratetest@example.com',
      password: 'password123',
    });

    for (let i = 0; i < 15; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ratetest@example.com', password: 'wrongpassword' });
      expect(res.statusCode).toBe(401);
    }
  });
});
