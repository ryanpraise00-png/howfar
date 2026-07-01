import type { FastifyReply, FastifyRequest } from 'fastify';

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } });
  }
}
