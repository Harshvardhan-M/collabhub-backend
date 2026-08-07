const request = require('supertest');
require('./setup');
const app = require('../src/app');

describe('Unread counts & read receipts', () => {
  const userA = { name: 'Reader One', email: 'reader1@example.com', password: 'password123' };
  const userB = { name: 'Reader Two', email: 'reader2@example.com', password: 'password123' };

  let tokenA, tokenB, idA, idB;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send(userA);
    tokenA = resA.body.token;
    idA = resA.body._id;

    const resB = await request(app).post('/api/auth/register').send(userB);
    tokenB = resB.body.token;
    idB = resB.body._id;
  });

  it('increments unread count when a DM is sent, and clears it when the recipient reads it', async () => {
    await request(app)
      .post(`/api/dm/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Hey there' });

    const unreadRes = await request(app)
      .get('/api/dm/unread-count')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(unreadRes.body.unreadCount).toBe(1);

    // Reading the conversation should mark it as read
    await request(app).get(`/api/dm/${idA}`).set('Authorization', `Bearer ${tokenB}`);

    const afterReadRes = await request(app)
      .get('/api/dm/unread-count')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(afterReadRes.body.unreadCount).toBe(0);
  });

  it('includes unreadCount per conversation in the conversations list', async () => {
    await request(app)
      .post(`/api/dm/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'First message' });

    const res = await request(app)
      .get('/api/dm/conversations')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.statusCode).toBe(200);
    expect(res.body[0].unreadCount).toBe(1);
  });

  it('explicit mark-as-read endpoint clears unread count without fetching history', async () => {
    await request(app)
      .post(`/api/dm/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Please read this' });

    await request(app).put(`/api/dm/${idA}/read`).set('Authorization', `Bearer ${tokenB}`);

    const res = await request(app)
      .get('/api/dm/unread-count')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.body.unreadCount).toBe(0);
  });

  it('does not count the sender own messages as unread for themselves', async () => {
    await request(app)
      .post(`/api/dm/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Hello' });

    const res = await request(app)
      .get('/api/dm/unread-count')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.body.unreadCount).toBe(0);
  });

  it('reports unread notification count and clears it on mark-all-read', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Notif Test Team' });

    await request(app)
      .post('/api/workspaces/join')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ inviteCode: wsRes.body.inviteCode });

    const unreadRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(unreadRes.body.unreadCount).toBe(1);

    await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${tokenA}`);

    const afterRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(afterRes.body.unreadCount).toBe(0);
  });
});
