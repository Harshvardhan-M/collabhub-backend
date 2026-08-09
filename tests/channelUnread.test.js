const request = require('supertest');
require('./setup');
const app = require('../src/app');
const Message = require('../src/models/Message');

describe('Channel unread counts', () => {
  const owner = { name: 'Channel Owner', email: 'chowner@example.com', password: 'password123' };
  const member = { name: 'Channel Member', email: 'chmember@example.com', password: 'password123' };

  let ownerToken, memberToken, memberId, workspaceId;

  beforeEach(async () => {
    const ownerRes = await request(app).post('/api/auth/register').send(owner);
    ownerToken = ownerRes.body.token;

    const memberRes = await request(app).post('/api/auth/register').send(member);
    memberToken = memberRes.body.token;
    memberId = memberRes.body._id;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Unread Test Team' });
    workspaceId = wsRes.body._id;

    await request(app)
      .post('/api/workspaces/join')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ inviteCode: wsRes.body.inviteCode });
  });

  it('reports unread messages in a channel the member has never opened', async () => {
    await Message.create({
      workspace: workspaceId,
      sender: (
        await request(app).get('/api/users/me').set('Authorization', `Bearer ${ownerToken}`)
      ).body._id,
      content: 'Welcome to the team!',
      channel: 'general',
    });

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/channels`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(200);
    const general = res.body.find((c) => c.name === 'general');
    expect(general.unreadCount).toBe(1);
  });

  it('clears unread count after marking the channel as read', async () => {
    const ownerId = (
      await request(app).get('/api/users/me').set('Authorization', `Bearer ${ownerToken}`)
    ).body._id;

    await Message.create({
      workspace: workspaceId,
      sender: ownerId,
      content: 'First message',
      channel: 'general',
    });

    await request(app)
      .put(`/api/workspaces/${workspaceId}/channels/general/read`)
      .set('Authorization', `Bearer ${memberToken}`);

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/channels`)
      .set('Authorization', `Bearer ${memberToken}`);

    const general = res.body.find((c) => c.name === 'general');
    expect(general.unreadCount).toBe(0);
  });

  it('does not count the viewer own messages as unread', async () => {
    await Message.create({
      workspace: workspaceId,
      sender: memberId,
      content: 'My own message',
      channel: 'general',
    });

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/channels`)
      .set('Authorization', `Bearer ${memberToken}`);

    const general = res.body.find((c) => c.name === 'general');
    expect(general.unreadCount).toBe(0);
  });
});
