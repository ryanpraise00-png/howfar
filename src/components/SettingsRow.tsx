import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '@/src/theme/colors';

interface SettingsRowProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  rightSlot?: React.ReactNode;
  showChevron?: boolean;
  colors: AppColors;
}

export function SettingsRow({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  onPress,
  danger = false,
  rightSlot,
  showChevron = true,
  colors,
}: SettingsRowProps) {
  const labelColor = danger ? colors.error : colors.textPrimary;
  const effectiveIconColor = iconColor ?? (danger ? colors.error : '#FFFFFF');
  const effectiveIconBg = iconBg ?? (danger ? colors.error + '18' : colors.primary);

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: effectiveIconBg }]}>
          <Ionicons name={icon} size={18} color={effectiveIconColor} />
        </View>
      )}
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <View style={styles.right}>
        {rightSlot ?? (
          value ? <Text style={[styles.value, { color: colors.textSecondary }]} numberOfLines={1}>{value}</Text> : null
        )}
        {showChevron && onPress && (
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0, maxWidth: '45%' },
  value: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  chevron: { marginLeft: 2 },
});
