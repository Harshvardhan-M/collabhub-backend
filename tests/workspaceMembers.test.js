const request = require('supertest');
require('./setup');
const app = require('../src/app');

describe('Workspace member management API', () => {
  const admin = { name: 'Admin User', email: 'admin@example.com', password: 'password123' };
  const member = { name: 'Member User', email: 'member@example.com', password: 'password123' };

  let adminToken, memberToken, memberId, workspaceId;

  beforeEach(async () => {
    const adminRes = await request(app).post('/api/auth/register').send(admin);
    adminToken = adminRes.body.accessToken;

    const memberRes = await request(app).post('/api/auth/register').send(member);
    memberToken = memberRes.body.accessToken;
    memberId = memberRes.body._id;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Team Test' });
    workspaceId = wsRes.body._id;

    await request(app)
      .post('/api/workspaces/join')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ inviteCode: wsRes.body.inviteCode });
  });

  it('lets an admin promote a member to admin', async () => {
    const res = await request(app)
      .put(`/api/workspaces/${workspaceId}/members/${memberId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });

    expect(res.statusCode).toBe(200);
    expect(res.body.member.role).toBe('admin');
  });

  it('rejects a non-admin trying to change roles', async () => {
    const res = await request(app)
      .put(`/api/workspaces/${workspaceId}/members/${memberId}/role`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ role: 'admin' });

    expect(res.statusCode).toBe(403);
  });

  it('lets an admin remove another member', async () => {
    const res = await request(app)
      .delete(`/api/workspaces/${workspaceId}/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('lets a member remove themselves', async () => {
    const res = await request(app)
      .delete(`/api/workspaces/${workspaceId}/members/${memberId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('rejects removing the workspace owner', async () => {
    const wsRes = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const ownerId = wsRes.body.owner._id;

    const res = await request(app)
      .delete(`/api/workspaces/${workspaceId}/members/${ownerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
  });
});
