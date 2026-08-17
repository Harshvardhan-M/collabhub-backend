const request = require('supertest');
const fs = require('fs');
const path = require('path');
require('./setup');
const app = require('../src/app');

describe('File upload API', () => {
  const user = { name: 'Uploader', email: 'uploader@example.com', password: 'password123' };
  let token;
  const uploadedFiles = [];

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    token = res.body.accessToken;
  });

  afterAll(() => {
    // Clean up any files actually written to disk during these tests
    uploadedFiles.forEach((filePath) => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  });

  it('rejects an upload without a token', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .attach('file', Buffer.from('fake image data'), 'test.png');

    expect(res.statusCode).toBe(401);
  });

  it('rejects a request with no file', async () => {
    const res = await request(app).post('/api/uploads').set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });

  it('accepts an allowed file type and returns a usable URL', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('fake png bytes'), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('url');
    expect(res.body.url).toMatch(/^\/uploads\//);
    expect(res.body.filename).toBe('photo.png');
    expect(res.body.mimetype).toBe('image/png');

    uploadedFiles.push(path.join(__dirname, '..', res.body.url));

    // The file should actually be servable
    const fetchRes = await request(app).get(res.body.url);
    expect(fetchRes.statusCode).toBe(200);
  });

  it('rejects a disallowed file type', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('#!/bin/sh\necho hi'), {
        filename: 'script.sh',
        contentType: 'application/x-sh',
      });

    expect(res.statusCode).toBe(400);
  });

  it('rejects a file over the 5MB limit', async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', bigBuffer, { filename: 'big.png', contentType: 'image/png' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/too large/i);
  });
});
