import type { FastifyReply, FastifyRequest } from 'fastify';
import { redis } from '../lib/redis';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' },
    });
  }

  // Check token blacklist (populated on logout)
  const jti = (request.user as any).jti as string | undefined;
  if (jti) {
    const blacklisted = await redis.exists(`blacklist:${jti}`);
    if (blacklisted) {
      return reply.status(401).send({
        error: { code: 'TOKEN_REVOKED', message: 'Token has been revoked' },
      });
    }
  }
}

/** Blacklists a JWT by its jti with a TTL matching the token's remaining lifetime. */
export async function blacklistToken(jti: string, exp: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = exp - now;
  if (ttl > 0) {
    await redis.set(`blacklist:${jti}`, '1', 'EX', ttl);
  }
}
