export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarUri?: string;
  isOnline: boolean;
  statusText: string;
}

export const mockContacts: Contact[] = [
  { id: 'c1',  name: 'Amara Osei',      phone: '+233 24 123 4567', isOnline: true,  statusText: 'At the office 💼' },
  { id: 'c2',  name: 'Chidi Nwosu',     phone: '+234 80 234 5678', isOnline: false, statusText: 'Busy — in a meeting' },
  { id: 'c3',  name: 'Dalila Mensah',   phone: '+233 55 345 6789', isOnline: true,  statusText: 'Available 🙂' },
  { id: 'c4',  name: 'Emeka Okafor',    phone: '+234 81 456 7890', isOnline: false, statusText: "Hey! I'm on HowFar" },
  { id: 'c5',  name: 'Fatou Diallo',    phone: '+221 77 567 8901', isOnline: true,  statusText: 'Working from home 🏠' },
  { id: 'c6',  name: 'Grace Atieno',    phone: '+254 72 678 9012', isOnline: false, statusText: 'On holiday until Monday' },
  { id: 'c7',  name: 'Hassan Kamara',   phone: '+232 76 789 0123', isOnline: true,  statusText: '🎵 Listening to Afrobeats' },
  { id: 'c8',  name: 'Ifeoma Adeyemi',  phone: '+234 70 890 1234', isOnline: false, statusText: "Hey! I'm on HowFar" },
  { id: 'c9',  name: 'James Mutua',     phone: '+254 11 901 2345', isOnline: true,  statusText: 'Free to chat 😊' },
  { id: 'c10', name: 'Kemi Balogun',    phone: '+234 90 012 3456', isOnline: false, statusText: 'In transit 🚌' },
  { id: 'c11', name: 'Lamine Touré',    phone: '+221 33 123 4567', isOnline: true,  statusText: 'Bonjour! 🇫🇷' },
  { id: 'c12', name: 'Mercy Asamoah',   phone: '+233 20 234 5678', isOnline: false, statusText: 'Do not disturb 🔕' },
  { id: 'c13', name: 'Ngozi Eze',       phone: '+234 71 345 6789', isOnline: true,  statusText: 'Always grateful 🙏' },
  { id: 'c14', name: 'Olu Adebayo',     phone: '+234 80 456 7890', isOnline: false, statusText: "Hey! I'm on HowFar" },
  { id: 'c15', name: 'Priscilla Asante',phone: '+233 24 567 8901', isOnline: true,  statusText: 'Living my best life ✨' },
];
