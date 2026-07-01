export const lightColors = {
  primary: '#0B5E5C',
  primaryDark: '#073E3D',
  accentTeal: '#1E9C8C',
  accentAmber: '#F2A93B',
  background: '#FAFAF9',
  surface: '#FFFFFF',
  bubbleIncoming: '#F1F2F6',
  bubbleSent: '#0B5E5C',
  textPrimary: '#1C1C1E',
  textSecondary: '#6B7280',
  textOnPrimary: '#FFFFFF',
  border: '#ECECEA',
  success: '#4ADE80',
  error: '#EF4444',
} as const;

export const darkColors = {
  primary: '#0B5E5C',
  primaryDark: '#073E3D',
  accentTeal: '#1E9C8C',
  accentAmber: '#F2A93B',
  background: '#0D1F1F',
  surface: '#162828',
  bubbleIncoming: '#1E3333',
  bubbleSent: '#0B5E5C',
  textPrimary: '#F0F4F4',
  textSecondary: '#9BADB0',
  textOnPrimary: '#FFFFFF',
  border: '#1F3535',
  success: '#4ADE80',
  error: '#EF4444',
} as const;

export type AppColors = { [K in keyof typeof lightColors]: string };
