const request = require('supertest');
require('./setup');
const app = require('../src/app');
const Message = require('../src/models/Message');

describe('Message reactions (model + history endpoint)', () => {
  const user = { name: 'Reactor One', email: 'reactor1@example.com', password: 'password123' };
  let token, userId, workspaceId;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    token = res.body.token;
    userId = res.body._id;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Reaction Test Team' });
    workspaceId = wsRes.body._id;
  });

  it('stores and returns reactions on a message via the history endpoint', async () => {
    const message = await Message.create({
      workspace: workspaceId,
      sender: userId,
      content: 'React to this!',
      channel: 'general',
      reactions: [{ emoji: '👍', users: [userId] }],
    });

    const res = await request(app)
      .get(`/api/messages/${workspaceId}?channel=general`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const found = res.body.messages.find((m) => m._id === message._id.toString());
    expect(found.reactions).toHaveLength(1);
    expect(found.reactions[0].emoji).toBe('👍');
    expect(found.reactions[0].users[0].name).toBe(user.name);
  });

  it('defaults to an empty reactions array on a fresh message', async () => {
    const message = await Message.create({
      workspace: workspaceId,
      sender: userId,
      content: 'No reactions yet',
      channel: 'general',
    });

    expect(message.reactions).toEqual([]);
  });
});
