import 'dotenv/config';
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

  // Health-check connectivity
  try {
    await prisma.$connect();
    console.log('[Prisma] database connected');
  } catch (err) {
    console.warn('[Prisma] database not reachable at startup:', (err as Error).message);
  }

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
