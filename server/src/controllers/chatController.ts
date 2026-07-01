import { prisma } from '../lib/prisma';
import { getIO } from '../sockets/index';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatLastMsg(msg: {
  type: string;
  content: string | null;
  mediaName: string | null;
  isDeleted: boolean;
} | null): string {
  if (!msg) return '';
  if (msg.isDeleted) return 'This message was deleted';
  switch (msg.type) {
    case 'IMAGE':    return msg.content ?? '📷 Photo';
    case 'VIDEO':    return '🎥 Video';
    case 'VOICE':    return '🎤 Voice message';
    case 'DOCUMENT': return `📄 ${msg.mediaName ?? 'Document'}`;
    case 'LOCATION': return '📍 Location';
    default:         return msg.content ?? '';
  }
}

function relativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7)  return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Chat list ──────────────────────────────────────────────────────────────────

export async function getChatList(userId: string, archived: boolean) {
  const memberships = await prisma.chatMember.findMany({
    where: { userId, isArchived: archived },
    orderBy: { chat: { updatedAt: 'desc' } },
    include: {
      chat: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } } },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, type: true, content: true, mediaName: true, senderId: true, createdAt: true, isDeleted: true },
          },
        },
      },
    },
  });

  return memberships.map((m) => {
    const { chat } = m;
    const other = chat.type === 'DIRECT'
      ? chat.members.find((cm) => cm.userId !== userId)?.user
      : null;

    const lastMsg = chat.messages[0] ?? null;

    return {
      id: chat.id,
      type: chat.type,
      name: chat.type === 'DIRECT' ? (other?.name ?? 'Unknown') : (chat.name ?? 'Group'),
      avatarUrl: chat.type === 'DIRECT' ? (other?.avatarUrl ?? null) : (chat.avatarUrl ?? null),
      lastMessage: lastMsg
        ? {
            content: formatLastMsg(lastMsg as any),
            type: lastMsg.type,
            senderId: lastMsg.senderId,
            timestamp: relativeTime(lastMsg.createdAt),
          }
        : null,
      unreadCount: m.unreadCount,
      isMuted: m.isMuted,
      isPinned: m.isPinned,
      isArchived: m.isArchived,
      memberCount: chat.type === 'GROUP' ? chat.members.length : undefined,
    };
  });
}

// ── Messages (paginated) ───────────────────────────────────────────────────────

export async function getChatMessages(
  userId: string,
  chatId: string,
  cursor: string | undefined,
  limit: number,
) {
  // Verify membership
  const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId } } });
  if (!member) throw Object.assign(new Error('Not a member of this chat'), { statusCode: 403 });

  const messages = await prisma.message.findMany({
    where: {
      chatId,
      NOT: { deletedFor: { has: userId } },
    },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      replyTo: { select: { id: true, content: true, type: true, senderId: true } },
      receipts: { where: { userId } },
      reactions: { select: { emoji: true, userId: true } },
    },
  });

  // Batch-update undelivered receipts
  const undeliveredIds = messages
    .filter((m) => m.senderId !== userId && m.receipts.every((r) => !r.deliveredAt))
    .map((m) => m.id);

  if (undeliveredIds.length > 0) {
    await prisma.messageReceipt.updateMany({
      where: { messageId: { in: undeliveredIds }, userId, deliveredAt: null },
      data: { deliveredAt: new Date() },
    });
    getIO()?.to(`chat:${chatId}`).emit('message:delivered', { chatId, messageIds: undeliveredIds, userId });
  }

  // Aggregate reactions
  return messages.map((m) => {
    const reactionMap = new Map<string, { emoji: string; count: number; userIds: string[] }>();
    for (const r of m.reactions) {
      const entry = reactionMap.get(r.emoji) ?? { emoji: r.emoji, count: 0, userIds: [] };
      entry.count++;
      entry.userIds.push(r.userId);
      reactionMap.set(r.emoji, entry);
    }
    const myReceipt = m.receipts[0] ?? null;

    return {
      id: m.id,
      type: m.type,
      content: m.content,
      mediaUrl: m.mediaUrl,
      mediaName: m.mediaName,
      mediaSize: m.mediaSize,
      duration: m.duration,
      senderId: m.senderId,
      sender: m.sender,
      replyTo: m.replyTo,
      isForwarded: m.isForwarded,
      isDeleted: m.isDeleted,
      reactions: Array.from(reactionMap.values()),
      myReceipt: myReceipt
        ? { deliveredAt: myReceipt.deliveredAt, readAt: myReceipt.readAt }
        : null,
      createdAt: m.createdAt,
    };
  });
}

