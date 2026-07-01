import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type { FastifyInstance } from 'fastify';
import { registerPresenceHandlers } from './presence';
import { registerMessagingHandlers } from './messaging';
import { prisma } from '../lib/prisma';

let _io: SocketServer | null = null;

export function getIO(): SocketServer | null {
  return _io;
}

export function createSocketServer(app: FastifyInstance, httpServer: HttpServer): SocketServer {
  _io = new SocketServer(httpServer, {
    cors: { origin: '*', credentials: true },
    transports: ['websocket', 'polling'],
  });

  const io = _io;

  // JWT auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('UNAUTHORIZED'));

      const payload = app.jwt.verify<{ sub: string; phone: string }>(token);
      socket.data.userId = payload.sub;
      socket.data.phone = payload.phone;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string;
    app.log.info({ userId, socketId: socket.id }, 'Socket connected');

    // Auto-join all chat rooms the user belongs to
    try {
      const memberships = await prisma.chatMember.findMany({
        where: { userId },
        select: { chatId: true },
      });
      for (const { chatId } of memberships) {
        socket.join(`chat:${chatId}`);
      }
    } catch (err) {
      app.log.error(err, 'Failed to auto-join chat rooms');
    }

    socket.join(`user:${userId}`);

    registerPresenceHandlers(io, socket, app);
    registerMessagingHandlers(io, socket, app);

    socket.on('disconnect', () => {
      app.log.info({ userId, socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
}
