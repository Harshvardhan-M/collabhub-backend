const request = require('supertest');
require('./setup');
const app = require('../src/app');

describe('Search API', () => {
  const userA = { name: 'Alice Wonderland', email: 'alice@example.com', password: 'password123' };
  const userB = { name: 'Bob Builder', email: 'bob@example.com', password: 'password123' };

  let tokenA, tokenB, workspaceId;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send(userA);
    tokenA = resA.body.token;

    const resB = await request(app).post('/api/auth/register').send(userB);
    tokenB = resB.body.token;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Search Test Team' });
    workspaceId = wsRes.body._id;
  });

  describe('GET /api/users/search', () => {
    it('finds a user by partial name match', async () => {
      const res = await request(app)
        .get('/api/users/search?q=bob')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.some((u) => u.email === userB.email)).toBe(true);
    });

    it('excludes the requester from their own search results', async () => {
      const res = await request(app)
        .get('/api/users/search?q=alice')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.some((u) => u.email === userA.email)).toBe(false);
    });

    it('rejects a search with no query', async () => {
      const res = await request(app)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(400);
    });

    it('does not error on regex special characters in the query', async () => {
      const res = await request(app)
        .get('/api/users/search?q=' + encodeURIComponent('a.*b('))
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/messages/:workspaceId/search', () => {
    it('finds a message containing the search term', async () => {
      // Insert a message directly via the Message model since sending requires a socket
      const Message = require('../src/models/Message');
      await Message.create({
        workspace: workspaceId,
        sender: (await request(app).get('/api/users/me').set('Authorization', `Bearer ${tokenA}`))
          .body._id,
        content: 'The deployment pipeline is broken again',
        channel: 'general',
      });

      const res = await request(app)
        .get(`/api/messages/${workspaceId}/search?q=deployment`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
    });

    it('rejects search from a non-member', async () => {
      const res = await request(app)
        .get(`/api/messages/${workspaceId}/search?q=test`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
