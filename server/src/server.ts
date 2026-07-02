// force redeploy
import dotenv from 'dotenv';

// Only load .env file in development — in production
// Railway injects env vars directly
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
import { buildApp } from './app';
import { createSocketServer } from './sockets/index';
import { prisma } from './lib/prisma';
import { pingRedis } from './lib/redis';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function main() {
  // Build Fastify app
  const app = await buildApp();

  // Attach Socket.io to Fastify's underlying http.Server
  const io = createSocketServer(app, app.server);
  app.decorate('io', io);

  // Health-check connectivity — non-blocking; never prevent server from starting
  Promise.race([
    prisma.$connect(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
  ])
    .then(() => console.log('[Prisma] database connected'))
    .catch((err: Error) => console.warn('[Prisma] database not reachable at startup:', err.message));

  const redisOk = await pingRedis();
  console.log(`[Redis] ping: ${redisOk ? 'PONG ✓' : 'failed ✗'}`);

  // Start listening
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[Server] HowFar API running on http://0.0.0.0:${PORT}`);
  console.log(`[Server] Health: http://localhost:${PORT}/health`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] ${signal} received — shutting down…`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[Server] fatal error:', err);
  process.exit(1);
});
