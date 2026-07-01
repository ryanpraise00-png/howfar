import { create } from 'zustand';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Message {
  id: string;
  localId?: string;
  chatId: string;
  senderId: string;
  type: string;
  content?: string | null;
  mediaUrl?: string | null;
  replyToId?: string | null;
  isDeleted: boolean;
  deletedFor: string[];
  reactions: MessageReaction[];
  readBy: string[];        // userIds who have sent a read receipt
  createdAt: string;
  sender?: { id: string; name: string; avatarUrl?: string | null };
}

export type PresenceStatus = 'online' | 'offline';

export interface PresenceEntry {
  status: PresenceStatus;
  lastSeen: string | null;
}

interface ChatState {
  // messages keyed by chatId
  messagesByChatId: Record<string, Message[]>;
  // online presence keyed by userId
  presenceMap: Record<string, PresenceEntry>;
  // typing keyed by chatId → Set of userIds currently typing
  typingMap: Record<string, Set<string>>;
}

interface ChatActions {
  appendMessage: (msg: Message) => void;
  prependMessages: (chatId: string, msgs: Message[]) => void;
  markRead: (chatId: string, messageIds: string[], userId: string) => void;
  setReaction: (chatId: string, messageId: string, userId: string, emoji: string) => void;
  markDeleted: (chatId: string, messageId: string, forEveryone: boolean, selfId: string) => void;
  setPresence: (userId: string, status: PresenceStatus, lastSeen: string | null) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  clearChat: (chatId: string) => void;
}

type ChatStoreState = ChatState & ChatActions;

// ── Store ──────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatStoreState>()((set) => ({
  messagesByChatId: {},
  presenceMap: {},
  typingMap: {},

  appendMessage: (msg) =>
    set((s) => {
      const existing = s.messagesByChatId[msg.chatId] ?? [];
      // Deduplicate by id or localId
      const deduped = existing.filter(
        (m) => m.id !== msg.id && (!msg.localId || m.localId !== msg.localId)
      );
      return {
        messagesByChatId: {
          ...s.messagesByChatId,
          [msg.chatId]: [...deduped, msg],
        },
      };
    }),

  prependMessages: (chatId, msgs) =>
    set((s) => {
      const existing = s.messagesByChatId[chatId] ?? [];
      const existingIds = new Set(existing.map((m) => m.id));
      const newMsgs = msgs.filter((m) => !existingIds.has(m.id));
      return {
        messagesByChatId: {
          ...s.messagesByChatId,
          [chatId]: [...newMsgs, ...existing],
        },
      };
    }),

  markRead: (chatId, messageIds, userId) =>
    set((s) => {
      const msgs = s.messagesByChatId[chatId];
      if (!msgs) return s;
      const idSet = new Set(messageIds);
      return {
        messagesByChatId: {
          ...s.messagesByChatId,
          [chatId]: msgs.map((m) =>
            idSet.has(m.id) && !m.readBy.includes(userId)
              ? { ...m, readBy: [...m.readBy, userId] }
              : m
          ),
        },
      };
    }),

  setReaction: (chatId, messageId, userId, emoji) =>
    set((s) => {
      const msgs = s.messagesByChatId[chatId];
      if (!msgs) return s;
      return {
        messagesByChatId: {
          ...s.messagesByChatId,
          [chatId]: msgs.map((m) => {
            if (m.id !== messageId) return m;
            const others = m.reactions.filter((r) => r.userId !== userId);
            return { ...m, reactions: [...others, { userId, emoji }] };
          }),
        },
      };
    }),

  markDeleted: (chatId, messageId, forEveryone, selfId) =>
    set((s) => {
      const msgs = s.messagesByChatId[chatId];
      if (!msgs) return s;
      return {
        messagesByChatId: {
          ...s.messagesByChatId,
          [chatId]: msgs.map((m) => {
            if (m.id !== messageId) return m;
            if (forEveryone) return { ...m, isDeleted: true };
            return { ...m, deletedFor: [...m.deletedFor, selfId] };
          }),
        },
      };
    }),

  setPresence: (userId, status, lastSeen) =>
    set((s) => ({
      presenceMap: { ...s.presenceMap, [userId]: { status, lastSeen } },
    })),

  setTyping: (chatId, userId, isTyping) =>
    set((s) => {
      const current = new Set(s.typingMap[chatId] ?? []);
      if (isTyping) current.add(userId);
      else current.delete(userId);
      return { typingMap: { ...s.typingMap, [chatId]: current } };
    }),

  clearChat: (chatId) =>
    set((s) => {
      const next = { ...s.messagesByChatId };
      delete next[chatId];
      return { messagesByChatId: next };
    }),
}));
