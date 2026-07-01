import type { Server as SocketServer, Socket } from 'socket.io';
import type { FastifyInstance } from 'fastify';
import { redis } from '../lib/redis';

const ONLINE_TTL = 65; // seconds — heartbeat expected every 30s

const onlineKey = (userId: string) => `online:${userId}`;

export function registerPresenceHandlers(
  io: SocketServer,
  socket: Socket,
  app: FastifyInstance
) {
  const userId = socket.data.userId as string;

  async function setOnline() {
    await redis.set(onlineKey(userId), '1', 'EX', ONLINE_TTL);
    socket.broadcast.emit('presence:update', { userId, status: 'online', lastSeen: null });
  }

  async function setOffline() {
    await redis.del(onlineKey(userId));
    const lastSeen = new Date().toISOString();
    io.emit('presence:update', { userId, status: 'offline', lastSeen });
  }

  // Mark online immediately on connect
  setOnline().catch((err) => app.log.error(err, 'setOnline failed'));

  // Heartbeat — client sends every 30s to keep the TTL fresh
  socket.on('user:heartbeat', async () => {
    await redis.expire(onlineKey(userId), ONLINE_TTL);
  });

  // Typing indicators
  socket.on('typing:start', ({ chatId }: { chatId: string }) => {
    socket.to(`chat:${chatId}`).emit('typing:update', { chatId, userId, isTyping: true });
  });

  socket.on('typing:stop', ({ chatId }: { chatId: string }) => {
    socket.to(`chat:${chatId}`).emit('typing:update', { chatId, userId, isTyping: false });
  });

  // Offline on disconnect
  socket.on('disconnect', () => {
    setOffline().catch((err) => app.log.error(err, 'setOffline failed'));
  });
}
