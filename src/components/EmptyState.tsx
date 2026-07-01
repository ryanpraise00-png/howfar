import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors } from '@/src/theme';
import type { AppColors } from '@/src/theme/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  colors?: AppColors;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCta,
  colors = lightColors,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
      {ctaLabel && onCta && (
        <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary }]} onPress={onCta}>
          <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontFamily: 'Sora_700Bold', fontSize: 18, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  cta: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ctaText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
});
