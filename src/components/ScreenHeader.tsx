import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { ReactNode } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightColors } from '@/src/theme';
import type { AppColors } from '@/src/theme/colors';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'teal' | 'white';
  showBack?: boolean;
  rightSlot?: ReactNode;
  colors?: AppColors;
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

export function ScreenHeader({
  title,
  subtitle,
  variant = 'teal',
  showBack = true,
  rightSlot,
  colors = lightColors,
}: ScreenHeaderProps) {
  const isTeal = variant === 'teal';
  const bg = isTeal ? colors.primary : colors.surface;
  const fg = isTeal ? '#FFFFFF' : colors.textPrimary;
  const subFg = isTeal ? 'rgba(255,255,255,0.75)' : colors.textSecondary;

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: STATUS_BAR_HEIGHT }]}>
      <View style={styles.inner}>
        {showBack ? (
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={fg} />
          </TouchableOpacity>
        ) : (
          <View style={styles.back} />
        )}

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: fg }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: subFg }]} numberOfLines={1}>{subtitle}</Text>}
        </View>

        <View style={styles.right}>{rightSlot ?? <View style={{ width: 40 }} />}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 8,
    gap: 4,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1, paddingHorizontal: 4 },
  title: { fontFamily: 'Sora_700Bold', fontSize: 17 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
});
