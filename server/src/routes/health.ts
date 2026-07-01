import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { pingRedis } from '../lib/redis';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    let db = false;
    let redis = false;

    try {
      await prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      // db not reachable — still return 200 with status flags
    }

    try {
      redis = await pingRedis();
    } catch {
      // redis not reachable
    }

    return reply.send({
      status: 'ok',
      version: '1.0.0',
      services: { db, redis },
    });
  });
}
