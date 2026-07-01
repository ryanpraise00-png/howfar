import { prisma } from '../lib/prisma';
import { getIO } from '../sockets/index';

// ── Feed ───────────────────────────────────────────────────────────────────────

export async function getStatusFeed(userId: string) {
  const now = new Date();

  // Contact user IDs (people this user has added)
  const contacts = await prisma.contact.findMany({
    where: { ownerId: userId },
    select: { contactId: true },
  });
  const contactIds = contacts.map((c) => c.contactId);

  // All non-expired posts from contacts, oldest first so viewer plays in order
  const posts = await prisma.statusPost.findMany({
    where: {
      userId: { in: contactIds },
      expiresAt: { gt: now },
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      views: {
        where: { viewerId: userId },
        select: { viewerId: true, reaction: true },
      },
      _count: { select: { views: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by userId
  const grouped = new Map<string, {
    user: { id: string; name: string; avatarUrl: string | null };
    posts: ReturnType<typeof shapePost>[];
  }>();

  for (const p of posts) {
    if (!grouped.has(p.userId)) {
      grouped.set(p.userId, { user: p.user, posts: [] });
    }
    grouped.get(p.userId)!.posts.push(shapePost(p, userId));
  }

  // My own statuses
  const myPosts = await prisma.statusPost.findMany({
    where: { userId, expiresAt: { gt: now } },
    include: {
      _count: { select: { views: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return {
    myStatus: myPosts.map((p) => ({
      id: p.id,
      type: p.type,
      mediaUrl: p.mediaUrl,
      content: p.content,
      bgColor: p.bgColor,
      caption: p.caption,
      createdAt: p.createdAt,
      viewCount: p._count.views,
      hasViewed: true,
    })),
    contacts: Array.from(grouped.values()),
  };
}

function shapePost(
  p: any,
  viewerId: string,
) {
  return {
    id: p.id,
    type: p.type as string,
    mediaUrl: p.mediaUrl as string | null,
    content: p.content as string | null,
    bgColor: p.bgColor as string | null,
    caption: p.caption as string | null,
    createdAt: p.createdAt as Date,
    viewCount: p._count.views as number,
    hasViewed: (p.views as any[]).some((v: any) => v.viewerId === viewerId),
  };
}

// ── Create ─────────────────────────────────────────────────────────────────────

export async function createStatus(
  userId: string,
  body: {
    type: 'IMAGE' | 'TEXT' | 'VIDEO';
    mediaUrl?: string;
    content?: string;
    bgColor?: string;
    caption?: string;
  },
) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const post = await prisma.statusPost.create({
    data: {
      userId,
      type: body.type,
      mediaUrl: body.mediaUrl,
      content: body.content,
      bgColor: body.bgColor,
      caption: body.caption,
      expiresAt,
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  // Notify contacts who have this user in their contact list
  const followers = await prisma.contact.findMany({
    where: { contactId: userId },
    select: { ownerId: true },
  });

  const io = getIO();
  if (io) {
    const event = { userId, userName: post.user.name, statusId: post.id };
    for (const { ownerId } of followers) {
      io.to(`user:${ownerId}`).emit('status:new', event);
    }
  }

  return post;
}

// ── Shared: verify viewer is a contact of the poster ──────────────────────────

async function assertViewerIsContact(statusPostId: string, viewerId: string) {
  const post = await prisma.statusPost.findUnique({
    where: { id: statusPostId },
    select: { userId: true },
  });
  if (!post) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  // Allow owner to "view" their own status (for view counts)
  if (post.userId === viewerId) return post;

  const contact = await prisma.contact.findFirst({
    where: { ownerId: viewerId, contactId: post.userId },
  });
  if (!contact) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  return post;
}

// ── View ───────────────────────────────────────────────────────────────────────

export async function recordView(statusPostId: string, viewerId: string) {
  await assertViewerIsContact(statusPostId, viewerId);

  await prisma.statusView.upsert({
    where: { statusPostId_viewerId: { statusPostId, viewerId } },
    create: { statusPostId, viewerId },
    update: {},
  });

  const count = await prisma.statusView.count({ where: { statusPostId } });
  return { viewCount: count };
}

// ── React ──────────────────────────────────────────────────────────────────────

export async function reactToStatus(statusPostId: string, viewerId: string, emoji: string) {
  await assertViewerIsContact(statusPostId, viewerId);

  const updated = await prisma.statusView.upsert({
    where: { statusPostId_viewerId: { statusPostId, viewerId } },
    create: { statusPostId, viewerId, reaction: emoji },
    update: { reaction: emoji },
    include: { statusPost: { select: { userId: true } } },
  });

  // Notify the status owner
  getIO()?.to(`user:${updated.statusPost.userId}`).emit('status:reaction', {
    statusPostId,
    viewerId,
    emoji,
  });

  return { ok: true };
}

// ── Views list (owner only) ────────────────────────────────────────────────────

export async function getStatusViews(statusPostId: string, requesterId: string) {
  const post = await prisma.statusPost.findUnique({
    where: { id: statusPostId },
    select: { userId: true },
  });
  if (!post) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  if (post.userId !== requesterId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

  const views = await prisma.statusView.findMany({
    where: { statusPostId },
    include: { viewer: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { viewedAt: 'desc' },
  });

  return views.map((v) => ({
    user: v.viewer,
    viewedAt: v.viewedAt,
    reaction: v.reaction,
  }));
}

// ── Delete ─────────────────────────────────────────────────────────────────────

export async function deleteStatus(statusPostId: string, requesterId: string) {
  const post = await prisma.statusPost.findUnique({
    where: { id: statusPostId },
    select: { userId: true },
  });
  if (!post) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  if (post.userId !== requesterId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

  await prisma.statusPost.delete({ where: { id: statusPostId } });
}
