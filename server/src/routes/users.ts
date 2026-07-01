import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { searchUsers } from '../controllers/chatController';

const searchQuery = z.object({
  q: z.string().min(1).max(100),
});

export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /users/search?q=...
  app.get('/search', async (req, reply) => {
    const result = searchQuery.safeParse(req.query);
    if (!result.success) {
      return reply.send([]);
    }
    try {
      return reply.send(await searchUsers(req.user.sub, result.data.q.trim()));
    } catch (err: any) {
      reply.status(500).send({ error: { code: 'SEARCH_ERROR', message: err.message } });
    }
  });
}
