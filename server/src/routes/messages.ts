import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export async function messageRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/messages/starred — list all starred messages for the current user
  app.get('/starred', async (req, reply) => {
    const userId = req.user.sub;

    const messages = await prisma.message.findMany({
      where: {
        isStarred: true,
        chat: { members: { some: { userId } } },
      },
      include: {
        chat: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return reply.send(messages);
  });

  // PATCH /api/messages/:id/star — toggle star
  app.patch('/:id/star', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.user.sub;

    const message = await prisma.message.findFirst({
      where: {
        id,
        chat: { members: { some: { userId } } },
      },
    });

    if (!message) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Message not found' } });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { isStarred: !message.isStarred },
      select: { id: true, isStarred: true },
    });

    return reply.send(updated);
  });

  // GET /api/messages/:id/receipts — delivery receipts
  app.get('/:id/receipts', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.user.sub;

    const message = await prisma.message.findFirst({
      where: {
        id,
        chat: { members: { some: { userId } } },
      },
      include: {
        receipts: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!message) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Message not found' } });
    }

    const receipts = message.receipts.map((r) => ({
      userId: r.userId,
      name: r.user.name,
      avatarUrl: r.user.avatarUrl,
      deliveredAt: r.deliveredAt,
      readAt: r.readAt,
    }));

    return reply.send(receipts);
  });

  // DELETE /api/messages/:id — delete for me or everyone
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { forEveryone } = (req.body as any) ?? {};
    const userId = req.user.sub;

    const message = await prisma.message.findFirst({
      where: {
        id,
        chat: { members: { some: { userId } } },
      },
    });

    if (!message) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Message not found' } });
    }

    if (forEveryone && message.senderId === userId) {
      await prisma.message.update({
        where: { id },
        data: { isDeleted: true, content: null, mediaUrl: null },
      });
    } else {
      await prisma.message.update({
        where: { id },
        data: { deletedFor: { push: userId } },
      });
    }

    return reply.send({ ok: true });
  });
}