// ── Create / get direct chat ───────────────────────────────────────────────────

export async function getOrCreateDirectChat(userId: string, contactUserId: string) {
  // Find existing DIRECT chat between both users
  const existing = await prisma.chat.findFirst({
    where: {
      type: 'DIRECT',
      members: { every: { userId: { in: [userId, contactUserId] } } },
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: contactUserId } } },
      ],
    },
    include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
  });

  if (existing) return { chat: existing, created: false };

  const chat = await prisma.chat.create({
    data: {
      type: 'DIRECT',
      members: {
        create: [
          { userId, role: 'MEMBER' },
          { userId: contactUserId, role: 'MEMBER' },
        ],
      },
    },
    include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
  });

  // Auto-join socket rooms
  const io = getIO();
  if (io) {
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    const otherSockets = await io.in(`user:${contactUserId}`).fetchSockets();
    for (const s of [...sockets, ...otherSockets]) s.join(`chat:${chat.id}`);
  }

  return { chat, created: true };
}

// ── Create group chat ──────────────────────────────────────────────────────────

export async function createGroupChat(
  userId: string,
  name: string,
  description: string | undefined,
  memberIds: string[],
) {
  const allMemberIds = Array.from(new Set([userId, ...memberIds]));

  const chat = await prisma.chat.create({
    data: {
      type: 'GROUP',
      name,
      description,
      members: {
        create: allMemberIds.map((uid) => ({
          userId: uid,
          role: uid === userId ? 'ADMIN' : 'MEMBER',
        })),
      },
      messages: {
        create: {
          senderId: userId,
          type: 'SYSTEM',
          content: `Group created · ${allMemberIds.length} participants`,
        },
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      messages: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  });

  // Auto-join all online members
  const io = getIO();
  if (io) {
    for (const uid of allMemberIds) {
      const sockets = await io.in(`user:${uid}`).fetchSockets();
      for (const s of sockets) s.join(`chat:${chat.id}`);
    }
    io.to(`chat:${chat.id}`).emit('chat:new', { chatId: chat.id, name, type: 'GROUP' });
  }

  return chat;
}

// ── Members ────────────────────────────────────────────────────────────────────

export async function getChatMembers(userId: string, chatId: string) {
  const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId } } });
  if (!member) throw Object.assign(new Error('Not a member'), { statusCode: 403 });

  const members = await prisma.chatMember.findMany({
    where: { chatId },
    include: { user: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } } },
    orderBy: { joinedAt: 'asc' },
  });

  return members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
    joinedAt: m.joinedAt,
    isOnline: m.user.isOnline,
    lastSeen: m.user.lastSeen,
  }));
}

// ── Update group info ──────────────────────────────────────────────────────────

export async function updateGroupChat(
  userId: string,
  chatId: string,
  data: { name?: string; description?: string; avatarUrl?: string },
) {
  const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId } } });
  if (!member || member.role !== 'ADMIN') throw Object.assign(new Error('Admin only'), { statusCode: 403 });

  const chat = await prisma.chat.update({ where: { id: chatId }, data });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const changes: string[] = [];
  if (data.name) changes.push(`${user?.name} changed the group name to "${data.name}"`);
  if (data.description) changes.push(`${user?.name} changed the group description`);
  if (data.avatarUrl) changes.push(`${user?.name} changed the group icon`);

  for (const content of changes) {
    await prisma.message.create({ data: { chatId, senderId: userId, type: 'SYSTEM', content } });
  }

  getIO()?.to(`chat:${chatId}`).emit('chat:updated', { chatId, ...data });
  return chat;
}

