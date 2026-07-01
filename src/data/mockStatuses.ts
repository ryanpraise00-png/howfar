export type StatusMediaKind = 'image' | 'text';

export interface StatusItem {
  id: string;
  kind: StatusMediaKind;
  // image status
  imageUri?: string;
  // text status
  text?: string;
  bgColor?: string;
  textColor?: string;
  // shared
  caption?: string;
  postedAt: number; // unix ms
}

export interface ContactStatus {
  contactId: string;
  name: string;
  avatarUri?: string;
  items: StatusItem[];
  viewed: boolean; // whether current user has seen ALL items
}

const NOW = Date.now();
const MIN = 60_000;

export const TEXT_BG_COLORS = [
  '#0B5E5C', '#1E9C8C', '#5856D6', '#FF6B35',
  '#FF2D55', '#FF9500', '#34C759', '#007AFF',
];

// Current user's statuses (empty initially so ring is dashed)
export const myStatuses: StatusItem[] = [];

// Contact statuses — newest first within each contact
export const contactStatuses: ContactStatus[] = [
  {
    contactId: 'c1',
    name: 'Amara Osei',
    viewed: false,
    items: [
      {
        id: 's1a',
        kind: 'image',
        imageUri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
        caption: 'Lunch was fire today 🍽️',
        postedAt: NOW - 12 * MIN,
      },
      {
        id: 's1b',
        kind: 'text',
        text: 'Sunday energy ☀️',
        bgColor: '#0B5E5C',
        textColor: '#FFFFFF',
        postedAt: NOW - 8 * MIN,
      },
    ],
  },
  {
    contactId: 'c3',
    name: 'Dalila Mensah',
    viewed: false,
    items: [
      {
        id: 's3a',
        kind: 'image',
        imageUri: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600',
        caption: 'Weekend vibes 🌴',
        postedAt: NOW - 25 * MIN,
      },
    ],
  },
  {
    contactId: 'c7',
    name: 'Hassan Kamara',
    viewed: false,
    items: [
      {
        id: 's7a',
        kind: 'text',
        text: 'New track dropping this Friday 🔥🎵',
        bgColor: '#5856D6',
        textColor: '#FFFFFF',
        postedAt: NOW - 34 * MIN,
      },
      {
        id: 's7b',
        kind: 'image',
        imageUri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        caption: 'Studio session 🎧',
        postedAt: NOW - 31 * MIN,
      },
    ],
  },
  {
    contactId: 'c9',
    name: 'James Mutua',
    viewed: true,
    items: [
      {
        id: 's9a',
        kind: 'image',
        imageUri: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=600',
        caption: 'Morning run done ✅',
        postedAt: NOW - 2 * 60 * MIN,
      },
    ],
  },
  {
    contactId: 'c15',
    name: 'Priscilla Asante',
    viewed: true,
    items: [
      {
        id: 's15a',
        kind: 'text',
        text: 'Living my best life and not apologising for it ✨',
        bgColor: '#FF2D55',
        textColor: '#FFFFFF',
        postedAt: NOW - 3 * 60 * MIN,
      },
    ],
  },
  {
    contactId: 'c5',
    name: 'Fatou Diallo',
    viewed: true,
    items: [
      {
        id: 's5a',
        kind: 'image',
        imageUri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600',
        caption: 'Team lunch! 🥗',
        postedAt: NOW - 5 * 60 * MIN,
      },
    ],
  },
];

export function relativeTime(ms: number): string {
  const diffMin = Math.round((Date.now() - ms) / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const h = Math.round(diffMin / 60);
  return `${h} hour${h === 1 ? '' : 's'} ago`;
}
