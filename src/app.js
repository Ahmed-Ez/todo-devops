import express from 'express';
import { MongoClient } from 'mongodb';

export async function buildApp({ mongoUri, dbName }) {
  const app = express();
  app.use(express.json());

  // Mongo connection
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);

  // attach for routes
  app.locals.mongo = { client, db };

  // Health endpoints
  app.get('/healthz', (req, res) => res.json({ status: 'ok' }));
  app.get('/readyz', async (req, res) => {
    try {
      await db.command({ ping: 1 });
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not-ready' });
    }
  });

  // Simple CRUD
  app.get('/items', async (req, res) => {
    const items = await db.collection('items').find({}).limit(50).toArray();
    res.json(items);
  });

  app.post('/items', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = await db.collection('items').insertOne({ name, createdAt: new Date() });
    res.json({ id: result.insertedId });
  });

  // Graceful shutdown helper
  app.close = async () => {
    await client.close();
  };

  return app;
}
