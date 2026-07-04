import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export async function callRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (req, reply) => {
    const userId = req.user.sub;
    const calls = await prisma.call.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      include: {
        initiator: { select: { id: true, name: true, avatarUrl: true } },
        receiver:  { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const userId2 = userId;
    const result = calls.map((c) => {
      const isInitiator = c.initiatorId === userId2;
      const other = isInitiator ? c.receiver : c.initiator;
      return {
        id: c.id,
        kind: c.kind.toLowerCase(),
        direction: c.direction.toLowerCase(),
        contactId: other.id,
        name: other.name,
        avatarUrl: other.avatarUrl,
        duration: c.duration ? formatDuration(c.duration) : null,
        timestamp: formatTimestamp(c.createdAt),
        createdAt: c.createdAt,
      };
    });

    return reply.send(result);
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
