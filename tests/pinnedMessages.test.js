const request = require('supertest');
require('./setup');
const app = require('../src/app');
const Message = require('../src/models/Message');

describe('Pinned messages', () => {
  const admin = { name: 'Pin Admin', email: 'pinadmin@example.com', password: 'password123' };
  let adminToken, workspaceId;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(admin);
    adminToken = res.body.accessToken;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Pin Test Team' });
    workspaceId = wsRes.body._id;
  });

  it('lists pinned messages via the model flag', async () => {
    const adminId = (
      await request(app).get('/api/users/me').set('Authorization', `Bearer ${adminToken}`)
    ).body._id;

    await Message.create({
      workspace: workspaceId,
      sender: adminId,
      content: 'Pin me',
      channel: 'general',
      pinned: true,
    });
    await Message.create({
      workspace: workspaceId,
      sender: adminId,
      content: 'Not pinned',
      channel: 'general',
    });

    const res = await request(app)
      .get(`/api/messages/${workspaceId}/pinned?channel=general`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].content).toBe('Pin me');
  });

  it('rejects a non-member from viewing pinned messages', async () => {
    const other = { name: 'Outsider', email: 'outsider@example.com', password: 'password123' };
    const otherRes = await request(app).post('/api/auth/register').send(other);

    const res = await request(app)
      .get(`/api/messages/${workspaceId}/pinned`)
      .set('Authorization', `Bearer ${otherRes.body.accessToken}`);

    expect(res.statusCode).toBe(403);
  });
});
