import { jest } from '@jest/globals';
import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { buildApp } from './app.js';

// give the app & DB time to boot
jest.setTimeout(30_000);

let app, server;

// prefer API_AUTH_TOKEN (CI secret), fallback for local dev
const API_KEY =
  process.env.API_KEY ||
  process.env.X_API_KEY ||
  'test-token';

  console.log(API_KEY)
// use local service DB by default; append a short server selection timeout
const baseUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/todo_test';
const MONGO_URI = baseUri + (baseUri.includes('?') ? '&' : '?') + 'serverSelectionTimeoutMS=5000';

// helper wrappers that always attach the header
const getAuthed = (url) => request(server).get(url).set('x-api-key', API_KEY);
const postAuthed = (url) => request(server).post(url).set('x-api-key', API_KEY);

// poll /healthz so we don't race the DB connection
async function waitForHealthy(retries = 60, delayMs = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await getAuthed('/healthz');
      if (res.statusCode === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error('App did not become healthy in time');
}

beforeAll(async () => {
  app = await buildApp({
    mongoUri: MONGO_URI,
    dbName: process.env.DB_NAME || 'devdb_test',
  });
  server = app.listen();
  await waitForHealthy();
});

afterAll(async () => {
  if (server?.close) await new Promise((res) => server.close(res));
  if (app?.close) await app.close();
});

test('GET /healthz', async () => {
  const res = await getAuthed('/healthz');
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
  expect(list.body.some((x) => x.name === 'foo')).toBe(true);
});
