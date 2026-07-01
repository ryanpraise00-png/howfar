import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/chatController';

function parse<T>(schema: z.ZodType<T>, data: unknown, reply: any): T | null {
  const r = schema.safeParse(data);
  if (!r.success) {
    reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: r.error.issues[0]?.message ?? 'Validation error' } });
    return null;
  }
  return r.data;
}

// ── Body schemas (strict — reject unknown fields) ─────────────────────────────

const directBody   = z.object({ contactUserId: z.string().cuid() }).strict();
const groupBody    = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string().cuid()).min(1).max(256),
}).strict();
const updateBody   = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
}).strict();
const addMembers   = z.object({ userIds: z.array(z.string().cuid()).min(1).max(256) }).strict();
const settingsBody = z.object({
  isMuted: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  disappearingMsgTtl: z.number().int().min(0).nullable().optional(),
}).strict();

// ── Query schemas ─────────────────────────────────────────────────────────────

const chatListQuery  = z.object({ archived: z.enum(['true', 'false']).optional() });
const messagesQuery  = z.object({
  cursor: z.string().optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export async function chatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /chats
  app.get('/', async (req, reply) => {
    const q = parse(chatListQuery, req.query, reply);
    if (!q) return;
    try {
      return reply.send(await ctrl.getChatList(req.user.sub, q.archived === 'true'));
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'CHATS_ERROR', message: err.message } });
    }
  });

  // GET /chats/:chatId/messages
  app.get('/:chatId/messages', async (req, reply) => {
    const { chatId } = req.params as { chatId: string };
    const q = parse(messagesQuery, req.query, reply);
    if (!q) return;
    const limit = Math.min(Number(q.limit ?? 30), 100);
    try {
      return reply.send(await ctrl.getChatMessages(req.user.sub, chatId, q.cursor, limit));
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'MESSAGES_ERROR', message: err.message } });
    }
  });

  // POST /chats/direct
  app.post('/direct', async (req, reply) => {
    const body = parse(directBody, req.body, reply);
    if (!body) return;
    try {
      const result = await ctrl.getOrCreateDirectChat(req.user.sub, body.contactUserId);
      return reply.status(result.created ? 201 : 200).send(result);
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'DIRECT_CHAT_ERROR', message: err.message } });
    }
  });

  // POST /chats/group
  app.post('/group', async (req, reply) => {
    const body = parse(groupBody, req.body, reply);
    if (!body) return;
    try {
      const chat = await ctrl.createGroupChat(req.user.sub, body.name, body.description, body.memberIds);
      return reply.status(201).send(chat);
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'GROUP_CHAT_ERROR', message: err.message } });
    }
  });

  // GET /chats/:chatId/members
  app.get('/:chatId/members', async (req, reply) => {
    const { chatId } = req.params as { chatId: string };
    try {
      return reply.send(await ctrl.getChatMembers(req.user.sub, chatId));
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'MEMBERS_ERROR', message: err.message } });
    }
  });

  // PATCH /chats/:chatId (group info — admin only, enforced in controller)
  app.patch('/:chatId', async (req, reply) => {
    const { chatId } = req.params as { chatId: string };
    const body = parse(updateBody, req.body, reply);
    if (!body) return;
    try {
      return reply.send(await ctrl.updateGroupChat(req.user.sub, chatId, body));
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'UPDATE_CHAT_ERROR', message: err.message } });
    }
  });

  // POST /chats/:chatId/members (admin only)
  app.post('/:chatId/members', async (req, reply) => {
    const { chatId } = req.params as { chatId: string };
    const body = parse(addMembers, req.body, reply);
    if (!body) return;
    try {
      await ctrl.addChatMembers(req.user.sub, chatId, body.userIds);
      return reply.status(204).send();
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'ADD_MEMBERS_ERROR', message: err.message } });
    }
  });

  // DELETE /chats/:chatId/members/:userId (admin or self-leave, enforced in controller)
  app.delete('/:chatId/members/:userId', async (req, reply) => {
    const { chatId, userId } = req.params as { chatId: string; userId: string };
    try {
      await ctrl.removeChatMember(req.user.sub, chatId, userId);
      return reply.status(204).send();
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'REMOVE_MEMBER_ERROR', message: err.message } });
    }
  });

  // PATCH /chats/:chatId/settings (membership check in controller)
  app.patch('/:chatId/settings', async (req, reply) => {
    const { chatId } = req.params as { chatId: string };
    const body = parse(settingsBody, req.body, reply);
    if (!body) return;
    try {
      return reply.send(await ctrl.updateChatMemberSettings(req.user.sub, chatId, body));
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'SETTINGS_ERROR', message: err.message } });
    }
  });

  // DELETE /chats/:chatId (soft delete / archive for self)
  app.delete('/:chatId', async (req, reply) => {
    const { chatId } = req.params as { chatId: string };
    try {
      await ctrl.softDeleteChat(req.user.sub, chatId);
      return reply.status(204).send();
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'DELETE_CHAT_ERROR', message: err.message } });
    }
  });
}
