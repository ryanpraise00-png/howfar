export type MessageKind = 'text' | 'image' | 'voice' | 'document' | 'link';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface LinkPreview {
  url: string;
  domain: string;
  title: string;
  description?: string;
}

export interface MessageEntry {
  _type: 'message';
  id: string;
  kind: MessageKind;
  isOutgoing: boolean;
  // group sender info (omitted for 1:1 chats)
  senderId?: string;
  senderName?: string;
  timestamp: string;
  status: MessageStatus;
  // text / link
  text?: string;
  // image
  imageUri?: string;
  imageCaption?: string;
  // voice
  voiceDuration?: string;
  // document
  documentName?: string;
  documentSize?: string;
  // decorations
  replyTo?: { id: string; name: string; text: string };
  forwardedFrom?: string;
  reactions?: string[];
  linkPreview?: LinkPreview;
}

export interface DateSeparator {
  _type: 'date';
  id: string;
  label: string;
}

export interface SystemMessage {
  _type: 'system';
  id: string;
  text: string;
}

export type ListItem = MessageEntry | DateSeparator | SystemMessage;

// Stored newest-first for inverted FlatList (index 0 = bottom of screen)
export const mockMessages: ListItem[] = [
  // ── Today ──────────────────────────────────────────────
  {
    _type: 'message',
    id: 'm12',
    kind: 'text',
    isOutgoing: false,
    timestamp: '9:47 AM',
    status: 'delivered',
    text: 'Haha okay okay, I see you. Almost there! 😄',
    reactions: ['😂', '❤️'],
  },
  {
    _type: 'message',
    id: 'm11',
    kind: 'text',
    isOutgoing: true,
    timestamp: '9:45 AM',
    status: 'read',
    text: "I'm literally 2 minutes away, chill 😭",
    replyTo: { id: 'm10', name: 'Amara', text: 'Where are you?? Everyone is here already!' },
  },
  {
    _type: 'message',
    id: 'm10',
    kind: 'text',
    isOutgoing: false,
    timestamp: '9:43 AM',
    status: 'delivered',
    text: 'Where are you?? Everyone is here already!',
  },
  {
    _type: 'message',
    id: 'm9',
    kind: 'link',
    isOutgoing: true,
    timestamp: '9:40 AM',
    status: 'read',
    text: 'Check out this place for after 👇',
    linkPreview: {
      url: 'https://maps.google.com',
      domain: 'maps.google.com',
      title: 'Terra Kulture Arena — Victoria Island',
      description: 'Event venue · Open until 10 PM',
    },
  },
  {
    _type: 'message',
    id: 'm8',
    kind: 'voice',
    isOutgoing: false,
    timestamp: '9:35 AM',
    status: 'delivered',
    voiceDuration: '0:18',
  },
  {
    _type: 'message',
    id: 'm7',
    kind: 'document',
    isOutgoing: true,
    timestamp: '9:30 AM',
    status: 'read',
    documentName: 'Event_Schedule_2026.pdf',
    documentSize: '284 KB',
    text: 'Full schedule attached 📄',
  },
  {
    _type: 'message',
    id: 'm6',
    kind: 'image',
    isOutgoing: false,
    timestamp: '9:22 AM',
    status: 'delivered',
    imageUri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    imageCaption: 'The spread is ready 🍽️',
    forwardedFrom: 'Lagos Fam 🏠',
  },
  {
    _type: 'message',
    id: 'm5',
    kind: 'text',
    isOutgoing: true,
    timestamp: '9:15 AM',
    status: 'read',
    text: "Are you home yet? We've been waiting! 🎉",
  },
  { _type: 'date', id: 'sep-today', label: 'Today' },

  // ── Yesterday ──────────────────────────────────────────
  {
    _type: 'message',
    id: 'm4',
    kind: 'text',
    isOutgoing: false,
    timestamp: '8:02 PM',
    status: 'delivered',
    text: "Okay, see you tomorrow then! Don't be late 🕐",
  },
  {
    _type: 'message',
    id: 'm3',
    kind: 'text',
    isOutgoing: true,
    timestamp: '7:58 PM',
    status: 'read',
    text: "Tomorrow at 9 AM works. I'll be there!",
  },
  {
    _type: 'message',
    id: 'm2',
    kind: 'text',
    isOutgoing: false,
    timestamp: '7:55 PM',
    status: 'delivered',
    text: "Hey! Are you free tomorrow morning? We're planning a little get-together.",
    reactions: ['👍'],
  },
  { _type: 'date', id: 'sep-yesterday', label: 'Yesterday' },

  // ── System ─────────────────────────────────────────────
  {
    _type: 'system',
    id: 'sys-enc',
    text: 'Your conversation is fully encrypted 🔒',
  },
];
