const request = require('supertest');
require('./setup');
const app = require('../src/app');

describe('Workspace API', () => {
  const testUser = { name: 'Workspace Owner', email: 'owner@example.com', password: 'password123' };
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.accessToken;
  });

  it('rejects workspace creation without a token', async () => {
    const res = await request(app).post('/api/workspaces').send({ name: 'No Auth Workspace' });
    expect(res.statusCode).toBe(401);
  });

  it('creates a workspace when authenticated, with a default #general channel', async () => {
    const createRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Team', description: 'A test workspace' });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.name).toBe('My Team');
    expect(createRes.body).toHaveProperty('inviteCode');

    const channelsRes = await request(app)
      .get(`/api/workspaces/${createRes.body._id}/channels`)
      .set('Authorization', `Bearer ${token}`);

    expect(channelsRes.statusCode).toBe(200);
    expect(channelsRes.body.some((c) => c.name === 'general')).toBe(true);
  });

  it('rejects workspace creation with an empty name', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });
    expect(res.statusCode).toBe(400);
  });

  it('lists only workspaces the user belongs to', async () => {
    await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Team Alpha' });

    const res = await request(app).get('/api/workspaces').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Team Alpha');
  });
});
