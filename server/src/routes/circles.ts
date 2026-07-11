import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const CreateCircleSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
  privacy: z.enum(['public', 'private']).default('public'),
  interests: z.array(z.string()).default([]),
});

export async function circleRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // POST /api/circles — create a new circle
  app.post('/', async (req, reply) => {
    const userId = req.user.sub;
    const body = CreateCircleSchema.parse(req.body);

    // Circles stored as group chats with type CIRCLE (or as a chat group for now)
    const chat = await prisma.chat.create({
      data: {
        type: 'GROUP',
        name: body.name,
        description: body.description,
        avatarUrl: body.avatarUrl,
        members: { create: { userId, role: 'ADMIN' } },
      },
      select: { id: true, name: true, avatarUrl: true, createdAt: true },
    });

    return reply.status(201).send(chat);
  });

  // GET /api/circles — list circles the user has joined
  app.get('/', async (req, reply) => {
    const userId = req.user.sub;

    const chats = await prisma.chat.findMany({
      where: {
        type: 'GROUP',
        members: { some: { userId } },
      },
      select: {
        id: true, name: true, avatarUrl: true, description: true, createdAt: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(chats);
  });

  // GET /api/circles/discover — public circles not yet joined
  app.get('/discover', async (req, reply) => {
    const userId = req.user.sub;

    const chats = await prisma.chat.findMany({
      where: {
        type: 'GROUP',
        members: { none: { userId } },
      },
      select: {
        id: true, name: true, avatarUrl: true, description: true,
        _count: { select: { members: true } },
      },
      take: 20,
    });

    return reply.send(chats);
  });

  // POST /api/circles/:id/join — join a circle
  app.post('/:id/join', async (req, reply) => {
    const userId = req.user.sub;
    const { id } = req.params as { id: string };

    const circle = await prisma.chat.findFirst({
      where: { id, type: 'GROUP' },
    });

    if (!circle) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Circle not found' } });
    }

    await prisma.chatMember.upsert({
      where: { chatId_userId: { chatId: id, userId } },
      create: { chatId: id, userId, role: 'MEMBER' },
      update: {},
    });

    return reply.send({ ok: true });
  });
}
