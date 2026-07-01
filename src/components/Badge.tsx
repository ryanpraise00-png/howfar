import { View, Text, StyleSheet } from 'react-native';
import { lightColors } from '@/src/theme';

interface BadgeProps {
  count: number;
  max?: number;
}

export function Badge({ count, max = 99 }: BadgeProps) {
  if (count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);
  const wide = label.length > 2;

  return (
    <View style={[styles.badge, wide && styles.wide]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: lightColors.accentAmber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  wide: { borderRadius: 10 },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    lineHeight: 14,
  },
});
