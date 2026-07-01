export type CallDirection = 'incoming' | 'outgoing' | 'missed';
export type CallKind = 'voice' | 'video';

export interface CallRecord {
  id: string;
  contactId: string;
  name: string;
  direction: CallDirection;
  kind: CallKind;
  /** Human-readable timestamp shown in list ("Today, 9:41 AM") */
  timestamp: string;
  /** Raw epoch ms for sorting */
  at: number;
  /** Duration string shown in detail screen, e.g. "4 min 12 sec". Null for missed. */
  duration: string | null;
}

const NOW = Date.now();
const H = 3_600_000;
const D = 86_400_000;

export const mockCalls: CallRecord[] = [
  {
    id: 'call1',
    contactId: 'c1',
    name: 'Amara Osei',
    direction: 'incoming',
    kind: 'video',
    timestamp: 'Today, 9:41 AM',
    at: NOW - 1 * H,
    duration: '12 min 03 sec',
  },
  {
    id: 'call2',
    contactId: 'c4',
    name: 'Emeka Okafor',
    direction: 'outgoing',
    kind: 'voice',
    timestamp: 'Today, 8:15 AM',
    at: NOW - 2 * H,
    duration: '4 min 32 sec',
  },
  {
    id: 'call3',
    contactId: 'c3',
    name: 'Dalila Mensah',
    direction: 'missed',
    kind: 'voice',
    timestamp: 'Today, 7:50 AM',
    at: NOW - 3 * H,
    duration: null,
  },
  {
    id: 'call4',
    contactId: 'c7',
    name: 'Hassan Kamara',
    direction: 'missed',
    kind: 'video',
    timestamp: 'Yesterday, 10:12 PM',
    at: NOW - 1 * D - 2 * H,
    duration: null,
  },
  {
    id: 'call5',
    contactId: 'c9',
    name: 'James Mutua',
    direction: 'outgoing',
    kind: 'voice',
    timestamp: 'Yesterday, 6:30 PM',
    at: NOW - 1 * D - 5 * H,
    duration: '22 min 11 sec',
  },
  {
    id: 'call6',
    contactId: 'c2',
    name: 'Chidi Nwosu',
    direction: 'incoming',
    kind: 'voice',
    timestamp: 'Yesterday, 2:05 PM',
    at: NOW - 1 * D - 9 * H,
    duration: '1 min 47 sec',
  },
  {
    id: 'call7',
    contactId: 'c13',
    name: 'Ngozi Eze',
    direction: 'outgoing',
    kind: 'video',
    timestamp: 'Mon, 11:00 AM',
    at: NOW - 2 * D,
    duration: '8 min 58 sec',
  },
  {
    id: 'call8',
    contactId: 'c15',
    name: 'Priscilla Asante',
    direction: 'missed',
    kind: 'voice',
    timestamp: 'Sun, 9:20 PM',
    at: NOW - 3 * D,
    duration: null,
  },
  {
    id: 'call9',
    contactId: 'c5',
    name: 'Fatou Diallo',
    direction: 'outgoing',
    kind: 'voice',
    timestamp: 'Sat, 3:45 PM',
    at: NOW - 4 * D,
    duration: '17 min 22 sec',
  },
  {
    id: 'call10',
    contactId: 'c11',
    name: 'Lamine Touré',
    direction: 'incoming',
    kind: 'video',
    timestamp: 'Fri, 8:00 PM',
    at: NOW - 5 * D,
    duration: '31 min 05 sec',
  },
];

export function getCallById(id: string): CallRecord | undefined {
  return mockCalls.find((c) => c.id === id);
}
