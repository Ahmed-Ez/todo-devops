import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { buildApp } from './app.js';

let app, server;

beforeAll(async () => {
  app = await buildApp({
    mongoUri: process.env.MONGODB_URI,
    dbName: process.env.DB_NAME || 'devdb_test'
  });
  server = app.listen();
});

afterAll(async () => {
  await app.close();
  server.close();
});

test('GET /healthz', async () => {
  const res = await request(server).get('/healthz');
  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe('ok');
});

test('POST /items and GET /items', async () => {
  const created = await request(server)
    .post('/items')
    .send({ name: 'foo' })
    .set('Content-Type', 'application/json');

  expect(created.statusCode).toBe(200);
  expect(created.body.id).toBeDefined();

  const list = await request(server).get('/items');
  expect(list.statusCode).toBe(200);
  expect(Array.isArray(list.body)).toBe(true);
  expect(list.body.some(x => x.name === 'foo')).toBe(true);
});
