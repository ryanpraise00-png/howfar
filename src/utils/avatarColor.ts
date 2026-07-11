const AVATAR_PALETTE = [
  '#14213D', // navy
  '#3D5AFE', // indigo
  '#0B5E5C', // teal
  '#7C3AED', // purple
  '#DC2626', // red
  '#D97706', // amber dark
  '#059669', // green
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
