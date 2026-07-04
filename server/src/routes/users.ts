import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { searchUsers } from '../controllers/chatController';
import { prisma } from '../lib/prisma';

const searchQuery = z.object({
  q: z.string().min(1).max(100),
});

const blockBody = z.object({
  blockedUserId: z.string().min(1),
});

const reportBody = z.object({
  reportedUserId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

const contactBody = z.object({
  contactId: z.string().min(1),
  nickname: z.string().max(100).optional(),
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

  // POST /users/block
  app.post('/block', async (req, reply) => {
    const parsed = blockBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION', message: 'Invalid body' } });
    }
    const { blockedUserId } = parsed.data;
    const blockerId = req.user.sub;

    if (blockedUserId === blockerId) {
      return reply.status(400).send({ error: { code: 'SELF_BLOCK', message: 'Cannot block yourself' } });
    }

    await prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId: blockedUserId } },
      create: { blockerId, blockedId: blockedUserId },
      update: {},
    });

    return reply.send({ ok: true });
  });

  // DELETE /users/block/:blockedUserId — unblock
  app.delete('/block/:blockedUserId', async (req, reply) => {
    const { blockedUserId } = req.params as { blockedUserId: string };
    const blockerId = req.user.sub;

    await prisma.blockedUser.deleteMany({
      where: { blockerId, blockedId: blockedUserId },
    });

    return reply.send({ ok: true });
  });

  // POST /users/report
  app.post('/report', async (req, reply) => {
    const parsed = reportBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION', message: 'Invalid body' } });
    }
    const { reportedUserId, reason } = parsed.data;
    const reporterId = req.user.sub;

    if (reportedUserId === reporterId) {
      return reply.status(400).send({ error: { code: 'SELF_REPORT', message: 'Cannot report yourself' } });
    }

    await prisma.report.create({
      data: { reporterId, reportedUserId, reason },
    });

    return reply.send({ ok: true });
  });

  // POST /users/contacts — add a contact
  app.post('/contacts', async (req, reply) => {
    const parsed = contactBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION', message: 'Invalid body' } });
    }
    const { contactId, nickname } = parsed.data;
    const ownerId = req.user.sub;

    const target = await prisma.user.findUnique({ where: { id: contactId } });
    if (!target) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    await prisma.contact.upsert({
      where: { ownerId_contactId: { ownerId, contactId } },
      create: { ownerId, contactId, nickname },
      update: { nickname },
    });

    return reply.send({ ok: true });
  });
}
