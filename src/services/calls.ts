import { api } from './api';

export interface ApiCallRecord {
  id: string;
  kind: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  contactId: string;
  name: string;
  avatarUrl: string | null;
  duration: string | null;
  timestamp: string;
  createdAt: string;
}

export async function fetchCalls(): Promise<ApiCallRecord[]> {
  return api.get<ApiCallRecord[]>('/api/calls');
}
