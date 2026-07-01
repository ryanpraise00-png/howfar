import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/statusController';

function parse<T>(schema: z.ZodType<T>, data: unknown, reply: any): T | null {
  const r = schema.safeParse(data);
  if (!r.success) {
    reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: r.error.issues[0]?.message ?? 'Validation error' } });
    return null;
  }
  return r.data;
}

const createBody = z.object({
  type: z.enum(['IMAGE', 'TEXT', 'VIDEO']),
  mediaUrl: z.string().url().optional(),
  content: z.string().max(500).optional(),
  bgColor: z.string().optional(),
  caption: z.string().max(200).optional(),
});

const reactBody = z.object({ emoji: z.string().min(1).max(8) });

export async function statusRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /status/feed
  app.get('/feed', async (req, reply) => {
    try {
      return reply.send(await ctrl.getStatusFeed(req.user.sub));
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'FEED_ERROR', message: err.message } });
    }
  });

  // POST /status
  app.post('/', async (req, reply) => {
    const body = parse(createBody, req.body, reply);
    if (!body) return;
    try {
      const post = await ctrl.createStatus(req.user.sub, body);
      return reply.status(201).send(post);
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'CREATE_ERROR', message: err.message } });
    }
  });

  // POST /status/:statusPostId/view
  app.post('/:statusPostId/view', async (req, reply) => {
    const { statusPostId } = req.params as { statusPostId: string };
    try {
      return reply.send(await ctrl.recordView(statusPostId, req.user.sub));
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'VIEW_ERROR', message: err.message } });
    }
  });

  // POST /status/:statusPostId/react
  app.post('/:statusPostId/react', async (req, reply) => {
    const { statusPostId } = req.params as { statusPostId: string };
    const body = parse(reactBody, req.body, reply);
    if (!body) return;
    try {
      return reply.send(await ctrl.reactToStatus(statusPostId, req.user.sub, body.emoji));
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'REACT_ERROR', message: err.message } });
    }
  });

  // GET /status/:statusPostId/views
  app.get('/:statusPostId/views', async (req, reply) => {
    const { statusPostId } = req.params as { statusPostId: string };
    try {
      return reply.send(await ctrl.getStatusViews(statusPostId, req.user.sub));
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'VIEWS_ERROR', message: err.message } });
    }
  });

  // DELETE /status/:statusPostId
  app.delete('/:statusPostId', async (req, reply) => {
    const { statusPostId } = req.params as { statusPostId: string };
    try {
      await ctrl.deleteStatus(statusPostId, req.user.sub);
      return reply.status(204).send();
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'DELETE_ERROR', message: err.message } });
    }
  });
}
