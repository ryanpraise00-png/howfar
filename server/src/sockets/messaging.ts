import type { Server as SocketServer, Socket } from 'socket.io';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export function registerMessagingHandlers(
  io: SocketServer,
  socket: Socket,
  app: FastifyInstance
) {
  const userId = socket.data.userId as string;

  // ── Chat room management ───────────────────────────────────────────────────

  socket.on('chat:join', ({ chatId }: { chatId: string }) => {
    socket.join(`chat:${chatId}`);
  });

  socket.on('chat:leave', ({ chatId }: { chatId: string }) => {
    socket.leave(`chat:${chatId}`);
  });

  // ── Send message ───────────────────────────────────────────────────────────

  socket.on(
    'message:send',
    async (
      payload: {
        localId: string;
        chatId: string;
        type?: string;
        content?: string;
        replyToId?: string;
      },
      ack: (res: { ok: boolean; message?: object; error?: string }) => void
    ) => {
      try {
        const message = await prisma.message.create({
          data: {
            chatId: payload.chatId,
            senderId: userId,
            type: (payload.type ?? 'TEXT') as any,
            content: payload.content,
            replyToId: payload.replyToId,
          },
          include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        });

        const event = { ...message, localId: payload.localId };
        io.to(`chat:${payload.chatId}`).emit('message:new', event);
        ack({ ok: true, message: event });
      } catch (err: any) {
        app.log.error(err, 'message:send failed');
        ack({ ok: false, error: err.message });
      }
    }
  );

  // ── Read receipts ──────────────────────────────────────────────────────────

  socket.on(
    'message:read',
    async ({ messageIds, chatId }: { messageIds: string[]; chatId: string }) => {
      try {
        await prisma.messageReceipt.createMany({
          data: messageIds.map((messageId) => ({ messageId, userId, status: 'READ' as any })),
          skipDuplicates: true,
        });
        io.to(`chat:${chatId}`).emit('message:read_receipt', { messageIds, userId, chatId });
      } catch (err) {
        app.log.error(err, 'message:read failed');
      }
    }
  );

  // ── Reactions ──────────────────────────────────────────────────────────────

  socket.on(
    'message:react',
    async ({ messageId, emoji, chatId }: { messageId: string; emoji: string; chatId: string }) => {
      try {
        await prisma.messageReaction.upsert({
          where: { messageId_userId: { messageId, userId } },
          create: { messageId, userId, emoji },
          update: { emoji },
        });
        io.to(`chat:${chatId}`).emit('message:reaction', { messageId, userId, emoji, chatId });
      } catch (err) {
        app.log.error(err, 'message:react failed');
      }
    }
  );

  // ── Delete message ─────────────────────────────────────────────────────────

  socket.on(
    'message:delete',
    async (
      { messageId, chatId, forEveryone }: { messageId: string; chatId: string; forEveryone: boolean },
      ack: (res: { ok: boolean; error?: string }) => void
    ) => {
      try {
        const msg = await prisma.message.findUnique({ where: { id: messageId } });
        if (!msg) return ack({ ok: false, error: 'NOT_FOUND' });

        if (forEveryone && msg.senderId !== userId) {
          return ack({ ok: false, error: 'FORBIDDEN' });
        }

        // "Delete for everyone" is only allowed within 1 hour of sending
        if (forEveryone) {
          const ageMs = Date.now() - new Date(msg.createdAt).getTime();
          if (ageMs > 60 * 60 * 1000) {
            return ack({ ok: false, error: 'DELETE_WINDOW_EXPIRED' });
          }
        }

        if (forEveryone) {
          await prisma.message.update({ where: { id: messageId }, data: { isDeleted: true } });
          io.to(`chat:${chatId}`).emit('message:deleted', { messageId, chatId, forEveryone: true });
        } else {
          await prisma.message.update({
            where: { id: messageId },
            data: { deletedFor: { push: userId } },
          });
        }
        ack({ ok: true });
      } catch (err: any) {
        app.log.error(err, 'message:delete failed');
        ack({ ok: false, error: err.message });
      }
    }
  );
}
