import { api } from './api';
import type { ChatItem } from '@/src/data/mockChats';
import type { Message } from '@/src/store/chatStore';

// ── API response types ─────────────────────────────────────────────────────────

export interface ApiChatItem {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string;
  avatarUrl: string | null;
  lastMessage: {
    content: string;
    type: string;
    senderId: string;
    timestamp: string;
  } | null;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
  memberCount?: number;
}

export interface ApiMessage {
  id: string;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  mediaName: string | null;
  mediaSize: number | null;
  duration: number | null;
  senderId: string;
  sender: { id: string; name: string; avatarUrl: string | null };
  replyTo: { id: string; content: string | null; type: string; senderId: string } | null;
  isForwarded: boolean;
  isDeleted: boolean;
  reactions: { emoji: string; count: number; userIds: string[] }[];
  myReceipt: { deliveredAt: string | null; readAt: string | null } | null;
  createdAt: string;
}

export interface ApiUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  about: string;
  isOnline: boolean;
  lastSeen: string;
}

// ── Converters ─────────────────────────────────────────────────────────────────

export function apiChatToItem(c: ApiChatItem): ChatItem {
  return {
    id: c.id,
    name: c.name,
    avatarUri: c.avatarUrl ?? undefined,
    lastMessage: c.lastMessage?.content ?? '',
    timestamp: c.lastMessage?.timestamp ?? '',
    unreadCount: c.unreadCount,
    isPinned: c.isPinned,
    isMuted: c.isMuted,
    isGroup: c.type === 'GROUP',
    isFavorite: false,
    isArchived: c.isArchived,
  };
}

export function apiMessageToStore(m: ApiMessage, chatId: string): Message {
  return {
    id: m.id,
    chatId,
    senderId: m.senderId,
    type: m.type,
    content: m.content,
    mediaUrl: m.mediaUrl,
    replyToId: m.replyTo?.id ?? null,
    isDeleted: m.isDeleted,
    deletedFor: [],
    reactions: m.reactions.flatMap((r) => r.userIds.map((uid) => ({ userId: uid, emoji: r.emoji }))),
    readBy: m.myReceipt?.readAt ? [m.senderId] : [],
    createdAt: m.createdAt,
    sender: m.sender,
  };
}

// ── API calls ──────────────────────────────────────────────────────────────────

export async function fetchChats(archived = false): Promise<ApiChatItem[]> {
  return api.get<ApiChatItem[]>(`/api/chats?archived=${archived}`);
}

export async function fetchMessages(chatId: string, cursor?: string, limit = 30): Promise<ApiMessage[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return api.get<ApiMessage[]>(`/api/chats/${chatId}/messages?${params}`);
}

export async function createDirectChat(contactUserId: string): Promise<{ chat: { id: string }; created: boolean }> {
  return api.post('/api/chats/direct', { contactUserId });
}

export async function createGroupChat(
  name: string,
  description: string | undefined,
  memberIds: string[],
): Promise<{ id: string; name: string }> {
  return api.post('/api/chats/group', { name, description, memberIds });
}

export async function updateChatSettings(
  chatId: string,
  settings: { isMuted?: boolean; isPinned?: boolean; isArchived?: boolean },
) {
  return api.patch(`/api/chats/${chatId}/settings`, settings);
}

export async function deleteChat(chatId: string) {
  return api.delete(`/api/chats/${chatId}`);
}

export async function searchUsers(q: string): Promise<ApiUser[]> {
  return api.get<ApiUser[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
}
