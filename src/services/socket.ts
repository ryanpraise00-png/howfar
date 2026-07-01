import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useChatStore } from '@/src/store/chatStore';
import { useStatusStore } from '@/src/store/statusStore';
import { SOCKET_URL } from '@/src/config/api';

const API_URL = SOCKET_URL;

// ── Singleton ──────────────────────────────────────────────────────────────────

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

// ── Connect ────────────────────────────────────────────────────────────────────

export async function connectSocket(): Promise<void> {
  if (socket?.connected) return;

  const token = await SecureStore.getItemAsync('AUTH_TOKEN');
  if (!token) return;

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    socket!.emit('user:online');
    startHeartbeat();
  });

  socket.on('disconnect', () => {
    stopHeartbeat();
  });

  // ── Presence ─────────────────────────────────────────────────────────────

  socket.on(
    'presence:update',
    ({ userId, status, lastSeen }: { userId: string; status: 'online' | 'offline'; lastSeen: string | null }) => {
      useChatStore.getState().setPresence(userId, status, lastSeen);
    }
  );

  // ── Typing ────────────────────────────────────────────────────────────────

  socket.on(
    'typing:update',
    ({ chatId, userId, isTyping }: { chatId: string; userId: string; isTyping: boolean }) => {
      useChatStore.getState().setTyping(chatId, userId, isTyping);
    }
  );

  // ── New message ───────────────────────────────────────────────────────────

  socket.on('message:new', (msg: any) => {
    useChatStore.getState().appendMessage({
      id: msg.id,
      localId: msg.localId,
      chatId: msg.chatId,
      senderId: msg.senderId,
      type: msg.type ?? 'TEXT',
      content: msg.content,
      mediaUrl: msg.mediaUrl,
      replyToId: msg.replyToId,
      isDeleted: msg.isDeleted ?? false,
      deletedFor: msg.deletedFor ?? [],
      reactions: [],
      readBy: [],
      createdAt: msg.createdAt,
      sender: msg.sender,
    });
  });

  // ── Read receipts ─────────────────────────────────────────────────────────

  socket.on(
    'message:read_receipt',
    ({ chatId, messageIds, userId }: { chatId: string; messageIds: string[]; userId: string }) => {
      useChatStore.getState().markRead(chatId, messageIds, userId);
    }
  );

  // ── Reactions ─────────────────────────────────────────────────────────────

  socket.on(
    'message:reaction',
    ({ chatId, messageId, userId, emoji }: { chatId: string; messageId: string; userId: string; emoji: string }) => {
      useChatStore.getState().setReaction(chatId, messageId, userId, emoji);
    }
  );

  // ── Delete ────────────────────────────────────────────────────────────────

  socket.on(
    'message:deleted',
    ({ chatId, messageId, forEveryone }: { chatId: string; messageId: string; forEveryone: boolean }) => {
      // selfId not critical here — forEveryone=true from server means wipe for all
      useChatStore.getState().markDeleted(chatId, messageId, forEveryone, '');
    }
  );

  // ── Status ────────────────────────────────────────────────────────────────

  socket.on(
    'status:new',
    (event: { userId: string; userName: string; statusId: string }) => {
      useStatusStore.getState().prependContact(event);
    }
  );
}

// ── Disconnect ─────────────────────────────────────────────────────────────────

export function disconnectSocket(): void {
  stopHeartbeat();
  socket?.disconnect();
  socket = null;
}

// ── Heartbeat ──────────────────────────────────────────────────────────────────

function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    socket?.emit('user:heartbeat');
  }, 30_000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// ── AppState lifecycle ─────────────────────────────────────────────────────────

export function initSocketLifecycle(): void {
  if (appStateSubscription) return; // already attached

  appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      connectSocket();
    } else if (state === 'background' || state === 'inactive') {
      disconnectSocket();
    }
  });
}

// ── Emit helpers ───────────────────────────────────────────────────────────────

export function emitSendMessage(payload: {
  localId: string;
  chatId: string;
  type?: string;
  content?: string;
  replyToId?: string;
}): Promise<{ ok: boolean; message?: any; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ ok: false, error: 'NOT_CONNECTED' });
      return;
    }
    socket.emit('message:send', payload, resolve);
  });
}

export function emitReadMessages(chatId: string, messageIds: string[]): void {
  socket?.emit('message:read', { chatId, messageIds });
}

export function emitTypingStart(chatId: string): void {
  socket?.emit('typing:start', { chatId });
}

export function emitTypingStop(chatId: string): void {
  socket?.emit('typing:stop', { chatId });
}

export function emitDeleteMessage(
  chatId: string,
  messageId: string,
  forEveryone: boolean
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ ok: false, error: 'NOT_CONNECTED' });
      return;
    }
    socket.emit('message:delete', { chatId, messageId, forEveryone }, resolve);
  });
}

export function getSocket(): Socket | null {
  return socket;
}
