const request = require('supertest');
require('./setup');
const app = require('../src/app');

describe('Request ID tracing', () => {
  it('attaches a unique X-Request-Id header to every response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('uses a different ID per request', async () => {
    const res1 = await request(app).get('/api/health');
    const res2 = await request(app).get('/api/health');
    expect(res1.headers['x-request-id']).not.toBe(res2.headers['x-request-id']);
  });

  it('includes the request ID in error responses', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });
});
