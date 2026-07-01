export interface ChatItem {
  id: string;
  name: string;
  avatarUri?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isGroup: boolean;
  isFavorite: boolean;
  isArchived: boolean;
}

export const mockChats: ChatItem[] = [
  {
    id: 'ch1',
    name: 'Amara Osei',
    lastMessage: 'Are you home yet? We\'ve been waiting! 🎉',
    timestamp: '9:41 AM',
    unreadCount: 3,
    isPinned: true,
    isMuted: false,
    isGroup: false,
    isFavorite: true,
    isArchived: false,
  },
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
  },
  {
    id: 'ch3',
    name: 'Chidi Nwosu',
    lastMessage: 'Voice message · 0:42',
    timestamp: 'Yesterday',
    unreadCount: 0,
    isPinned: false,
    isMuted: true,
    isGroup: false,
    isFavorite: false,
    isArchived: false,
  },
  {
    id: 'ch4',
    name: 'Lagos Fam 🏠',
    lastMessage: 'Olu: We\'re on our way, hold on!',
    timestamp: 'Yesterday',
    unreadCount: 5,
    isPinned: false,
    isMuted: false,
    isGroup: true,
    isFavorite: true,
    isArchived: false,
  },
  {
    id: 'ch5',
    name: 'Dalila Mensah',
    lastMessage: 'Okay, see you at 7 then 😊',
    timestamp: 'Mon',
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isGroup: false,
    isFavorite: false,
    isArchived: false,
  },
  {
    id: 'ch6',
    name: 'Ngozi Eze',
    lastMessage: 'The document has been sent ✅',
    timestamp: 'Mon',
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    isGroup: false,
    isFavorite: false,
    isArchived: false,
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
  },
  {
    id: 'ch8',
    name: 'Emeka Okafor',
    lastMessage: 'Let\'s catch up soon, it\'s been a while!',
    timestamp: 'Sun',
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isGroup: false,
    isFavorite: false,
    isArchived: false,
  },
  {
    id: 'ch9',
    name: 'Mercy Asamoah',
    lastMessage: 'Thanks for everything 🙏',
    timestamp: 'Sat',
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isGroup: false,
    isFavorite: false,
    isArchived: false,
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
  },
  {
    id: 'ch11',
    name: 'Kemi Balogun',
    lastMessage: 'I\'ll send the invoice tomorrow',
    timestamp: 'Fri',
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isGroup: false,
    isFavorite: false,
    isArchived: true,
  },
];

export const getActiveChats = () => mockChats.filter((c) => !c.isArchived);
export const getArchivedChats = () => mockChats.filter((c) => c.isArchived);
