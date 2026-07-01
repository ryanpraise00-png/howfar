import { type ChatItem } from './mockChats';

export interface GroupMember {
  contactId: string;
  name: string;
  isAdmin: boolean;
}

export interface GroupChat extends ChatItem {
  isGroup: true;
  groupPhotoUri?: string;
  description?: string;
  members: GroupMember[];
  createdAt: string;
}

// In-memory store so new groups created at runtime persist across navigations
export const groupChats: GroupChat[] = [
  {
    id: 'ch2',
    name: 'HowFar Team 🚀',
    lastMessage: 'Ryan: Just pushed the new build. Check it out!',
    timestamp: '9:15 AM',
    unreadCount: 12,
    isPinned: true,
    isMuted: false,
    isGroup: true,
    isFavorite: false,
    isArchived: false,
    description: 'Building the future of messaging in Africa 🌍',
    createdAt: '2026-01-10',
    members: [
      { contactId: 'me',  name: 'You',             isAdmin: true  },
      { contactId: 'c1',  name: 'Amara Osei',      isAdmin: false },
      { contactId: 'c2',  name: 'Chidi Nwosu',     isAdmin: false },
      { contactId: 'c3',  name: 'Dalila Mensah',   isAdmin: false },
      { contactId: 'c4',  name: 'Emeka Okafor',    isAdmin: true  },
      { contactId: 'c5',  name: 'Fatou Diallo',    isAdmin: false },
    ],
  },
  {
    id: 'ch4',
    name: 'Lagos Fam 🏠',
    lastMessage: "Olu: We're on our way, hold on!",
    timestamp: 'Yesterday',
    unreadCount: 5,
    isPinned: false,
    isMuted: false,
    isGroup: true,
    isFavorite: true,
    isArchived: false,
    description: 'Family first 💛',
    createdAt: '2025-06-12',
    members: [
      { contactId: 'me',  name: 'You',             isAdmin: true  },
      { contactId: 'c7',  name: 'Hassan Kamara',   isAdmin: false },
      { contactId: 'c14', name: 'Olu Adebayo',     isAdmin: false },
      { contactId: 'c8',  name: 'Ifeoma Adeyemi',  isAdmin: false },
      { contactId: 'c9',  name: 'James Mutua',     isAdmin: false },
    ],
  },
  {
    id: 'ch7',
    name: 'Street Vibes 🎶',
    lastMessage: 'Hassan: This track is everything 🔥🔥',
    timestamp: 'Sun',
    unreadCount: 0,
    isPinned: false,
    isMuted: true,
    isGroup: true,
    isFavorite: false,
    isArchived: false,
    description: 'Afrobeats, Amapiano & everything in between',
    createdAt: '2025-09-03',
    members: [
      { contactId: 'me',  name: 'You',             isAdmin: false },
      { contactId: 'c7',  name: 'Hassan Kamara',   isAdmin: true  },
      { contactId: 'c11', name: 'Lamine Touré',    isAdmin: false },
      { contactId: 'c3',  name: 'Dalila Mensah',   isAdmin: false },
    ],
  },
  {
    id: 'ch10',
    name: 'Book Club 📚',
    lastMessage: 'Priscilla: Next meeting is Friday at 6pm',
    timestamp: 'Fri',
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isGroup: true,
    isFavorite: false,
    isArchived: false,
    description: 'One book a month. No excuses.',
    createdAt: '2025-11-20',
    members: [
      { contactId: 'me',  name: 'You',             isAdmin: false },
      { contactId: 'c15', name: 'Priscilla Asante',isAdmin: true  },
      { contactId: 'c6',  name: 'Grace Atieno',    isAdmin: false },
      { contactId: 'c12', name: 'Mercy Asamoah',   isAdmin: false },
      { contactId: 'c13', name: 'Ngozi Eze',       isAdmin: false },
      { contactId: 'c10', name: 'Kemi Balogun',    isAdmin: false },
    ],
  },
];

export function getGroupChat(id: string): GroupChat | undefined {
  return groupChats.find((g) => g.id === id);
}

export function addGroupChat(group: GroupChat) {
  groupChats.unshift(group);
}
