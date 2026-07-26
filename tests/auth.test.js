const request = require('supertest');
require('./setup');
const app = require('../src/app');

describe('Auth API', () => {
  const validUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(validUser.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('rejects registration with a missing password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'No Password', email: 'nopass@example.com' });

      expect(res.statusCode).toBe(400);
    });

    it('rejects registration with an invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'not-an-email' });

      expect(res.statusCode).toBe(400);
    });

    it('rejects duplicate email registration', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('logs in with correct credentials and returns a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('rejects login with the wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
    });

    it('rejects login for a non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
    });
  });
});
