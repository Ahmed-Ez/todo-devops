import dotenv from 'dotenv';

dotenv.config();

import { buildApp } from './app.js';

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'devdb';

const app = await buildApp({ mongoUri: MONGODB_URI, dbName: DB_NAME });  

const server = app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

// Handle shutdown signals (important for Docker/K8s)
const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down…`);
  await app.close();
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { server };
