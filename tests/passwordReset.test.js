const request = require('supertest');
require('./setup');

// Mock the email util so we can capture the reset link instead of actually sending mail
jest.mock('../src/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ delivered: false, logged: true }),
}));

const { sendEmail } = require('../src/utils/email');
const app = require('../src/app');

describe('Password reset flow', () => {
  const user = { name: 'Reset User', email: 'resetuser@example.com', password: 'password123' };

  beforeEach(() => {
    sendEmail.mockClear();
  });

  const extractTokenFromEmail = () => {
    const emailText = sendEmail.mock.calls[0][0].text;
    const match = emailText.match(/token=([a-f0-9]+)/);
    return match[1];
  };

  it('returns a generic success message for an existing email and sends an email', async () => {
    await request(app).post('/api/auth/register').send(user);

    const res = await request(app).post('/api/auth/forgot-password').send({ email: user.email });

    expect(res.statusCode).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].to).toBe(user.email);
  });

  it('returns the same generic message for a non-existent email (no account enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/if an account/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('resets the password with a valid token and allows login with the new password', async () => {
    await request(app).post('/api/auth/register').send(user);
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });

    const token = extractTokenFromEmail();

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'brandnewpassword456' });

    expect(resetRes.statusCode).toBe(200);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'brandnewpassword456' });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('accessToken');
  });

  it('rejects the old password after a reset', async () => {
    await request(app).post('/api/auth/register').send(user);
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const token = extractTokenFromEmail();

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'brandnewpassword456' });

    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    expect(oldLoginRes.statusCode).toBe(401);
  });

  it('rejects reuse of an already-used reset token', async () => {
    await request(app).post('/api/auth/register').send(user);
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const token = extractTokenFromEmail();

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'brandnewpassword456' });

    const secondAttempt = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'anotherpassword789' });

    expect(secondAttempt.statusCode).toBe(400);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', newPassword: 'somepassword123' });

    expect(res.statusCode).toBe(400);
  });

  it('revokes all existing refresh tokens after a password reset', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(user);
    const { refreshToken } = registerRes.body;

    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const token = extractTokenFromEmail();

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'brandnewpassword456' });

    const refreshAttempt = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(refreshAttempt.statusCode).toBe(401);
  });
});