// ── Add members ────────────────────────────────────────────────────────────────

export async function addChatMembers(userId: string, chatId: string, userIds: string[]) {
  const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId } } });
  if (!member || member.role !== 'ADMIN') throw Object.assign(new Error('Admin only'), { statusCode: 403 });

  const actor = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  for (const uid of userIds) {
    await prisma.chatMember.upsert({
      where: { chatId_userId: { chatId, userId: uid } },
      create: { chatId, userId: uid, role: 'MEMBER' },
      update: {},
    });
    const added = await prisma.user.findUnique({ where: { id: uid }, select: { name: true } });
    await prisma.message.create({
      data: { chatId, senderId: userId, type: 'SYSTEM', content: `${actor?.name} added ${added?.name}` },
    });

    const io = getIO();
    if (io) {
      const sockets = await io.in(`user:${uid}`).fetchSockets();
      for (const s of sockets) s.join(`chat:${chatId}`);
    }
  }

  getIO()?.to(`chat:${chatId}`).emit('chat:members_added', { chatId, userIds });
}

// ── Remove / leave ─────────────────────────────────────────────────────────────

export async function removeChatMember(actorId: string, chatId: string, targetUserId: string) {
  const actor = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId: actorId } } });
  const isSelf = actorId === targetUserId;
  if (!actor) throw Object.assign(new Error('Not a member'), { statusCode: 403 });
  if (!isSelf && actor.role !== 'ADMIN') throw Object.assign(new Error('Admin only'), { statusCode: 403 });

  await prisma.chatMember.delete({ where: { chatId_userId: { chatId, userId: targetUserId } } });

  const actorUser = await prisma.user.findUnique({ where: { id: actorId }, select: { name: true } });
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { name: true } });
  const content = isSelf
    ? `${actorUser?.name} left`
    : `${targetUser?.name} was removed by ${actorUser?.name}`;

  await prisma.message.create({ data: { chatId, senderId: actorId, type: 'SYSTEM', content } });

  // If last admin left, promote oldest remaining member
  if (actor.role === 'ADMIN') {
    const admins = await prisma.chatMember.findMany({ where: { chatId, role: 'ADMIN' } });
    if (admins.length === 0) {
      const oldest = await prisma.chatMember.findFirst({ where: { chatId }, orderBy: { joinedAt: 'asc' } });
      if (oldest) await prisma.chatMember.update({ where: { id: oldest.id }, data: { role: 'ADMIN' } });
    }
  }

  getIO()?.to(`chat:${chatId}`).emit('chat:member_removed', { chatId, userId: targetUserId, isSelf });
}

// ── Per-member settings ────────────────────────────────────────────────────────

export async function updateChatMemberSettings(
  userId: string,
  chatId: string,
  settings: { isMuted?: boolean; isPinned?: boolean; isArchived?: boolean; disappearingMsgTtl?: number | null },
) {
  const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId } } });
  if (!member) throw Object.assign(new Error('Not a member'), { statusCode: 403 });
  return prisma.chatMember.update({ where: { chatId_userId: { chatId, userId } }, data: settings });
}

// ── Soft-delete (archive for self) ────────────────────────────────────────────

export async function softDeleteChat(userId: string, chatId: string) {
  const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId } } });
  if (!member) throw Object.assign(new Error('Not a member'), { statusCode: 403 });
  return prisma.chatMember.update({ where: { chatId_userId: { chatId, userId } }, data: { isArchived: true } });
}

// ── User search ────────────────────────────────────────────────────────────────

export async function searchUsers(userId: string, q: string) {
  const isPhone = q.startsWith('+');
  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      ...(isPhone
        ? { phone: q }
        : { name: { contains: q, mode: 'insensitive' } }),
    },
    select: { id: true, name: true, avatarUrl: true, about: true, isOnline: true, lastSeen: true },
    take: 20,
  });
  return users;
}
