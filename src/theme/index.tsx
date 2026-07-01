import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, AppColors } from './colors';
import { textStyles, fontAssets } from './typography';
import { spacing, radius } from './spacing';
import { useFonts } from 'expo-font';

export { lightColors, darkColors } from './colors';
export { textStyles, fontAssets, fonts } from './typography';
export { spacing, radius } from './spacing';

export interface AppTheme {
  colors: AppColors;
  textStyles: typeof textStyles;
  spacing: typeof spacing;
  radius: typeof radius;
  isDark: boolean;
}

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [fontsLoaded] = useFonts(fontAssets);

  const theme: AppTheme = {
    colors: isDark ? darkColors : lightColors,
    textStyles,
    spacing,
    radius,
    isDark,
  };

  // Don't render until fonts are ready
  if (!fontsLoaded) return null;

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
