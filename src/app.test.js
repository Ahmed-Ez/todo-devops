import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { buildApp } from './app.js';

let app, server;

const API_KEY = process.env.API_TOKEN || 'test-token';

// tiny helpers to always include the header
const getAuthed = (url) => request(server).get(url).set('x-api-key', API_KEY);
const postAuthed = (url) => request(server).post(url).set('x-api-key', API_KEY);

beforeAll(async () => {
  app = await buildApp({
    mongoUri: process.env.MONGODB_URI,
    dbName: process.env.DB_NAME || 'devdb_test',
  });
  server = app.listen();
});

afterAll(async () => {
  await app.close();
  server.close();
});

test('GET /healthz', async () => {
  const res = await getAuthed('/healthz'); // ok if your healthz doesn’t require it
  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe('ok');
});

test('POST /items and GET /items', async () => {
  const created = await postAuthed('/items')
    .set('Content-Type', 'application/json')
    .send({ name: 'foo' });

  expect(created.statusCode).toBe(200);
  expect(created.body.id).toBeDefined();

  const list = await getAuthed('/items');
  expect(list.statusCode).toBe(200);
  expect(Array.isArray(list.body)).toBe(true);
  expect(list.body.some(x => x.name === 'foo')).toBe(true);
});
