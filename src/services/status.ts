import * as SecureStore from 'expo-secure-store';
import { StatusItem, ContactStatus } from '@/src/data/mockStatuses';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function authHeaders() {
  const token = await SecureStore.getItemAsync('AUTH_TOKEN');
  return { Authorization: `Bearer ${token ?? ''}`, 'Content-Type': 'application/json' };
}

// ── API shapes ────────────────────────────────────────────────────────────────

export interface ApiStatusPost {
  id: string;
  type: 'IMAGE' | 'TEXT' | 'VIDEO';
  mediaUrl: string | null;
  content: string | null;
  bgColor: string | null;
  caption: string | null;
  createdAt: string;
  viewCount: number;
  hasViewed: boolean;
}

export interface ApiFeedContact {
  user: { id: string; name: string; avatarUrl: string | null };
  posts: ApiStatusPost[];
}

export interface ApiFeedResponse {
  myStatus: ApiStatusPost[];
  contacts: ApiFeedContact[];
}

export interface ApiViewEntry {
  user: { id: string; name: string; avatarUrl: string | null };
  viewedAt: string;
  reaction: string | null;
}

// ── Converters ────────────────────────────────────────────────────────────────

export function apiPostToStatusItem(p: ApiStatusPost): StatusItem {
  return {
    id: p.id,
    kind: p.type === 'TEXT' ? 'text' : 'image',
    imageUri: p.mediaUrl ?? undefined,
    text: p.content ?? undefined,
    bgColor: p.bgColor ?? undefined,
    caption: p.caption ?? undefined,
    postedAt: new Date(p.createdAt).getTime(),
  };
}

export function apiFeedToContactStatuses(feed: ApiFeedContact[]): ContactStatus[] {
  return feed.map((c) => ({
    contactId: c.user.id,
    name: c.user.name,
    avatarUri: c.user.avatarUrl ?? undefined,
    items: c.posts.map(apiPostToStatusItem),
    viewed: c.posts.length > 0 && c.posts.every((p) => p.hasViewed),
  }));
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchStatusFeed(): Promise<ApiFeedResponse> {
  const res = await fetch(`${BASE}/api/status/feed`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Feed error ${res.status}`);
  return res.json();
}

export async function postStatus(body: {
  type: 'IMAGE' | 'TEXT' | 'VIDEO';
  mediaUrl?: string;
  content?: string;
  bgColor?: string;
  caption?: string;
}): Promise<ApiStatusPost> {
  const res = await fetch(`${BASE}/api/status`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Post status error ${res.status}`);
  return res.json();
}

export async function recordStatusView(statusPostId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/status/${statusPostId}/view`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`View error ${res.status}`);
}

export async function reactToStatus(statusPostId: string, emoji: string): Promise<void> {
  const res = await fetch(`${BASE}/api/status/${statusPostId}/react`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ emoji }),
  });
  if (!res.ok) throw new Error(`React error ${res.status}`);
}

export async function fetchStatusViews(statusPostId: string): Promise<ApiViewEntry[]> {
  const res = await fetch(`${BASE}/api/status/${statusPostId}/views`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Views error ${res.status}`);
  return res.json();
}

export async function deleteStatusPost(statusPostId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/status/${statusPostId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(`Delete error ${res.status}`);
}
