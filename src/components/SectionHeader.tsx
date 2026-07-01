import { View, Text, StyleSheet } from 'react-native';

interface SectionHeaderProps {
  label: string;
  color?: string;
  backgroundColor?: string;
}

export function SectionHeader({
  label,
  color = '#6B7280',
  backgroundColor = '#FAFAF9',
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  text: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
