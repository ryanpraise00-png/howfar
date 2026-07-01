import {
  Sora_700Bold,
  Sora_600SemiBold,
} from '@expo-google-fonts/sora';
import {
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';

export const fontAssets = {
  Sora_700Bold,
  Sora_600SemiBold,
  Inter_400Regular,
  Inter_500Medium,
};

export const fonts = {
  soraBold: 'Sora_700Bold',
  soraSemiBold: 'Sora_600SemiBold',
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
} as const;

export const textStyles = {
  display: {
    fontFamily: fonts.soraBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fonts.soraBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.soraSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.interRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: fonts.interMedium,
    fontSize: 13,
    lineHeight: 18,
  },
} as const;

export type TextStyleKey = keyof typeof textStyles;
